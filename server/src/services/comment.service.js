import Comment from "../models/Comment.js";
import Like from "../models/Like.js";
import Notification from "../models/Notification.js";
import Video from "../models/Video.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";
import { queueNotification } from "../jobs/notification.job.js";

const OWNER_SELECT = "username fullName avatar";

function sameId(first, second) {
  return String(first?._id || first) === String(second?._id || second);
}

export async function addComment(user, videoId, { content, parentComment }) {
  const video = await Video.findById(videoId).select(
    "owner status visibility isCommentsEnabled",
  );
  const isVisible =
    video &&
    video.status === "published" &&
    (video.visibility !== "private" || sameId(video.owner, user._id));
  if (!isVisible) throw ApiError.notFound("Video not found");
  if (!video.isCommentsEnabled)
    throw ApiError.forbidden("Comments are turned off for this video");

  let rootId = null;
  let repliedTo = null;

  if (parentComment) {
    repliedTo = await Comment.findById(parentComment).select(
      "video owner parentComment",
    );
    if (!repliedTo || !sameId(repliedTo.video, video._id)) {
      throw ApiError.badRequest(
        "The comment you are replying to was not found on this video",
      );
    }
    rootId = repliedTo.parentComment || repliedTo._id;
  }

  const created = await Comment.create({
    video: video._id,
    owner: user._id,
    content,
    parentComment: rootId,
  });

  await Promise.all([
    Video.updateOne({ _id: video._id }, { $inc: { commentsCount: 1 } }),
    rootId
      ? Comment.updateOne({ _id: rootId }, { $inc: { repliesCount: 1 } })
      : null,
  ]);

  if (repliedTo) {
    queueNotification({
      recipient: repliedTo.owner,
      sender: user._id,
      type: "reply",
      video: video._id,
      comment: created._id,
      message: `${user.fullName} replied to your comment`,
    });
  } else {
    queueNotification({
      recipient: video.owner,
      sender: user._id,
      type: "comment",
      video: video._id,
      comment: created._id,
      message: `${user.fullName} commented on your video`,
    });
  }

  return Comment.findById(created._id).populate("owner", OWNER_SELECT);
}

export async function listComments(videoId, query) {
  const video = await Video.exists({ _id: videoId });
  if (!video) throw ApiError.notFound("Video not found");

  const { page, limit, skip } = getPaginationParams(query);
  const filter = { video: videoId, parentComment: null };
  const sort =
    query.sortBy === "top"
      ? { likesCount: -1, createdAt: -1 }
      : { isPinned: -1, createdAt: -1 };

  const [docs, total] = await Promise.all([
    Comment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("owner", OWNER_SELECT)
      .lean(),
    Comment.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function listReplies(commentId, query) {
  const parent = await Comment.exists({ _id: commentId });
  if (!parent) throw ApiError.notFound("Comment not found");

  const { page, limit, skip } = getPaginationParams(query);
  const filter = { parentComment: commentId };

  const [docs, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", OWNER_SELECT)
      .lean(),
    Comment.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function updateComment(commentId, user, content) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound("Comment not found");
  if (!sameId(comment.owner, user._id))
    throw ApiError.forbidden("You can only edit your own comments");

  comment.content = content;
  comment.isEdited = true;
  await comment.save();

  return comment.populate("owner", OWNER_SELECT);
}

export async function deleteComment(commentId, requester) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw ApiError.notFound("Comment not found");

  const video = await Video.findById(comment.video).select("owner");
  const isCommentOwner = sameId(comment.owner, requester._id);
  const isVideoOwner = Boolean(video) && sameId(video.owner, requester._id);
  if (!isCommentOwner && !isVideoOwner && requester.role !== "admin") {
    throw ApiError.forbidden("You cannot delete this comment");
  }

  const replyIds = comment.parentComment
    ? []
    : await Comment.find({ parentComment: comment._id }).distinct("_id");
  const removedIds = [comment._id, ...replyIds];

  await Promise.all([
    Comment.deleteMany({ _id: { $in: removedIds } }),
    Like.deleteMany({ comment: { $in: removedIds } }),
    Notification.deleteMany({ comment: { $in: removedIds } }),
    Video.updateOne(
      { _id: comment.video },
      { $inc: { commentsCount: -removedIds.length } },
    ),
    comment.parentComment
      ? Comment.updateOne(
          { _id: comment.parentComment },
          { $inc: { repliesCount: -1 } },
        )
      : null,
  ]);

  return true;
}

export default {
  addComment,
  listComments,
  listReplies,
  updateComment,
  deleteComment,
};
