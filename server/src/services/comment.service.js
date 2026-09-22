import * as Comment from "../models/Comment.js";
import * as Like from "../models/Like.js";
import { ApiError } from "../utils/apiError.js";
import { loadVisible } from "./video.service.js";

const assertVisible = (user, video) => {
  if (video.status !== "ready" || video.visibility === "private")
    throw ApiError.notFound("Video not found");
};

export const list = async (videoId, viewer, query) => {
  const video = await loadVisible(videoId, viewer);
  assertVisible(viewer, video);

  const { items, nextCursor } = await Comment.listTopLevel(videoId, {
    ...query,
    viewerId: viewer?.id ?? null,
  });
  return { comments: items.map(Comment.toPublicComment), nextCursor };
};

export const listReplies = async (videoId, commentId, viewer) => {
  const parent = await Comment.findById(commentId);
  if (!parent || parent.video_id !== videoId)
    throw ApiError.notFound("Comment not found");

  const items = await Comment.listReplies(commentId, viewer?.id ?? null);
  return items.map(Comment.toPublicComment);
};

export const create = async (videoId, user, { body, parentId }) => {
  const video = await loadVisible(videoId, user);
  assertVisible(user, video);

  const id = await Comment.create({ videoId, userId: user.id, parentId, body });
  return Comment.toPublicComment(await Comment.findById(id));
};

export const update = async (user, commentId, body) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound("Comment not found");
  if (comment.user_id !== user.id)
    throw ApiError.forbidden("You cannot edit this comment");

  await Comment.update(commentId, body);
  return Comment.toPublicComment(await Comment.findById(commentId));
};

export const remove = async (user, commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound("Comment not found");
  if (
    comment.user_id !== user.id &&
    user.role !== "admin" &&
    user.role !== "moderator"
  ) {
    throw ApiError.forbidden("You cannot delete this comment");
  }
  await Comment.softDelete(commentId, comment.video_id);
};

export const setReaction = async (user, commentId, type) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound("Comment not found");
  return Like.setCommentReaction({ userId: user.id, commentId, type });
};
