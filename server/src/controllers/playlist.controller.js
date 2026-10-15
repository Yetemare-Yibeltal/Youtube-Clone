import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as playlistService from "../services/playlist.service.js";

export const createPlaylist = asyncHandler(async (req, res) => {
  const playlist = await playlistService.createPlaylist(req.user._id, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

export const listMyPlaylists = asyncHandler(async (req, res) => {
  await playlistService.ensureSystemPlaylists(req.user._id);
  const result = await playlistService.listMyPlaylists(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Playlists fetched successfully"));
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const playlist = await playlistService.getPlaylistById(
    req.params.playlistId,
    req.user,
  );
  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const playlist = await playlistService.updatePlaylist(
    req.user._id,
    req.params.playlistId,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  await playlistService.deletePlaylist(req.user._id, req.params.playlistId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Playlist deleted successfully"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const playlist = await playlistService.addVideoToPlaylist(
    req.user._id,
    req.params.playlistId,
    req.params.videoId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to playlist"));
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const playlist = await playlistService.removeVideoFromPlaylist(
    req.user._id,
    req.params.playlistId,
    req.params.videoId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist"));
});
