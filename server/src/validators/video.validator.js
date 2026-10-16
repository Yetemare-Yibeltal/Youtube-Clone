import { z } from "zod";
import { objectId, paginationQuery } from "./common.validator.js";

export const VIDEO_CATEGORIES = [
  "music",
  "gaming",
  "news",
  "sports",
  "education",
  "entertainment",
  "technology",
  "travel",
  "comedy",
  "howto",
  "automobiles",
  "blogs",
  "other",
];

const visibility = z.enum(["public", "private", "unlisted"]);

const booleanFlag = z.preprocess(
  (value) => value === true || value === "true",
  z.boolean(),
);

const tagList = z.preprocess(
  (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    return [];
  },
  z.array(z.string().trim().toLowerCase().min(1).max(30)).max(15),
);

export const uploadVideoSchema = {
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(100),
    description: z.string().trim().max(5000).optional().default(""),
    tags: tagList,
    category: z.enum(VIDEO_CATEGORIES).optional().default("other"),
    visibility: visibility.optional().default("public"),
    isShort: booleanFlag,
    ageRestricted: booleanFlag,
  }),
};

export const updateVideoSchema = {
  params: z.object({ videoId: objectId }),
  body: z
    .object({
      title: z.string().trim().min(1).max(100).optional(),
      description: z.string().trim().max(5000).optional(),
      tags: z
        .array(z.string().trim().toLowerCase().min(1).max(30))
        .max(15)
        .optional(),
      category: z.enum(VIDEO_CATEGORIES).optional(),
      visibility: visibility.optional(),
      isCommentsEnabled: z.boolean().optional(),
      ageRestricted: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field to update",
    }),
};

export const videoIdParamSchema = {
  params: z.object({ videoId: objectId }),
};

export const listVideosSchema = {
  query: paginationQuery.extend({
    category: z.enum(VIDEO_CATEGORIES).optional(),
    sortBy: z.enum(["newest", "oldest", "popular", "trending"]).optional(),
    channelId: objectId.optional(),
    isShort: z.enum(["true", "false"]).optional(),
  }),
};

export default {
  uploadVideoSchema,
  updateVideoSchema,
  videoIdParamSchema,
  listVideosSchema,
};
