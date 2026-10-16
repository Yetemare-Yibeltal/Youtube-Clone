import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as subscriptionService from "../services/subscription.service.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  const result = await subscriptionService.toggleSubscription(
    req.user,
    req.params.channelId,
  );
  const message = result.subscribed
    ? "Subscribed successfully"
    : "Unsubscribed successfully";
  res.status(200).json(new ApiResponse(200, result, message));
});

export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const result = await subscriptionService.getSubscriptionStatus(
    req.user._id,
    req.params.channelId,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Subscription status fetched successfully"),
    );
});

export const listMySubscriptions = asyncHandler(async (req, res) => {
  const result = await subscriptionService.listMySubscriptions(
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Subscriptions fetched successfully"));
});

export const listChannelSubscribers = asyncHandler(async (req, res) => {
  const result = await subscriptionService.listChannelSubscribers(
    req.user,
    req.params.channelId,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Subscribers fetched successfully"));
});

export const updateNotificationPreference = asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.updateNotificationPreference(
    req.user._id,
    req.params.channelId,
    req.body.notificationsEnabled,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Notification preference updated"),
    );
});
