import { z } from "zod";
import { objectId, paginationQuery } from "./common.validator.js";

const handle = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handle must be at least 3 characters")
  .max(30, "Handle must be 30 characters or fewer")
  .regex(
    /^[a-z0-9._-]+$/,
    "Use letters, numbers, dots, underscores and hyphens only",
  );

export const createChannelSchema = {
  body: z.object({
    name: z.string().trim().min(1, "Channel name is required").max(60),
    handle,
    description: z.string().trim().max(5000).optional().default(""),
  }),
};

export const updateChannelSchema = {
  params: z.object({ channelId: objectId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(60).optional(),
      description: z.string().trim().max(5000).optional(),
      country: z.string().trim().max(60).optional(),
      links: z
        .array(
          z.object({
            title: z.string().trim().min(1).max(60),
            url: z.string().trim().url().max(300),
          }),
        )
        .max(10)
        .optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field to update",
    }),
};

export const channelIdParamSchema = {
  params: z.object({ channelId: objectId }),
};

export const handleParamSchema = {
  params: z.object({ handle: z.string().trim().toLowerCase().min(1).max(60) }),
};

export const channelVideosSchema = {
  params: z.object({ channelId: objectId }),
  query: paginationQuery.extend({
    sortBy: z.enum(["newest", "oldest", "popular"]).optional(),
    isShort: z.enum(["true", "false"]).optional(),
  }),
};

export default {
  createChannelSchema,
  updateChannelSchema,
  channelIdParamSchema,
  handleParamSchema,
  channelVideosSchema,
};
