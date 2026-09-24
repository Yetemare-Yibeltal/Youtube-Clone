import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  channelAnalyticsSchema,
  videoAnalyticsSchema,
  topVideosSchema,
} from "../validators/analytics.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/channels/:channelId",
  validate(channelAnalyticsSchema),
  analyticsController.getChannelAnalytics,
);
router.get(
  "/channels/:channelId/top-videos",
  validate(topVideosSchema),
  analyticsController.getTopVideos,
);
router.get(
  "/videos/:videoId",
  validate(videoAnalyticsSchema),
  analyticsController.getVideoAnalytics,
);

export default router;
