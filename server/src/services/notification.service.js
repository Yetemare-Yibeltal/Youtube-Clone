import Notification from "../models/Notification.js";
import Subscription from "../models/Subscription.js";
import ApiError from "../utils/apiError.js";
import logger from "../utils/logger.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";
import { getIO } from "../sockets/index.js";

const NOTIFICATION_POPULATE = [
  { path: "sender", select: "username fullName avatar" },
  { path: "channel", select: "name handle avatar" },
  { path: "video", select: "title thumbnail" },
];

const INSERT_BATCH_SIZE = 500;

function emitToUser(userId, payload) {
  try {
    getIO().to(`user:${userId}`).emit("notification:new", payload);
  } catch {
    logger.debug(
      "Realtime notification skipped because sockets are not initialised",
    );
  }
}

export async function createNotification({
  recipient,
  sender = null,
  type,
  video = null,
  comment = null,
  channel = null,
  message,
}) {
  if (sender && String(sender) === String(recipient)) return null;

  const created = await Notification.create({
    recipient,
    sender,
    type,
    video,
    comment,
    channel,
    message,
  });
  const notification = await Notification.findById(created._id).populate(
    NOTIFICATION_POPULATE,
  );
  emitToUser(recipient, notification);
  return notification;
}

export async function notifySubscribersOfNewVideo(channel, video) {
  const subscriptions = await Subscription.find({
    channel: channel._id,
    notificationsEnabled: { $ne: "none" },
  })
    .select("subscriber")
    .lean();

  if (subscriptions.length === 0) return 0;

  const channelSummary = {
    _id: channel._id,
    name: channel.name,
    handle: channel.handle,
    avatar: channel.avatar,
  };
  const videoSummary = {
    _id: video._id,
    title: video.title,
    thumbnail: video.thumbnail,
  };
  const message = `${channel.name} uploaded: ${video.title}`.slice(0, 500);

  let total = 0;
  for (
    let index = 0;
    index < subscriptions.length;
    index += INSERT_BATCH_SIZE
  ) {
    const batch = subscriptions
      .slice(index, index + INSERT_BATCH_SIZE)
      .map(({ subscriber }) => ({
        recipient: subscriber,
        sender: channel.owner,
        type: "new_video",
        video: video._id,
        channel: channel._id,
        message,
      }));

    const inserted = await Notification.insertMany(batch);
    total += inserted.length;

    inserted.forEach((notification) =>
      emitToUser(notification.recipient, {
        ...notification.toObject(),
        channel: channelSummary,
        video: videoSummary,
      }),
    );
  }

  return total;
}

export async function listNotifications(userId, query) {
  const { page, limit, skip } = getPaginationParams(query, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter = { recipient: userId };
  if (query.unread === "true") filter.isRead = false;

  const [docs, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(NOTIFICATION_POPULATE)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });
  return { count };
}

export async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true },
  );
  if (!notification) throw ApiError.notFound("Notification not found");
  return notification;
}

export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true },
  );
  return { updated: result.modifiedCount };
}

export async function deleteNotification(userId, notificationId) {
  const result = await Notification.deleteOne({
    _id: notificationId,
    recipient: userId,
  });
  if (result.deletedCount === 0)
    throw ApiError.notFound("Notification not found");
  return true;
}

export default {
  createNotification,
  notifySubscribersOfNewVideo,
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
