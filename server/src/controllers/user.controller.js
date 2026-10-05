import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as userService from "../services/user.service.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userService.getCurrentUser(req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

export const getUserByUsername = asyncHandler(async (req, res) => {
  const result = await userService.getUserByUsername(
    req.params.username,
    req.user,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "User fetched successfully"));
});

export const updateAccount = asyncHandler(async (req, res) => {
  const user = await userService.updateAccount(req.user._id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Account updated successfully"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  const user = await userService.updateCoverImage(req.user._id, req.file);
  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user._id, req.body.password);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Account deleted successfully"));
});

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully"));
});
