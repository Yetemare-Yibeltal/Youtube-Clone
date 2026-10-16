import { Router } from "express";
import * as videoController from "../controllers/video.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  uploadImage,
  uploadVideoFiles,
} from "../middleware/upload.middleware.js";
import {
  uploadVideoSchema,
  updateVideoSchema,
  videoIdParamSchema,
  listVideosSchema,
} from "../validators/video.validator.js";

const router = Router();

router.get("/", validate(listVideosSchema), videoController.listVideos);

router.post(
  "/",
  requireAuth,
  uploadVideoFiles.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  validate(uploadVideoSchema),
  videoController.uploadVideo,
);

router.get(
  "/:videoId",
  optionalAuth,
  validate(videoIdParamSchema),
  videoController.getVideoById,
);
router.patch(
  "/:videoId",
  requireAuth,
  validate(updateVideoSchema),
  videoController.updateVideo,
);
router.patch(
  "/:videoId/thumbnail",
  requireAuth,
  uploadImage.single("thumbnail"),
  validate(videoIdParamSchema),
  videoController.updateVideoThumbnail,
);
router.delete(
  "/:videoId",
  requireAuth,
  validate(videoIdParamSchema),
  videoController.deleteVideo,
);
router.post(
  "/:videoId/view",
  optionalAuth,
  validate(videoIdParamSchema),
  videoController.recordView,
);

export default router;
