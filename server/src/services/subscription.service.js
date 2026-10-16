import Channel from "../models/Channel.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";
import { queueNotification } from "../jobs/notification.job.js";

async function findChannel(channelId) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw ApiError.notFound("Channel not found");
  return channel;
}

async function adjustCounters(channel, subscriberId, delta) {
  const [updatedChannel] = await Promise.all([
    Channel.findByIdAndUpdate(
      channel._id,
      { $inc: { subscribersCount: delta } },
      { new: true },
    ).select("subscribersCount"),
    User.updateOne(
      { _id: channel.owner },
      { $inc: { subscribersCount: delta } },
    ),
    User.updateOne(
      { _id: subscriberId },
      { $inc: { subscribedToCount: delta } },
    ),
  ]);
  return Math.max(0, updatedChannel.subscribersCount);
}

export async function toggleSubscription(user, channelId) {
  const channel = await findChannel(channelId);
  if (String(channel.owner) === String(user._id)) {
    throw ApiError.badRequest("You cannot subscribe to your own channel");
  }

  const filter = { subscriber: user._id, channel: channel._id };
  const existing = await Subscription.findOne(filter);

  if (existing) {
    await existing.deleteOne();
    const subscribersCount = await adjustCounters(channel, user._id, -1);
    return { subscribed: false, subscribersCount };
  }

  try {
    await Subscription.create(filter);
  } catch (error) {
    if (error.code !== 11000) throw error;
    return { subscribed: true, subscribersCount: channel.subscribersCount };
  }

  const subscribersCount = await adjustCounters(channel, user._id, 1);

  queueNotification({
    recipient: channel.owner,
    sender: user._id,
    type: "new_subscriber",
    channel: channel._id,
    message: `${user.fullName} subscribed to your channel`,
  });

  return { subscribed: true, subscribersCount };
}

export async function getSubscriptionStatus(userId, channelId) {
  await findChannel(channelId);
  const subscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  }).select("notificationsEnabled");
  return {
    subscribed: Boolean(subscription),
    notificationsEnabled: subscription?.notificationsEnabled || null,
  };
}

export async function listMySubscriptions(userId, query) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { subscriber: userId };

  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("channel", "name handle avatar subscribersCount isVerified")
      .lean(),
    Subscription.countDocuments(filter),
  ]);

  const docs = subscriptions
    .filter((subscription) => subscription.channel)
    .map((subscription) => ({
      ...subscription.channel,
      notificationsEnabled: subscription.notificationsEnabled,
      subscribedAt: subscription.createdAt,
    }));

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function listChannelSubscribers(user, channelId, query) {
  const channel = await findChannel(channelId);
  if (String(channel.owner) !== String(user._id) && user.role !== "admin") {
    throw ApiError.forbidden("Only the channel owner can view subscribers");
  }

  const { page, limit, skip } = getPaginationParams(query);
  const filter = { channel: channel._id };

  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("subscriber", "username fullName avatar")
      .lean(),
    Subscription.countDocuments(filter),
  ]);

  const docs = subscriptions
    .filter((subscription) => subscription.subscriber)
    .map((subscription) => ({
      ...subscription.subscriber,
      subscribedAt: subscription.createdAt,
    }));

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function updateNotificationPreference(
  userId,
  channelId,
  notificationsEnabled,
) {
  const subscription = await Subscription.findOneAndUpdate(
    { subscriber: userId, channel: channelId },
    { notificationsEnabled },
    { new: true },
  );
  if (!subscription)
    throw ApiError.notFound("You are not subscribed to this channel");
  return subscription;
}

export default {
  toggleSubscription,
  getSubscriptionStatus,
  listMySubscriptions,
  listChannelSubscribers,
  updateNotificationPreference,
};
