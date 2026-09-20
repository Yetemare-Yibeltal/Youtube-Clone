import crypto from "node:crypto";
import { withTransaction } from "../config/database.js";
import { env } from "../config/environment.js";
import { signAccessToken } from "../config/jwt.js";
import * as User from "../models/User.js";
import * as Channel from "../models/Channel.js";
import * as RefreshToken from "../models/RefreshToken.js";
import * as UserToken from "../models/UserToken.js";
import * as AuditLog from "../models/AuditLog.js";
import {
  hashPassword,
  verifyPassword,
  verifyAgainstDummy,
} from "../utils/password.js";
import { generateOpaqueToken, hashToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./email.service.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const REUSE_GRACE_MS = 10_000; // tolerates two tabs refreshing at the same moment

const slugify = (value) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

const generateHandle = async (displayName) => {
  const base = slugify(displayName) || "user";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `${base}${crypto.randomInt(1000, 10000)}`;
    if (!(await Channel.handleTaken(candidate))) return candidate;
  }
  throw ApiError.conflict(
    "Could not generate a unique handle, please choose one",
    { code: "HANDLE_TAKEN" },
  );
};

const issueSession = async (user, ctx, client) => {
  const refreshToken = generateOpaqueToken();
  await RefreshToken.create(
    {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.refreshTtlMs),
      userAgent: ctx.userAgent,
      ip: ctx.ip,
    },
    client,
  );
  return { accessToken: signAccessToken(user), refreshToken };
};

