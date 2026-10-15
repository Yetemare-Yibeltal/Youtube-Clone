import { z } from "zod";
import { objectId, paginationQuery } from "./common.validator.js";

const visibility = z.enum(["public", "private", "unlisted"]);

export const createPlaylistSchema = {
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(150),
    description: z.string().trim().max(5000).optional().default(""),
    visibility: visibility.optional().default("private"),
  }),
};

export const updatePlaylistSchema = {
  params: z.object({ playlistId: objectId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(150).optional(),
      description: z.string().trim().max(5000).optional(),
      visibility: visibility.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field to update",
    }),
};

export const playlistIdParamSchema = {
  params: z.object({ playlistId: objectId }),
};

export const playlistVideoParamSchema = {
  params: z.object({ playlistId: objectId, videoId: objectId }),
};

export const listPlaylistsSchema = {
  query: paginationQuery,
};

export default {
  createPlaylistSchema,
  updatePlaylistSchema,
  playlistIdParamSchema,
  playlistVideoParamSchema,
  listPlaylistsSchema,
};
