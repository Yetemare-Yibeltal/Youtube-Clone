import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as analyticsService from "../services/analytics.service.js";

export const getChannelAnalytics = asyncHandler(async (req, res) => {
  const result = await analyticsService.getChannelAnalytics(
    req.params.channelId,
    req.user,
    req.query,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Channel analytics fetched successfully"),
    );
});

export const getVideoAnalytics = asyncHandler(async (req, res) => {
  const result = await analyticsService.getVideoAnalytics(
    req.params.videoId,
    req.user,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Video analytics fetched successfully"));
});

export const getTopVideos = asyncHandler(async (req, res) => {
  const result = await analyticsService.getTopVideos(
    req.params.channelId,
    req.user,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Top videos fetched successfully"));
});
