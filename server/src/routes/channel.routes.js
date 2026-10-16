import { Router } from "express";
import * as channelController from "../controllers/channel.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { uploadImage } from "../middleware/upload.middleware.js";
import {
  createChannelSchema,
  updateChannelSchema,
  channelIdParamSchema,
  handleParamSchema,
  channelVideosSchema,
} from "../validators/channel.validator.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  validate(createChannelSchema),
  channelController.createChannel,
);
router.get("/me", requireAuth, channelController.getMyChannel);
router.get(
  "/handle/:handle",
  optionalAuth,
  validate(handleParamSchema),
  channelController.getChannelByHandle,
);

router.get(
  "/:channelId",
  validate(channelIdParamSchema),
  channelController.getChannelById,
);
router.get(
  "/:channelId/videos",
  optionalAuth,
  validate(channelVideosSchema),
  channelController.listChannelVideos,
);
router.patch(
  "/:channelId",
  requireAuth,
  validate(updateChannelSchema),
  channelController.updateChannel,
);
router.patch(
  "/:channelId/avatar",
  requireAuth,
  uploadImage.single("avatar"),
  validate(channelIdParamSchema),
  channelController.updateChannelAvatar,
);
router.patch(
  "/:channelId/banner",
  requireAuth,
  uploadImage.single("banner"),
  validate(channelIdParamSchema),
  channelController.updateChannelBanner,
);
router.delete(
  "/:channelId",
  requireAuth,
  validate(channelIdParamSchema),
  channelController.deleteChannel,
);

export default router;
