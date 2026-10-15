import User from "../models/User.js";
import Video from "../models/Video.js";
import WatchHistory from "../models/WatchHistory.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";

const CHANNEL_SELECT = "name handle avatar subscribersCount isVerified";

export const listHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = { user: req.user._id };

  const [entries, total] = await Promise.all([
    WatchHistory.find(filter)
      .sort({ watchedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "video",
        populate: { path: "channel", select: CHANNEL_SELECT },
      })
      .lean(),
    WatchHistory.countDocuments(filter),
  ]);

  const result = buildPaginatedResult({
    docs: entries.filter((entry) => entry.video),
    total,
    page,
    limit,
  });
  const payload = {
    ...result,
    isEnabled: req.user.isWatchHistoryEnabled !== false,
  };
  res
    .status(200)
    .json(new ApiResponse(200, payload, "Watch history fetched successfully"));
});

export const recordProgress = asyncHandler(async (req, res) => {
  if (req.user.isWatchHistoryEnabled === false) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { recorded: false }, "Watch history is paused"),
      );
  }

  const video = await Video.findById(req.params.videoId).select("_id");
  if (!video) throw ApiError.notFound("Video not found");

  await WatchHistory.findOneAndUpdate(
    { user: req.user._id, video: video._id },
    {
      $set: {
        progressSeconds: req.body.progressSeconds,
        watchedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { recorded: true }, "Progress saved"));
});

export const removeFromHistory = asyncHandler(async (req, res) => {
  await WatchHistory.deleteOne({
    user: req.user._id,
    video: req.params.videoId,
  });
  res
    .status(200)
    .json(new ApiResponse(200, null, "Removed from watch history"));
});

export const clearHistory = asyncHandler(async (req, res) => {
  await WatchHistory.deleteMany({ user: req.user._id });
  res.status(200).json(new ApiResponse(200, null, "Watch history cleared"));
});

export const toggleHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    isWatchHistoryEnabled: req.body.isEnabled,
  });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isEnabled: req.body.isEnabled },
        "Watch history setting updated",
      ),
    );
});
