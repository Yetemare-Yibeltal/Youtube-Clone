import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendNoContent, sendSuccess } from "../utils/apiResponse.js";
import { clearRefreshCookie } from "../utils/cookies.js";

export const updateMe = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    user: await userService.updateProfile(req.user.id, req.validated.body),
  });
});

export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteAccount(
    { userId: req.user.id, password: req.validated.body.password },
    {
      ip: req.ip ?? null,
      userAgent: req.get("user-agent")?.slice(0, 255) ?? null,
    },
  );
  clearRefreshCookie(res);
  sendNoContent(res);
});
