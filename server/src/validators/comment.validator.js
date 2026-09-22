import { z } from "zod";
import { uuidField } from "./common.validator.js";

const bodyField = z
  .string()
  .trim()
  .min(1, "Comment cannot be empty")
  .max(2000, "Comment is too long");

export const idParamSchema = z.object({ id: uuidField });
export const commentIdParamSchema = z.object({ commentId: uuidField });

export const createCommentSchema = z
  .object({ body: bodyField, parentId: uuidField.optional() })
  .strict();

export const updateCommentSchema = z.object({ body: bodyField }).strict();

export const listQuerySchema = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["newest", "top"]).default("newest"),
});
