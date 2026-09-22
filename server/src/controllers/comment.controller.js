import * as commentService from "../services/comment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from "../utils/apiResponse.js";

export const list = asyncHandler(async (req, res) => {
  const { comments, nextCursor } = await commentService.list(
    req.validated.params.id,
    req.user,
    req.validated.query,
  );
  sendSuccess(res, { comments }, { meta: { nextCursor } });
});

export const listReplies = asyncHandler(async (req, res) => {
  const comments = await commentService.listReplies(
    req.validated.params.id,
    req.validated.params.commentId,
    req.user,
  );
  sendSuccess(res, { comments });
});

export const create = asyncHandler(async (req, res) => {
  sendCreated(res, {
    comment: await commentService.create(
      req.validated.params.id,
      req.user,
      req.validated.body,
    ),
  });
});

export const update = asyncHandler(async (req, res) => {
  const comment = await commentService.update(
    req.user,
    req.validated.params.commentId,
    req.validated.body.body,
  );
  sendSuccess(res, { comment });
});

export const remove = asyncHandler(async (req, res) => {
  await commentService.remove(req.user, req.validated.params.commentId);
  sendNoContent(res);
});

export const setReaction = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await commentService.setReaction(
      req.user,
      req.validated.params.commentId,
      req.validated.body.type,
    ),
  );
});

export const clearReaction = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await commentService.setReaction(
      req.user,
      req.validated.params.commentId,
      null,
    ),
  );
});
