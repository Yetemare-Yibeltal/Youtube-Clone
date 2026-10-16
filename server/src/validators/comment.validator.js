import { z } from "zod";
import { objectId, paginationQuery } from "./common.validator.js";

const content = z
  .string()
  .trim()
  .min(1, "Comment cannot be empty")
  .max(2000, "Comment is too long");

export const addCommentSchema = {
  params: z.object({ videoId: objectId }),
  body: z.object({
    content,
    parentComment: objectId.optional(),
  }),
};

export const listCommentsSchema = {
  params: z.object({ videoId: objectId }),
  query: paginationQuery.extend({
    sortBy: z.enum(["newest", "top"]).optional(),
  }),
};

export const listRepliesSchema = {
  params: z.object({ commentId: objectId }),
  query: paginationQuery,
};

export const updateCommentSchema = {
  params: z.object({ commentId: objectId }),
  body: z.object({ content }),
};

export const commentIdParamSchema = {
  params: z.object({ commentId: objectId }),
};

export default {
  addCommentSchema,
  listCommentsSchema,
  listRepliesSchema,
  updateCommentSchema,
  commentIdParamSchema,
};
