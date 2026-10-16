import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as likeService from "../services/like.service.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const result = await likeService.toggleVideoLike(
    req.user,
    req.params.videoId,
    req.body.type,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Reaction updated successfully"));
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const result = await likeService.toggleCommentLike(
    req.user,
    req.params.commentId,
    req.body.type,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Reaction updated successfully"));
});

export const getVideoLikeStatus = asyncHandler(async (req, res) => {
  const result = await likeService.getVideoLikeStatus(
    req.user._id,
    req.params.videoId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Reaction status fetched successfully"));
});

export const listLikedVideos = asyncHandler(async (req, res) => {
  const result = await likeService.listLikedVideos(req.user, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Liked videos fetched successfully"));
});
