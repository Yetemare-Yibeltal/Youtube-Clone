import { z } from "zod";
import { objectId } from "./common.validator.js";

const RANGE_PRESETS = ["7d", "28d", "90d", "365d", "all"];

export const channelAnalyticsSchema = {
  params: z.object({ channelId: objectId }),
  query: z.object({
    range: z.enum(RANGE_PRESETS).optional().default("28d"),
  }),
};

export const videoAnalyticsSchema = {
  params: z.object({ videoId: objectId }),
  query: z.object({
    range: z.enum(RANGE_PRESETS).optional().default("28d"),
  }),
};

export const topVideosSchema = {
  params: z.object({ channelId: objectId }),
  query: z.object({
    range: z.enum(RANGE_PRESETS).optional().default("28d"),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
};

export default {
  channelAnalyticsSchema,
  videoAnalyticsSchema,
  topVideosSchema,
};
