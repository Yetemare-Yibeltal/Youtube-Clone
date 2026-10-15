import { z } from "zod";
import { objectId, paginationQuery } from "./common.validator.js";

export const REPORT_TARGET_TYPES = ["video", "comment", "channel", "user"];

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "violence",
  "nudity",
  "misinformation",
  "copyright",
  "child_safety",
  "other",
];

export const createReportSchema = {
  body: z.object({
    targetType: z.enum(REPORT_TARGET_TYPES),
    targetId: objectId,
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(2000).optional().default(""),
  }),
};

export const listReportsSchema = {
  query: paginationQuery.extend({
    status: z
      .enum(["pending", "reviewing", "resolved", "dismissed"])
      .optional(),
    targetType: z.enum(REPORT_TARGET_TYPES).optional(),
  }),
};

export const reviewReportSchema = {
  params: z.object({ reportId: objectId }),
  body: z.object({
    status: z.enum(["reviewing", "resolved", "dismissed"]),
    reviewNote: z.string().trim().max(1000).optional().default(""),
  }),
};

export default { createReportSchema, listReportsSchema, reviewReportSchema };
