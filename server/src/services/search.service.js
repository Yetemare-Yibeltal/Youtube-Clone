import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";

const CHANNEL_SELECT = "name handle avatar subscribersCount isVerified";
const PUBLIC_VIDEO_FILTER = { status: "published", visibility: "public" };

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sortFor(sortBy) {
  switch (sortBy) {
    case "newest":
      return { publishedAt: -1 };
    case "oldest":
      return { publishedAt: 1 };
    default:
      return { views: -1, publishedAt: -1 };
  }
}

export async function searchVideos(query) {
  const { page, limit, skip } = getPaginationParams(query, {
    defaultLimit: 24,
    maxLimit: 50,
  });
  const pattern = new RegExp(escapeRegex(query.q), "i");

  const filter = {
    ...PUBLIC_VIDEO_FILTER,
    $or: [{ title: pattern }, { tags: pattern }, { description: pattern }],
  };
  if (query.category) filter.category = query.category;
  if (query.isShort !== undefined) filter.isShort = query.isShort === "true";

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

export async function searchChannels(query) {
  const { page, limit, skip } = getPaginationParams(query, {
    defaultLimit: 20,
    maxLimit: 50,
  });
  const pattern = new RegExp(escapeRegex(query.q), "i");
  const filter = {
    $or: [{ name: pattern }, { handle: pattern }, { description: pattern }],
  };

  const [docs, total] = await Promise.all([
    Channel.find(filter)
      .sort({ subscribersCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Channel.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function getSuggestions(text) {
  const pattern = new RegExp(`^${escapeRegex(text)}`, "i");

  const [videos, channels] = await Promise.all([
    Video.find({ ...PUBLIC_VIDEO_FILTER, title: pattern })
      .sort({ views: -1 })
      .limit(5)
      .select("title")
      .lean(),
    Channel.find({ name: pattern })
      .sort({ subscribersCount: -1 })
      .limit(3)
      .select("name")
      .lean(),
  ]);

  const suggestions = [
    ...new Set([
      ...channels.map((channel) => channel.name),
      ...videos.map((video) => video.title),
    ]),
  ];
  return { suggestions };
}

export default { searchVideos, searchChannels, getSuggestions };
