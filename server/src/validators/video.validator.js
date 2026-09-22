import { z } from "zod";
import { handleField, uuidField } from "./common.validator.js";

const visibilityField = z.enum(["public", "unlisted", "private"]);
const titleField = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(150, "Title is too long");
const descriptionField = z.string().trim().max(5000, "Description is too long");
const categoryField = z.string().trim().min(1).max(40);
const tagsField = z
  .array(z.string().trim().min(1).max(30))
  .max(15, "Use at most 15 tags")
  .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))]);
const limitField = z.coerce.number().int().min(1).max(50).default(20);
const pageField = z.coerce.number().int().min(1).default(1);

export const idParamSchema = z.object({ id: uuidField });

export const createVideoSchema = z
  .object({
    publicId: z.string().trim().min(1).max(300),
    title: titleField,
    description: descriptionField.default(""),
    visibility: visibilityField.default("private"),
    category: categoryField.optional(),
    tags: tagsField.default([]),
    isShort: z.boolean().default(false),
  })
  .strict();

export const updateVideoSchema = z
  .object({
    title: titleField.optional(),
    description: descriptionField.optional(),
    visibility: visibilityField.optional(),
    category: categoryField.nullable().optional(),
    tags: tagsField.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const listQuerySchema = z.object({
  cursor: z.string().max(200).optional(),
  limit: limitField,
  category: categoryField.optional(),
  channel: handleField.optional(),
  short: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export const limitQuerySchema = z.object({ limit: limitField });

export const pageQuerySchema = z.object({ page: pageField, limit: limitField });

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  page: pageField,
  limit: limitField,
});

export const reactionSchema = z
  .object({ type: z.enum(["like", "dislike"]) })
  .strict();
