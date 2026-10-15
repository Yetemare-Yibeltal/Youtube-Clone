import { Router } from "express";
import * as playlistController from "../controllers/playlist.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  playlistIdParamSchema,
  playlistVideoParamSchema,
  listPlaylistsSchema,
} from "../validators/playlist.validator.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate(listPlaylistsSchema),
  playlistController.listMyPlaylists,
);
router.post(
  "/",
  requireAuth,
  validate(createPlaylistSchema),
  playlistController.createPlaylist,
);

router.get(
  "/:playlistId",
  optionalAuth,
  validate(playlistIdParamSchema),
  playlistController.getPlaylistById,
);
router.patch(
  "/:playlistId",
  requireAuth,
  validate(updatePlaylistSchema),
  playlistController.updatePlaylist,
);
router.delete(
  "/:playlistId",
  requireAuth,
  validate(playlistIdParamSchema),
  playlistController.deletePlaylist,
);

router.post(
  "/:playlistId/videos/:videoId",
  requireAuth,
  validate(playlistVideoParamSchema),
  playlistController.addVideoToPlaylist,
);
router.delete(
  "/:playlistId/videos/:videoId",
  requireAuth,
  validate(playlistVideoParamSchema),
  playlistController.removeVideoFromPlaylist,
);

export default router;
