import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as videoService from "../services/video.service.js";

export const uploadVideo = asyncHandler(async (req, res) => {
  const video = await videoService.uploadVideo(
    req.user._id,
    req.body,
    req.files,
  );
  res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

export const listVideos = asyncHandler(async (req, res) => {
  const result = await videoService.listVideos(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const result = await videoService.getVideoById(req.params.videoId, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Video fetched successfully"));
});

export const updateVideo = asyncHandler(async (req, res) => {
  const video = await videoService.updateVideo(
    req.params.videoId,
    req.user,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

export const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const video = await videoService.updateVideoThumbnail(
    req.params.videoId,
    req.user,
    req.file,
  );
  res
    .status(200)
    .json(new ApiResponse(200, video, "Thumbnail updated successfully"));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  await videoService.deleteVideo(req.params.videoId, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

export const recordView = asyncHandler(async (req, res) => {
  const sessionId = req.cookies?.sessionId || req.ip || "anonymous";
  const result = await videoService.recordView(
    req.params.videoId,
    req.user,
    sessionId,
  );
  res.status(200).json(new ApiResponse(200, result, "View recorded"));
});
