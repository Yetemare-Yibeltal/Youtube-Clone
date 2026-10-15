import Video from "../models/Video.js";
import Subscription from "../models/Subscription.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";

const CHANNEL_SELECT = "name handle avatar subscribersCount isVerified";
const DAY_MS = 24 * 60 * 60 * 1000;

const visibleVideos = (extra = {}) => ({
  status: "published",
  visibility: "public",
  isShort: false,
  ...extra,
});

export async function getRelatedVideos(videoId, { limit = 12 } = {}) {
  const video = await Video.findById(videoId).select("channel category tags");
  if (!video) throw ApiError.notFound("Video not found");

  const candidates = await Video.find({
    ...visibleVideos({ _id: { $ne: video._id } }),
    $or: [
      { channel: video.channel },
      { category: video.category },
      { tags: { $in: video.tags } },
    ],
  })
    .sort({ views: -1 })
    .limit(limit * 4)
    .populate("channel", CHANNEL_SELECT)
    .lean();

  const sourceTags = new Set(video.tags);
  const ranked = candidates
    .map((candidate) => {
      const sameChannel =
        String(candidate.channel?._id) === String(video.channel) ? 3 : 0;
      const sameCategory = candidate.category === video.category ? 2 : 0;
      const sharedTags = (candidate.tags || []).filter((tag) =>
        sourceTags.has(tag),
      ).length;
      return { candidate, score: sameChannel + sameCategory + sharedTags };
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.candidate.views - first.candidate.views,
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);

  if (ranked.length >= limit) return ranked;

  const excludedIds = [video._id, ...ranked.map((item) => item._id)];
  const filler = await Video.find(visibleVideos({ _id: { $nin: excludedIds } }))
    .sort({ views: -1 })
    .limit(limit - ranked.length)
    .populate("channel", CHANNEL_SELECT)
    .lean();

  return [...ranked, ...filler];
}

export async function getTrendingVideos({ limit = 20, days = 7 } = {}) {
  const since = new Date(Date.now() - days * DAY_MS);

  const recent = await Video.find(
    visibleVideos({ publishedAt: { $gte: since } }),
  )
    .sort({ views: -1 })
    .limit(limit)
    .populate("channel", CHANNEL_SELECT)
    .lean();

  if (recent.length >= limit) return recent;

  const filler = await Video.find(
    visibleVideos({ _id: { $nin: recent.map((video) => video._id) } }),
  )
    .sort({ views: -1 })
    .limit(limit - recent.length)
    .populate("channel", CHANNEL_SELECT)
    .lean();

  return [...recent, ...filler];
}

export async function getSubscriptionFeed(userId, query) {
  const { page, limit, skip } = getPaginationParams(query);
  const channelIds = await Subscription.find({ subscriber: userId }).distinct(
    "channel",
  );
  const filter = visibleVideos({ channel: { $in: channelIds } });

  const [docs, total] = await Promise.all([
    Video.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", CHANNEL_SELECT)
      .lean(),
    Video.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export default { getRelatedVideos, getTrendingVideos, getSubscriptionFeed };
