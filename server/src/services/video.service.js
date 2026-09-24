import * as Video from "../models/Video.js";
import * as VideoView from "../models/VideoView.js";
import * as Channel from "../models/Channel.js";
import * as AuditLog from "../models/AuditLog.js";
import { hashToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/apiError.js";
import { inspectVideoAsset } from "./upload.service.js";

const isStaff = (viewer) =>
  viewer?.role === "admin" || viewer?.role === "moderator";

const canSee = (row, viewer) =>
  row.owner_id === viewer?.id ||
  isStaff(viewer) ||
  (row.status === "ready" && row.visibility !== "private");

export const loadVisible = async (id, viewer) => {
  const row = await Video.findById(id, viewer?.id ?? null);
  if (!row || !canSee(row, viewer)) throw ApiError.notFound("Video not found");
  return row;
};

const loadManageable = async (id, user) => {
  const row = await Video.findById(id, user.id);
  if (!row) throw ApiError.notFound("Video not found");
  if (row.owner_id !== user.id && user.role !== "admin")
    throw ApiError.forbidden("You cannot modify this video");
  return row;
};

export const create = async (user, input) => {
  const channel = await Channel.findByUserId(user.id);
  if (!channel) throw ApiError.notFound("Channel not found");

  if (await Video.publicIdExists(input.publicId)) {
    throw ApiError.conflict("This upload is already used by a video", {
      code: "UPLOAD_ALREADY_USED",
    });
  }

  const asset = await inspectVideoAsset(user.id, input.publicId);
  const id = await Video.create({
    ...input,
    channelId: channel.id,
    videoUrl: asset.url,
    thumbnailUrl: asset.thumbnailUrl,
    durationSeconds: asset.durationSeconds,
  });
  return Video.toPublicVideo(await Video.findById(id, user.id));
};

export const getById = async (id, viewer) =>
  Video.toPublicVideo(await loadVisible(id, viewer));

export const update = async (user, id, changes) => {
  const video = await loadManageable(id, user);
  const patch = { ...changes };
  if (changes.visibility === "public" && video.visibility === "private")
    patch.publishedAt = new Date();

  await Video.update(id, patch);
  return Video.toPublicVideo(await Video.findById(id, user.id));
};

export const remove = async (user, id) => {
  const video = await loadManageable(id, user);
  await Video.softDelete(id);
  if (video.owner_id !== user.id) {
    await AuditLog.record({
      actorId: user.id,
      action: "video.delete",
      entityType: "video",
      entityId: id,
    });
  }
};

export const listFeed = async (query) => {
  const { items, nextCursor } = await Video.listFeed({
    cursor: query.cursor,
    limit: query.limit,
    category: query.category,
    channelHandle: query.channel,
    isShort: query.short,
  });
  return { videos: items.map(Video.toPublicVideo), nextCursor };
};

export const trending = async ({ limit }) =>
  (await Video.listTrending(limit)).map(Video.toPublicVideo);

export const search = async ({ q, page, limit }) => {
  const { items, hasNextPage } = await Video.search({
    q,
    limit,
    offset: (page - 1) * limit,
  });
  return {
    videos: items.map(Video.toPublicVideo),
    meta: { page, limit, hasNextPage },
  };
};

export const listMine = async (userId, { page, limit }) => {
  const { items, hasNextPage } = await Video.listByOwner(userId, {
    limit,
    offset: (page - 1) * limit,
  });
  return {
    videos: items.map(Video.toPublicVideo),
    meta: { page, limit, hasNextPage },
  };
};

export const registerView = async (id, viewer, ctx) => {
  const row = await loadVisible(id, viewer);
  if (row.status !== "ready" || row.visibility === "private")
    throw ApiError.notFound("Video not found");

  const viewerHash = hashToken(
    `${viewer?.id ?? ctx.ip}|${ctx.userAgent}|${id}`,
  );
  const viewCount = await VideoView.record({
    videoId: id,
    userId: viewer?.id ?? null,
    viewerHash,
  });
  return {
    counted: viewCount !== null,
    viewCount: viewCount ?? row.view_count,
  };
};
// added import
import { queueVideoProcessing } from '../jobs/videoProcessing.job.js';

// uploadVideo now creates with status: 'processing' and queues the job
const video = await Video.create({
  // ...
  duration: videoUpload.duration || 0,
  status: 'processing',
});

await Channel.findByIdAndUpdate(channel._id, { $inc: { videosCount: 1 } });

queueVideoProcessing(video._id);

return video;

// getVideoById now blocks non-owners from videos that aren't published yet
const isOwner = viewer && video.owner.toString() === viewer._id.toString();

if (video.visibility === 'private' && !isOwner) {
  throw ApiError.forbidden('This video is private');
}
if (video.status !== 'published' && !isOwner) {
  throw ApiError.notFound('Video not found');
}
