import Like from "../models/Like.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import ApiError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";
import { queueNotification } from "../jobs/notification.job.js";
import { syncLikedVideosPlaylist } from "./playlist.service.js";

const CHANNEL_SELECT = "name handle avatar subscribersCount isVerified";

const counterFor = (type) => (type === "like" ? "likesCount" : "dislikesCount");

export async function toggleVideoLike(user, videoId, type) {
  const video = await Video.findById(videoId).select("owner status");
  if (!video || video.status !== "published")
    throw ApiError.notFound("Video not found");

  const filter = { user: user._id, targetType: "video", video: video._id };
  const existing = await Like.findOne(filter);
  const increments = { likesCount: 0, dislikesCount: 0 };
  let status = type;
  const wasLiked = existing?.type === "like";

  if (!existing) {
    await Like.create({ ...filter, type });
    increments[counterFor(type)] += 1;
  } else if (existing.type === type) {
    await existing.deleteOne();
    increments[counterFor(type)] -= 1;
    status = null;
  } else {
    increments[counterFor(existing.type)] -= 1;
    increments[counterFor(type)] += 1;
    existing.type = type;
    await existing.save();
  }

  const updated = await Video.findByIdAndUpdate(
    video._id,
    { $inc: increments },
    { new: true },
  ).select("likesCount dislikesCount");

  syncLikedVideosPlaylist(user._id, video._id, status === "like").catch(
    (error) =>
      logger.error(`Could not sync liked videos playlist: ${error.message}`),
  );

  if (status === "like" && !wasLiked) {
    queueNotification({
      recipient: video.owner,
      sender: user._id,
      type: "like",
      video: video._id,
      message: `${user.fullName} liked your video`,
    });
  }

  return {
    status,
    likesCount: Math.max(0, updated.likesCount),
    dislikesCount: Math.max(0, updated.dislikesCount),
  };
}

export async function toggleCommentLike(user, commentId, type) {
  const comment = await Comment.findById(commentId).select("owner video");
  if (!comment) throw ApiError.notFound("Comment not found");

  const filter = {
    user: user._id,
    targetType: "comment",
    comment: comment._id,
  };
  const existing = await Like.findOne(filter);
  let likeDelta = 0;
  let status = type;

  if (!existing) {
    await Like.create({ ...filter, type });
    likeDelta = type === "like" ? 1 : 0;
  } else if (existing.type === type) {
    await existing.deleteOne();
    likeDelta = type === "like" ? -1 : 0;
    status = null;
  } else {
    likeDelta = type === "like" ? 1 : -1;
    existing.type = type;
    await existing.save();
  }

  const updated = await Comment.findByIdAndUpdate(
    comment._id,
    { $inc: { likesCount: likeDelta } },
    { new: true },
  ).select("likesCount");

  return { status, likesCount: Math.max(0, updated.likesCount) };
}

export async function getVideoLikeStatus(userId, videoId) {
  const reaction = await Like.findOne({
    user: userId,
    targetType: "video",
    video: videoId,
  }).select("type");
  return { status: reaction?.type || null };
}

export async function listLikedVideos(user, query) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { user: user._id, targetType: "video", type: "like" };

  const [likes, total] = await Promise.all([
    Like.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "video",
        populate: { path: "channel", select: CHANNEL_SELECT },
      })
      .lean(),
    Like.countDocuments(filter),
  ]);

  const docs = likes
    .map((like) => like.video)
    .filter(
      (video) =>
        video &&
        video.status === "published" &&
        (video.visibility !== "private" ||
          String(video.owner) === String(user._id)),
    );

  return buildPaginatedResult({ docs, total, page, limit });
}

export default {
  toggleVideoLike,
  toggleCommentLike,
  getVideoLikeStatus,
  listLikedVideos,
};
