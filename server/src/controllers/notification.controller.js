import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as notificationService from "../services/notification.service.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications fetched successfully"));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Unread count fetched successfully"));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.user._id,
    req.params.notificationId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, result, "All notifications marked as read"));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(
    req.user._id,
    req.params.notificationId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully"));
});