const issueUserToken = async (userId, purpose, ttlMs) => {
  const token = generateOpaqueToken();
  await UserToken.issue({
    userId,
    purpose,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
};

const dispatchVerificationEmail = (user) => {
  issueUserToken(user.id, "email_verification", VERIFY_TTL_MS)
    .then((token) =>
      sendVerificationEmail({ to: user.email, name: user.display_name, token }),
    )
    .catch((error) => logger.error("Could not send verification email", error));
};

const authPayload = async (user, session) => ({
  user: User.toPublicUser(user),
  channel: Channel.toPublicChannel(await Channel.findByUserId(user.id)),
  ...session,
});

export const register = async (
  { email, password, displayName, handle },
  ctx,
) => {
  const passwordHash = await hashPassword(password);
  const finalHandle = handle ?? (await generateHandle(displayName));

  let created;
  try {
    created = await withTransaction(async (client) => {
      const user = await User.create(
        { email, passwordHash, displayName },
        client,
      );
      const channel = await Channel.create(
        { userId: user.id, handle: finalHandle, name: displayName },
        client,
      );
      return { user, channel };
    });
  } catch (error) {
    if (error.code === "23505" && error.constraint === "users_email_key") {
      throw ApiError.conflict("An account with this email already exists", {
        code: "EMAIL_TAKEN",
      });
    }
    if (error.code === "23505" && error.constraint === "channels_handle_key") {
      throw ApiError.conflict("This handle is already taken", {
        code: "HANDLE_TAKEN",
      });
    }
    throw error;
  }

  const { user, channel } = created;
  const session = await issueSession(user, ctx);

  await AuditLog.record({
    actorId: user.id,
    action: "auth.register",
    entityType: "user",
    entityId: user.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  dispatchVerificationEmail(user);

  return {
    user: User.toPublicUser(user),
    channel: Channel.toPublicChannel(channel),
    ...session,
  };
};

export const login = async ({ email, password }, ctx) => {
  const row = await User.findByEmailWithPassword(email);

  const valid = row
    ? await verifyPassword(password, row.password_hash)
    : (await verifyAgainstDummy(password), false);

  if (!valid) {
    await AuditLog.record({
      action: "auth.login_failed",
      metadata: { email },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    throw ApiError.unauthorized("Invalid email or password", {
      code: "INVALID_CREDENTIALS",
    });
  }
  if (!row.is_active) {
    throw ApiError.forbidden("This account has been disabled", {
      code: "ACCOUNT_DISABLED",
    });
  }

  await User.touchLastLogin(row.id);
  const session = await issueSession(row, ctx);

  await AuditLog.record({
    actorId: row.id,
    action: "auth.login",
    entityType: "user",
    entityId: row.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return authPayload(row, session);
};

export const refresh = async (rawToken, ctx) => {
  const stored = await RefreshToken.findByHash(hashToken(rawToken));
  if (!stored)
    throw ApiError.unauthorized("Invalid refresh token", {
      code: "INVALID_REFRESH_TOKEN",
    });

  if (stored.revoked_at) {
    const justRotated =
      Date.now() - new Date(stored.revoked_at).getTime() < REUSE_GRACE_MS;
    if (!justRotated) {
      await RefreshToken.revokeAllForUser(stored.user_id);
      await AuditLog.record({
        actorId: stored.user_id,
        action: "auth.refresh_reuse_detected",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }
    throw ApiError.unauthorized("Refresh token is no longer valid", {
      code: "TOKEN_REUSED",
    });
  }

  if (new Date(stored.expires_at) <= new Date()) {
    throw ApiError.unauthorized("Refresh token expired", {
      code: "REFRESH_EXPIRED",
    });
  }

  const user = await User.findById(stored.user_id);
  if (!user || !user.is_active)
    throw ApiError.unauthorized("Account is unavailable", {
      code: "ACCOUNT_UNAVAILABLE",
    });

  const rotated = await RefreshToken.revoke(stored.id);
  if (!rotated)
    throw ApiError.unauthorized("Refresh token is no longer valid", {
      code: "TOKEN_REUSED",
    });

  const session = await issueSession(user, ctx);
  return authPayload(user, session);
};

export const logout = async (rawToken) => {
  if (rawToken) await RefreshToken.revokeByHash(hashToken(rawToken));
};

export const logoutAll = async (userId, ctx) => {
  await RefreshToken.revokeAllForUser(userId);
  await AuditLog.record({
    actorId: userId,
    action: "auth.logout_all",
    entityType: "user",
    entityId: userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user)
    throw ApiError.unauthorized("Account no longer exists", {
      code: "ACCOUNT_UNAVAILABLE",
    });
  if (!user.is_active)
    throw ApiError.forbidden("This account has been disabled", {
      code: "ACCOUNT_DISABLED",
    });

  return {
    user: User.toPublicUser(user),
    channel: Channel.toPublicChannel(await Channel.findByUserId(userId)),
  };
};

export const verifyEmail = async (rawToken) => {
  const userId = await UserToken.consume(
    "email_verification",
    hashToken(rawToken),
  );
  if (!userId) {
    throw ApiError.badRequest(
      "This verification link is invalid or has expired",
      { code: "INVALID_TOKEN" },
    );
  }
  await User.markEmailVerified(userId);
};

export const resendVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("Account no longer exists");
  if (user.email_verified_at)
    throw ApiError.conflict("Email is already verified", {
      code: "ALREADY_VERIFIED",
    });
  dispatchVerificationEmail(user);
};

export const forgotPassword = async ({ email }, ctx) => {
  const user = await User.findByEmailWithPassword(email);
  if (user?.is_active) {
    issueUserToken(user.id, "password_reset", RESET_TTL_MS)
      .then((token) =>
        sendPasswordResetEmail({
          to: user.email,
          name: user.display_name,
          token,
        }),
      )
      .catch((error) =>
        logger.error("Could not send password reset email", error),
      );
    await AuditLog.record({
      actorId: user.id,
      action: "auth.password_reset_requested",
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }
  // The caller always responds the same way, so this can't be used to discover accounts.
};

export const resetPassword = async ({ token, password }, ctx) => {
  const passwordHash = await hashPassword(password);

  const userId = await withTransaction(async (client) => {
    const id = await UserToken.consume(
      "password_reset",
      hashToken(token),
      client,
    );
    if (!id)
      throw ApiError.badRequest("This reset link is invalid or has expired", {
        code: "INVALID_TOKEN",
      });

    await User.updatePassword(id, passwordHash, client);
    await User.markEmailVerified(id, client);
    await RefreshToken.revokeAllForUser(id, client);
    return id;
  });

  await AuditLog.record({
    actorId: userId,
    action: "auth.password_reset",
    entityType: "user",
    entityId: userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

export const changePassword = async (
  { userId, currentPassword, newPassword },
  ctx,
) => {
  const currentHash = await User.getPasswordHash(userId);
  if (!currentHash || !(await verifyPassword(currentPassword, currentHash))) {
    throw ApiError.badRequest("Current password is incorrect", {
      code: "INVALID_CREDENTIALS",
    });
  }

  const newHash = await hashPassword(newPassword);
  await withTransaction(async (client) => {
    await User.updatePassword(userId, newHash, client);
    await RefreshToken.revokeAllForUser(userId, client);
  });

  const user = await User.findById(userId);
  const session = await issueSession(user, ctx);

  await AuditLog.record({
    actorId: userId,
    action: "auth.password_changed",
    entityType: "user",
    entityId: userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return session;
};
