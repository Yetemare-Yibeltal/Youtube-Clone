import * as User from "../models/User.js";
import * as AuditLog from "../models/AuditLog.js";
import { verifyPassword } from "../utils/password.js";
import { ApiError } from "../utils/apiError.js";

export const updateProfile = async (userId, changes) => {
  const row = await User.updateProfile(userId, changes);
  if (!row) throw ApiError.notFound("User not found");
  return User.toPublicUser(row);
};

// Deleting the user cascades to the channel, videos, comments, subscriptions and tokens.
export const deleteAccount = async ({ userId, password }, ctx) => {
  const hash = await User.getPasswordHash(userId);
  if (!hash || !(await verifyPassword(password, hash))) {
    throw ApiError.badRequest("Password is incorrect", {
      code: "INVALID_CREDENTIALS",
    });
  }

  await AuditLog.record({
    actorId: userId,
    action: "user.delete",
    entityType: "user",
    entityId: userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  await User.deleteById(userId);
};
