import User from "../models/User.js";
import Channel from "../models/Channel.js";
import Subscription from "../models/Subscription.js";
import RefreshToken from "../models/RefreshToken.js";
import Playlist from "../models/Playlist.js";
import ApiError from "../utils/apiError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";
import {
  uploadBufferToCloudinary,
  destroyCloudinaryAsset,
} from "../config/cloudinary.js";
import logger from "../utils/logger.js";

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function getUserByUsername(username, viewer) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) throw ApiError.notFound("User not found");

  const channel = await Channel.findOne({ owner: user._id });

  let isSubscribed = false;
  if (viewer && channel) {
    const sub = await Subscription.findOne({
      subscriber: viewer._id,
      channel: channel._id,
    });
    isSubscribed = Boolean(sub);
  }

  return {
    user: {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      coverImage: user.coverImage,
      createdAt: user.createdAt,
    },
    channel,
    isSubscribed,
  };
}

export async function updateAccount(userId, updates) {
  if (updates.username) {
    const taken = await User.findOne({
      username: updates.username,
      _id: { $ne: userId },
    });
    if (taken) throw ApiError.conflict("Username already taken");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

async function updateUserImage(userId, file, field, folder) {
  if (!file) throw ApiError.badRequest("Image file is required");

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const oldPublicId = user[field]?.publicId;
  const upload = await uploadBufferToCloudinary(file.buffer, {
    resource_type: "image",
    folder: `youtube-clone/${folder}`,
  });

  user[field] = { url: upload.secure_url, publicId: upload.public_id };
  await user.save({ validateBeforeSave: false });

  if (oldPublicId) {
    destroyCloudinaryAsset(oldPublicId, "image").catch((err) =>
      logger.error(`Failed to remove old ${field}: ${err.message}`),
    );
  }

  return user;
}

export function updateAvatar(userId, file) {
  return updateUserImage(userId, file, "avatar", "user-avatars");
}

export function updateCoverImage(userId, file) {
  return updateUserImage(userId, file, "coverImage", "user-covers");
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

  user.password = await hashPassword(newPassword);
  await user.save({ validateBeforeSave: false });

  // Invalidate all existing refresh tokens so other sessions are logged out.
  await RefreshToken.deleteMany({ user: user._id });

  return true;
}

export async function deleteAccount(userId, password) {
  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw ApiError.badRequest("Password is incorrect");

  const channel = await Channel.findOne({ owner: userId });

  await Promise.all([
    RefreshToken.deleteMany({ user: userId }),
    Playlist.deleteMany({ owner: userId }),
    Subscription.deleteMany({ subscriber: userId }),
    channel
      ? Subscription.deleteMany({ channel: channel._id })
      : Promise.resolve(),
  ]);

  if (channel) {
    await Channel.deleteOne({ _id: channel._id });
  }

  await User.deleteOne({ _id: userId });
  return true;
}

export async function listUsers(query) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};
  if (query.q) {
    filter.$or = [
      { username: { $regex: query.q, $options: "i" } },
      { fullName: { $regex: query.q, $options: "i" } },
      { email: { $regex: query.q, $options: "i" } },
    ];
  }
  if (query.role) {
    filter.role = query.role;
  }

  const [docs, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export default {
  getCurrentUser,
  getUserByUsername,
  updateAccount,
  updateAvatar,
  updateCoverImage,
  changePassword,
  deleteAccount,
  listUsers,
};
