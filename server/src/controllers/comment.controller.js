import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as commentService from "../services/comment.service.js";

export const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    req.user,
    req.params.videoId,
    req.body,
  );
  res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

export const listComments = asyncHandler(async (req, res) => {
  const result = await commentService.listComments(
    req.params.videoId,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Comments fetched successfully"));
});

export const listReplies = asyncHandler(async (req, res) => {
  const result = await commentService.listReplies(
    req.params.commentId,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Replies fetched successfully"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(
    req.params.commentId,
    req.user,
    req.body.content,
  );
  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  await commentService.deleteComment(req.params.commentId, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});
