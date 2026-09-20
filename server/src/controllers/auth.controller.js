import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendCreated,
  sendSuccess,
  sendNoContent,
} from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import {
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from "../utils/cookies.js";

const requestContext = (req) => ({
  ip: req.ip ?? null,
  userAgent: req.get("user-agent")?.slice(0, 255) ?? null,
});

// The refresh token travels only in an httpOnly cookie, never in the JSON body.
const respondWithSession = (
  res,
  { refreshToken, ...payload },
  send = sendSuccess,
) => {
  setRefreshCookie(res, refreshToken);
  return send(res, payload);
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(
    req.validated.body,
    requestContext(req),
  );
  respondWithSession(res, result, sendCreated);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(
    req.validated.body,
    requestContext(req),
  );
  respondWithSession(res, result);
});

export const refresh = asyncHandler(async (req, res) => {
  const token = readRefreshCookie(req);
  if (!token)
    throw ApiError.unauthorized("No refresh token", {
      code: "NO_REFRESH_TOKEN",
    });

  try {
    const result = await authService.refresh(token, requestContext(req));
    respondWithSession(res, result);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401)
      clearRefreshCookie(res);
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshCookie(req));
  clearRefreshCookie(res);
  sendNoContent(res);
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id, requestContext(req));
  clearRefreshCookie(res);
  sendNoContent(res);
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, await authService.getMe(req.user.id));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.validated.body.token);
  sendSuccess(res, { message: "Email verified" });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user.id);
  sendSuccess(res, { message: "Verification email sent" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.validated.body, requestContext(req));
  sendSuccess(res, {
    message: "If an account exists for that email, a reset link has been sent",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.validated.body, requestContext(req));
  clearRefreshCookie(res);
  sendSuccess(res, { message: "Password updated. Please log in again" });
});

export const changePassword = asyncHandler(async (req, res) => {
  const session = await authService.changePassword(
    { userId: req.user.id, ...req.validated.body },
    requestContext(req),
  );
  respondWithSession(res, session);
});
