import { Router } from "express";
import { z } from "zod";
import * as likeController from "../controllers/like.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectId, paginationQuery } from "../validators/common.validator.js";

const router = Router();

const reactionBody = z.object({ type: z.enum(["like", "dislike"]) });

router.use(requireAuth);

router.get(
  "/videos",
  validate({ query: paginationQuery }),
  likeController.listLikedVideos,
);
router.get(
  "/video/:videoId/status",
  validate({ params: z.object({ videoId: objectId }) }),
  likeController.getVideoLikeStatus,
);
router.post(
  "/video/:videoId",
  validate({ params: z.object({ videoId: objectId }), body: reactionBody }),
  likeController.toggleVideoLike,
);
router.post(
  "/comment/:commentId",
  validate({ params: z.object({ commentId: objectId }), body: reactionBody }),
  likeController.toggleCommentLike,
);

export default router;
