import Channel from "../models/Channel.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Subscription from "../models/Subscription.js";
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
import { deleteVideoCascade } from "./video.service.js";

const USER_PUBLIC_SELECT = "username fullName avatar coverImage createdAt";
const EDITABLE_FIELDS = ["name", "description", "country", "links"];

function isOwnerOf(channel, user) {
  return Boolean(user && String(channel.owner) === String(user._id));
}

function assertCanManage(channel, user) {
  if (!isOwnerOf(channel, user) && user?.role !== "admin") {
    throw ApiError.forbidden("You cannot manage this channel");
  }
}

async function findChannel(channelId) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw ApiError.notFound("Channel not found");
  return channel;
}

export async function createChannel(user, { name, handle, description = "" }) {
  if (await Channel.exists({ owner: user._id }))
    throw ApiError.conflict("You already have a channel");
  if (await Channel.exists({ handle }))
    throw ApiError.conflict("This handle is already taken");

  try {
    return await Channel.create({
      owner: user._id,
      name,
      handle,
      description,
      avatar: { url: user.avatar?.url || "", publicId: "" },
    });
  } catch (error) {
    if (error.code === 11000)
      throw ApiError.conflict("This handle is already taken");
    throw error;
  }
}

export async function getMyChannel(user) {
  const channel = await Channel.findOne({ owner: user._id });
  if (!channel) throw ApiError.notFound("You have not created a channel yet");
  return channel;
}

export async function getChannelById(channelId) {
  return findChannel(channelId);
}

export async function getChannelProfileByHandle(handle, viewer) {
  const channel = await Channel.findOne({ handle: handle.toLowerCase() });
  if (!channel) throw ApiError.notFound("Channel not found");

  const [owner, subscription] = await Promise.all([
    User.findById(channel.owner).select(USER_PUBLIC_SELECT),
    viewer
      ? Subscription.exists({ subscriber: viewer._id, channel: channel._id })
      : null,
  ]);

  return { user: owner, channel, isSubscribed: Boolean(subscription) };
}

export async function updateChannel(channelId, user, updates) {
  const channel = await findChannel(channelId);
  assertCanManage(channel, user);

  for (const field of EDITABLE_FIELDS) {
    if (updates[field] !== undefined) channel[field] = updates[field];
  }

  await channel.save();
  return channel;
}

async function replaceChannelImage(channelId, user, file, field) {
  if (!file) throw ApiError.badRequest("Image file is required");

  const channel = await findChannel(channelId);
  assertCanManage(channel, user);

  const previous = channel[field];
  const upload = await uploadBufferToCloudinary(file.buffer, {
    resource_type: "image",
    folder: `vidtube/channel-${field}s`,
  });

  channel[field] = { url: upload.secure_url, publicId: upload.public_id };
  await channel.save();

  if (previous?.publicId) {
    destroyCloudinaryAsset(previous.publicId, "image").catch((error) =>
      logger.error(
        `Could not remove previous channel ${field}: ${error.message}`,
      ),
    );
  }

  return channel;
}

export function updateChannelAvatar(channelId, user, file) {
  return replaceChannelImage(channelId, user, file, "avatar");
}

export function updateChannelBanner(channelId, user, file) {
  return replaceChannelImage(channelId, user, file, "banner");
}

export async function listChannelVideos(channelId, viewer, query) {
  const channel = await findChannel(channelId);
  const { page, limit, skip } = getPaginationParams(query);

  const filter = { channel: channel._id };
  if (!isOwnerOf(channel, viewer)) {
    filter.status = "published";
    filter.visibility = "public";
  }
  if (query.isShort !== undefined) filter.isShort = query.isShort === "true";

  const sort =
    query.sortBy === "popular"
      ? { views: -1, publishedAt: -1 }
      : query.sortBy === "oldest"
        ? { publishedAt: 1 }
        : { publishedAt: -1 };

  const [docs, total] = await Promise.all([
    Video.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("channel", "name handle avatar")
      .lean(),
    Video.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function deleteChannel(channelId, user) {
  const channel = await findChannel(channelId);
  assertCanManage(channel, user);

  const videos = await Video.find({ channel: channel._id });
  for (const video of videos) {
    await deleteVideoCascade(video);
  }

  await Subscription.deleteMany({ channel: channel._id });
  await channel.deleteOne();

  return true;
}

export default {
  createChannel,
  getMyChannel,
  getChannelById,
  getChannelProfileByHandle,
  updateChannel,
  updateChannelAvatar,
  updateChannelBanner,
  listChannelVideos,
  deleteChannel,
};
