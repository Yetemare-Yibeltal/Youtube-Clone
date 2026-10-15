import Playlist from "../models/Playlist.js";
import Video from "../models/Video.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";

const SYSTEM_PLAYLISTS = [
  { systemType: "watch_later", name: "Watch later" },
  { systemType: "liked_videos", name: "Liked videos" },
];

const CHANNEL_SELECT = "name handle avatar subscribersCount isVerified";

function sameId(first, second) {
  return String(first?._id || first) === String(second?._id || second);
}

async function findOwnedPlaylist(playlistId, userId) {
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw ApiError.notFound("Playlist not found");
  if (!sameId(playlist.owner, userId))
    throw ApiError.forbidden("You do not own this playlist");
  return playlist;
}

export async function ensureSystemPlaylists(userId) {
  await Promise.all(
    SYSTEM_PLAYLISTS.map(async ({ systemType, name }) => {
      try {
        await Playlist.updateOne(
          { owner: userId, systemType },
          {
            $setOnInsert: {
              owner: userId,
              systemType,
              name,
              isSystem: true,
              visibility: "private",
            },
          },
          { upsert: true },
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }),
  );
}

export async function syncLikedVideosPlaylist(userId, videoId, isLiked) {
  await ensureSystemPlaylists(userId);
  await Playlist.updateOne(
    { owner: userId, systemType: "liked_videos" },
    isLiked
      ? { $addToSet: { videos: videoId } }
      : { $pull: { videos: videoId } },
  );
}

export async function createPlaylist(
  userId,
  { name, description = "", visibility = "private" },
) {
  return Playlist.create({ owner: userId, name, description, visibility });
}

export async function listMyPlaylists(userId, query) {
  const { page, limit, skip } = getPaginationParams(query, {
    defaultLimit: 50,
    maxLimit: 100,
  });
  const filter = { owner: userId };

  const [playlists, total] = await Promise.all([
    Playlist.find(filter)
      .sort({ isSystem: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Playlist.countDocuments(filter),
  ]);

  const firstVideoIds = playlists
    .map((playlist) => playlist.videos?.[0])
    .filter(Boolean);
  const covers = firstVideoIds.length
    ? await Video.find({ _id: { $in: firstVideoIds } })
        .select("thumbnail")
        .lean()
    : [];
  const coverById = new Map(
    covers.map((video) => [String(video._id), video.thumbnail?.url || ""]),
  );

  const docs = playlists.map((playlist) => ({
    ...playlist,
    videosCount: playlist.videos?.length || 0,
    thumbnail:
      playlist.thumbnail || coverById.get(String(playlist.videos?.[0])) || "",
  }));

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function getPlaylistById(playlistId, viewer) {
  const playlist = await Playlist.findById(playlistId).populate(
    "owner",
    "username fullName avatar",
  );
  if (!playlist) throw ApiError.notFound("Playlist not found");

  const isOwner = Boolean(viewer && sameId(playlist.owner, viewer._id));
  if (playlist.visibility === "private" && !isOwner) {
    throw ApiError.forbidden("This playlist is private");
  }

  const videoFilter = { _id: { $in: playlist.videos }, status: "published" };
  if (!isOwner) videoFilter.visibility = { $ne: "private" };

  const videos = await Video.find(videoFilter)
    .populate("channel", CHANNEL_SELECT)
    .lean();
  const position = new Map(
    playlist.videos.map((id, index) => [String(id), index]),
  );
  videos.sort(
    (first, second) =>
      position.get(String(first._id)) - position.get(String(second._id)),
  );

  return { ...playlist.toObject(), videos, videosCount: videos.length };
}

export async function updatePlaylist(userId, playlistId, updates) {
  const playlist = await findOwnedPlaylist(playlistId, userId);
  if (playlist.isSystem)
    throw ApiError.forbidden("System playlists cannot be edited");

  for (const field of ["name", "description", "visibility"]) {
    if (updates[field] !== undefined) playlist[field] = updates[field];
  }

  await playlist.save();
  return playlist;
}

export async function deletePlaylist(userId, playlistId) {
  const playlist = await findOwnedPlaylist(playlistId, userId);
  if (playlist.isSystem)
    throw ApiError.forbidden("System playlists cannot be deleted");
  await playlist.deleteOne();
  return true;
}

export async function addVideoToPlaylist(userId, playlistId, videoId) {
  await findOwnedPlaylist(playlistId, userId);

  const video = await Video.findById(videoId).select(
    "owner status visibility thumbnail",
  );
  const isVisible =
    video &&
    video.status === "published" &&
    (video.visibility !== "private" || sameId(video.owner, userId));
  if (!isVisible) throw ApiError.notFound("Video not found");

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: video._id } },
    { new: true },
  );

  if (!updated.thumbnail && video.thumbnail?.url) {
    updated.thumbnail = video.thumbnail.url;
    await updated.save();
  }

  return updated;
}

export async function removeVideoFromPlaylist(userId, playlistId, videoId) {
  await findOwnedPlaylist(playlistId, userId);

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true },
  );

  if (updated.videos.length === 0 && updated.thumbnail) {
    updated.thumbnail = "";
    await updated.save();
  }

  return updated;
}

export default {
  ensureSystemPlaylists,
  syncLikedVideosPlaylist,
  createPlaylist,
  listMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};
