import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
import Comment from "../models/Comment.js";
import Like from "../models/Like.js";
import Notification from "../models/Notification.js";
import Playlist from "../models/Playlist.js";
import Subscription from "../models/Subscription.js";
import VideoView from "../models/VideoView.js";
import WatchHistory from "../models/WatchHistory.js";
import ApiError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";
import {
  uploadBufferToCloudinary,
  destroyCloudinaryAsset,
} from "../config/cloudinary.js";
import { queueVideoProcessing } from "../jobs/videoProcessing.job.js";

const CHANNEL_SELECT = "name handle avatar subscribersCount isVerified owner";
const VIEW_WINDOW_MS = 30 * 60 * 1000;
const TRENDING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const EDITABLE_FIELDS = [
  "title",
  "description",
  "tags",
  "category",
  "visibility",
  "isCommentsEnabled",
  "ageRestricted",
];

function isOwnerOf(video, user) {
  return Boolean(
    user && String(video.owner?._id || video.owner) === String(user._id),
  );
}

function canManage(video, user) {
  return isOwnerOf(video, user) || user?.role === "admin";
}

function sortFor(sortBy) {
  switch (sortBy) {
    case "oldest":
      return { publishedAt: 1 };
    case "popular":
    case "trending":
      return { views: -1, publishedAt: -1 };
    default:
      return { publishedAt: -1 };
  }
}

function releaseAsset(asset, resourceType) {
  if (!asset?.publicId) return;
  destroyCloudinaryAsset(asset.publicId, resourceType).catch((error) =>
    logger.error(
      `Could not remove ${resourceType} asset ${asset.publicId}: ${error.message}`,
    ),
  );
}

export async function uploadVideo(userId, body, files = {}) {
  const channel = await Channel.findOne({ owner: userId });
  if (!channel)
    throw ApiError.badRequest("Create a channel before uploading videos");

  const videoFile = files.video?.[0];
  const thumbnailFile = files.thumbnail?.[0];
  if (!videoFile) throw ApiError.badRequest("Video file is required");
  if (!thumbnailFile) throw ApiError.badRequest("Thumbnail image is required");

  const [videoResult, thumbnailResult] = await Promise.allSettled([
    uploadBufferToCloudinary(videoFile.buffer, {
      resource_type: "video",
      folder: "vidtube/videos",
    }),
    uploadBufferToCloudinary(thumbnailFile.buffer, {
      resource_type: "image",
      folder: "vidtube/thumbnails",
    }),
  ]);

  if (
    videoResult.status === "rejected" ||
    thumbnailResult.status === "rejected"
  ) {
    if (videoResult.status === "fulfilled")
      releaseAsset({ publicId: videoResult.value.public_id }, "video");
    if (thumbnailResult.status === "fulfilled")
      releaseAsset({ publicId: thumbnailResult.value.public_id }, "image");
    throw videoResult.status === "rejected"
      ? videoResult.reason
      : thumbnailResult.reason;
  }

  const videoUpload = videoResult.value;
  const thumbnailUpload = thumbnailResult.value;

  const video = await Video.create({
    owner: userId,
    channel: channel._id,
    title: body.title,
    description: body.description,
    tags: body.tags,
    category: body.category,
    visibility: body.visibility,
    isShort: body.isShort,
    ageRestricted: body.ageRestricted,
    duration: Math.round(videoUpload.duration || 0),
    status: "processing",
    videoFile: { url: videoUpload.secure_url, publicId: videoUpload.public_id },
    thumbnail: {
      url: thumbnailUpload.secure_url,
      publicId: thumbnailUpload.public_id,
    },
  });

  await Channel.updateOne({ _id: channel._id }, { $inc: { videosCount: 1 } });
  queueVideoProcessing(video._id);

  return video;
}

