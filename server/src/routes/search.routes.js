import { Router } from "express";
import { z } from "zod";
import * as searchController from "../controllers/search.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectId, paginationQuery } from "../validators/common.validator.js";

const router = Router();

const searchTerm = z.string().trim().min(1, "Search text is required").max(100);

const searchVideosSchema = {
  query: paginationQuery.extend({
    q: searchTerm,
    category: z.string().trim().max(40).optional(),
    sortBy: z.enum(["relevance", "newest", "oldest", "popular"]).optional(),
    isShort: z.enum(["true", "false"]).optional(),
  }),
};

const searchChannelsSchema = {
  query: paginationQuery.extend({ q: searchTerm }),
};

const suggestionsSchema = {
  query: z.object({ q: searchTerm }),
};

const trendingSchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
    days: z.coerce.number().int().min(1).max(90).optional(),
  }),
};

const relatedSchema = {
  params: z.object({ videoId: objectId }),
  query: z.object({ limit: z.coerce.number().int().min(1).max(30).optional() }),
};

router.get(
  "/videos",
  validate(searchVideosSchema),
  searchController.searchVideos,
);
router.get(
  "/channels",
  validate(searchChannelsSchema),
  searchController.searchChannels,
);
router.get(
  "/suggestions",
  validate(suggestionsSchema),
  searchController.getSuggestions,
);
router.get("/trending", validate(trendingSchema), searchController.getTrending);
router.get(
  "/related/:videoId",
  validate(relatedSchema),
  searchController.getRelatedVideos,
);
router.get(
  "/feed",
  requireAuth,
  validate({ query: paginationQuery }),
  searchController.getSubscriptionFeed,
);

export default router;
