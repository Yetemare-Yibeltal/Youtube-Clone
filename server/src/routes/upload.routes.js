import { Router } from "express";
import * as uploadController from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  uploadImage,
  uploadVideoFiles,
} from "../middleware/upload.middleware.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/image",
  uploadImage.single("image"),
  uploadController.uploadImage,
);
router.post(
  "/video",
  uploadVideoFiles.single("video"),
  uploadController.uploadVideo,
);
router.delete("/:publicId", uploadController.deleteAsset);

export default router;