export async function listVideos(query) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {
    status: "published",
    visibility: "public",
    isShort: query.isShort === "true",
  };
  if (query.category) filter.category = query.category;
  if (query.channelId) filter.channel = query.channelId;
  if (query.sortBy === "trending")
    filter.publishedAt = { $gte: new Date(Date.now() - TRENDING_WINDOW_MS) };

  const [docs, total] = await Promise.all([
    Video.find(filter)
      .sort(sortFor(query.sortBy))
      .skip(skip)
      .limit(limit)
      .populate("channel", CHANNEL_SELECT)
      .lean(),
    Video.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function getVideoById(videoId, viewer) {
  const video = await Video.findById(videoId).populate(
    "channel",
    CHANNEL_SELECT,
  );
  if (!video) throw ApiError.notFound("Video not found");

  const isOwner = isOwnerOf(video, viewer);
  if (video.visibility === "private" && !isOwner)
    throw ApiError.forbidden("This video is private");
  if (video.status !== "published" && !isOwner)
    throw ApiError.notFound("Video not found");

  let isSubscribed = false;
  let viewerLikeStatus = null;

  if (viewer) {
    const [subscription, reaction] = await Promise.all([
      Subscription.exists({
        subscriber: viewer._id,
        channel: video.channel._id,
      }),
      Like.findOne({
        user: viewer._id,
        targetType: "video",
        video: video._id,
      }).select("type"),
    ]);
    isSubscribed = Boolean(subscription);
    viewerLikeStatus = reaction?.type || null;
  }

  return { video, isOwner, isSubscribed, viewerLikeStatus };
}

export async function updateVideo(videoId, requester, updates) {
  const video = await Video.findById(videoId);
  if (!video) throw ApiError.notFound("Video not found");
  if (!canManage(video, requester))
    throw ApiError.forbidden("You cannot edit this video");

  for (const field of EDITABLE_FIELDS) {
    if (updates[field] !== undefined) video[field] = updates[field];
  }

  await video.save();
  return video;
}

export async function updateVideoThumbnail(videoId, requester, file) {
  if (!file) throw ApiError.badRequest("Thumbnail image is required");

  const video = await Video.findById(videoId);
  if (!video) throw ApiError.notFound("Video not found");
  if (!canManage(video, requester))
    throw ApiError.forbidden("You cannot edit this video");

  const previous = video.thumbnail;
  const upload = await uploadBufferToCloudinary(file.buffer, {
    resource_type: "image",
    folder: "vidtube/thumbnails",
  });

  video.thumbnail = { url: upload.secure_url, publicId: upload.public_id };
  await video.save();
  releaseAsset(previous, "image");

  return video;
}

export async function deleteVideoCascade(video) {
  await Promise.all([
    Comment.deleteMany({ video: video._id }),
    Like.deleteMany({ video: video._id }),
    VideoView.deleteMany({ video: video._id }),
    WatchHistory.deleteMany({ video: video._id }),
    Notification.deleteMany({ video: video._id }),
    Playlist.updateMany(
      { videos: video._id },
      { $pull: { videos: video._id } },
    ),
  ]);

  await Channel.updateOne(
    { _id: video.channel },
    { $inc: { videosCount: -1, totalViews: -(video.views || 0) } },
  );
  await video.deleteOne();

  releaseAsset(video.videoFile, "video");
  releaseAsset(video.thumbnail, "image");
}

export async function deleteVideo(videoId, requester) {
  const video = await Video.findById(videoId);
  if (!video) throw ApiError.notFound("Video not found");
  if (!canManage(video, requester))
    throw ApiError.forbidden("You cannot delete this video");

  await deleteVideoCascade(video);
  return true;
}

export async function recordView(videoId, viewer, sessionId) {
  const video = await Video.findById(videoId).select("channel status");
  if (!video || video.status !== "published")
    throw ApiError.notFound("Video not found");

  const identity = viewer ? { viewer: viewer._id } : { sessionId };
  const alreadyCounted = await VideoView.exists({
    video: video._id,
    createdAt: { $gte: new Date(Date.now() - VIEW_WINDOW_MS) },
    ...identity,
  });

  if (!alreadyCounted) {
    await VideoView.create({
      video: video._id,
      viewer: viewer?._id || null,
      sessionId,
    });
    await Promise.all([
      Video.updateOne({ _id: video._id }, { $inc: { views: 1 } }),
      Channel.updateOne({ _id: video.channel }, { $inc: { totalViews: 1 } }),
    ]);
  }

  if (viewer && viewer.isWatchHistoryEnabled !== false) {
    await WatchHistory.updateOne(
      { user: viewer._id, video: video._id },
      { $set: { watchedAt: new Date() }, $setOnInsert: { progressSeconds: 0 } },
      { upsert: true },
    );
  }

  return { counted: !alreadyCounted };
}

export default {
  uploadVideo,
  listVideos,
  getVideoById,
  updateVideo,
  updateVideoThumbnail,
  deleteVideoCascade,
  deleteVideo,
  recordView,
};
