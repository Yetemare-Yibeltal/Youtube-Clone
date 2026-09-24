import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import VideoView from "../models/VideoView.js";
import Subscription from "../models/Subscription.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";
import ApiError from "../utils/apiError.js";

const RANGE_DAYS = { "7d": 7, "28d": 28, "90d": 90, "365d": 365, all: null };

function rangeStartDate(range) {
  const days = RANGE_DAYS[range] ?? 28;
  if (days === null) return null;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

async function assertChannelAccess(channelId, requester) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw ApiError.notFound("Channel not found");
  const isOwner = channel.owner.toString() === requester._id.toString();
  if (!isOwner && requester.role !== "admin") {
    throw ApiError.forbidden(
      "You do not have permission to view this channel's analytics",
    );
  }
  return channel;
}

export async function getChannelAnalytics(channelId, requester, { range }) {
  const channel = await assertChannelAccess(channelId, requester);
  const since = rangeStartDate(range);

  const videoIds = await Video.find({ channel: channel._id }).distinct("_id");

  const viewMatch = { video: { $in: videoIds } };
  if (since) viewMatch.createdAt = { $gte: since };

  const [viewsOverTime, totals, subsOverTime, subscriberTotal] =
    await Promise.all([
      VideoView.aggregate([
        { $match: viewMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            views: { $sum: 1 },
            watchTimeSeconds: { $sum: "$watchTimeSeconds" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      VideoView.aggregate([
        { $match: viewMatch },
        {
          $group: {
            _id: null,
            totalViews: { $sum: 1 },
            totalWatchTimeSeconds: { $sum: "$watchTimeSeconds" },
          },
        },
      ]),
      Subscription.aggregate([
        {
          $match: since
            ? { channel: channel._id, createdAt: { $gte: since } }
            : { channel: channel._id },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            newSubscribers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Subscription.countDocuments({ channel: channel._id }),
    ]);

  return {
    channel: {
      _id: channel._id,
      name: channel.name,
      subscribersCount: subscriberTotal,
      videosCount: channel.videosCount,
      totalViews: channel.totalViews,
    },
    range,
    totals: {
      views: totals[0]?.totalViews || 0,
      watchTimeSeconds: totals[0]?.totalWatchTimeSeconds || 0,
      videosPublished: videoIds.length,
    },
    viewsOverTime,
    subscribersOverTime: subsOverTime,
  };
}

export async function getVideoAnalytics(videoId, requester, { range }) {
  const video = await Video.findById(videoId);
  if (!video) throw ApiError.notFound("Video not found");

  const isOwner = video.owner.toString() === requester._id.toString();
  if (!isOwner && requester.role !== "admin") {
    throw ApiError.forbidden(
      "You do not have permission to view this video's analytics",
    );
  }

  const since = rangeStartDate(range);
  const match = { video: video._id };
  if (since) match.createdAt = { $gte: since };

  const [viewsOverTime, engagement, likeCounts, commentsCount] =
    await Promise.all([
      VideoView.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            views: { $sum: 1 },
            avgWatchTimeSeconds: { $avg: "$watchTimeSeconds" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      VideoView.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalViews: { $sum: 1 },
            totalWatchTimeSeconds: { $sum: "$watchTimeSeconds" },
            completedViews: { $sum: { $cond: ["$completed", 1, 0] } },
          },
        },
      ]),
      Like.aggregate([
        { $match: { video: video._id, targetType: "video" } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Comment.countDocuments({ video: video._id }),
    ]);

  const likes = likeCounts.find((l) => l._id === "like")?.count || 0;
  const dislikes = likeCounts.find((l) => l._id === "dislike")?.count || 0;
  const totalViews = engagement[0]?.totalViews || 0;
  const completedViews = engagement[0]?.completedViews || 0;

  return {
    video: {
      _id: video._id,
      title: video.title,
      views: video.views,
      publishedAt: video.publishedAt,
      duration: video.duration,
    },
    range,
    totals: {
      views: totalViews,
      watchTimeSeconds: engagement[0]?.totalWatchTimeSeconds || 0,
      averageViewDurationSeconds:
        totalViews > 0
          ? (engagement[0]?.totalWatchTimeSeconds || 0) / totalViews
          : 0,
      retentionRate: totalViews > 0 ? completedViews / totalViews : 0,
      likes,
      dislikes,
      comments: commentsCount,
    },
    viewsOverTime,
  };
}

export async function getTopVideos(channelId, requester, { range, limit }) {
  const channel = await assertChannelAccess(channelId, requester);
  const since = rangeStartDate(range);

  const match = { channel: channel._id };
  if (since) match.publishedAt = { $gte: since };

  const videos = await Video.find(match)
    .sort({ views: -1 })
    .limit(limit)
    .select(
      "title thumbnail views likesCount commentsCount publishedAt duration",
    );

  return { range, videos };
}

export default { getChannelAnalytics, getVideoAnalytics, getTopVideos };
