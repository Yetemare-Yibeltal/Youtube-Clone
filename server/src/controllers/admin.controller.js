import User from "../models/User.js";
import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import Report from "../models/Report.js";
import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";
import * as videoService from "../services/video.service.js";
import * as commentService from "../services/comment.service.js";

async function logAdminAction(actor, action, target, meta = {}) {
  try {
    await AuditLog.create({
      actor,
      action,
      targetType: target?.type,
      targetId: target?.id,
      metadata: meta,
    });
  } catch {
    // audit logging must never break the primary admin flow
  }
}

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalChannels,
    totalVideos,
    totalComments,
    pendingReports,
    bannedUsers,
    viewsAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Channel.countDocuments(),
    Video.countDocuments({ status: "published" }),
    Comment.countDocuments(),
    Report.countDocuments({ status: "pending" }),
    User.countDocuments({ isBanned: true }),
    Video.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]),
  ]);

  const totalViews = viewsAgg[0]?.totalViews || 0;

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          totalUsers,
          totalChannels,
          totalVideos,
          totalComments,
          pendingReports,
          bannedUsers,
          totalViews,
        },
        "Dashboard stats fetched successfully",
      ),
    );
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.action)
    filter.action = { $regex: req.query.action, $options: "i" };
  if (req.query.actor) filter.actor = req.query.actor;

  const [docs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "username fullName"),
    AuditLog.countDocuments(filter),
  ]);

  const result = buildPaginatedResult({ docs, total, page, limit });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Audit logs fetched successfully"));
});

export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (userId === req.user._id.toString()) {
    throw ApiError.badRequest("You cannot ban your own account");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isBanned: true,
      banReason: reason || "Violation of community guidelines",
    },
    { new: true },
  );
  if (!user) throw ApiError.notFound("User not found");

  await logAdminAction(
    req.user._id,
    "admin.banUser",
    { type: "User", id: user._id },
    { reason },
  );

  res.status(200).json(new ApiResponse(200, user, "User banned successfully"));
});

export const unbanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { isBanned: false, banReason: "" },
    { new: true },
  );
  if (!user) throw ApiError.notFound("User not found");

  await logAdminAction(req.user._id, "admin.unbanUser", {
    type: "User",
    id: user._id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, user, "User unbanned successfully"));
});

export const setChannelVerification = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { isVerified } = req.body;

  const channel = await Channel.findByIdAndUpdate(
    channelId,
    { isVerified },
    { new: true },
  );
  if (!channel) throw ApiError.notFound("Channel not found");

  await logAdminAction(
    req.user._id,
    "admin.setChannelVerification",
    { type: "Channel", id: channel._id },
    {
      isVerified,
    },
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel,
        "Channel verification updated successfully",
      ),
    );
});

export const deleteVideoAsAdmin = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  await videoService.deleteVideo(videoId, req.user);
  await logAdminAction(req.user._id, "admin.deleteVideo", {
    type: "Video",
    id: videoId,
  });
  res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

export const deleteCommentAsAdmin = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  await commentService.deleteComment(commentId, req.user);
  await logAdminAction(req.user._id, "admin.deleteComment", {
    type: "Comment",
    id: commentId,
  });
  res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export const listAllVideosForModeration = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [docs, total] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name handle")
      .populate("owner", "username email"),
    Video.countDocuments(filter),
  ]);

  const result = buildPaginatedResult({ docs, total, page, limit });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});
