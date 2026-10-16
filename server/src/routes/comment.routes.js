import { Router } from "express";
import * as commentController from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addCommentSchema,
  listCommentsSchema,
  listRepliesSchema,
  updateCommentSchema,
  commentIdParamSchema,
} from "../validators/comment.validator.js";

const router = Router();

router.get(
  "/video/:videoId",
  validate(listCommentsSchema),
  commentController.listComments,
);
router.post(
  "/video/:videoId",
  requireAuth,
  validate(addCommentSchema),
  commentController.addComment,
);

router.get(
  "/:commentId/replies",
  validate(listRepliesSchema),
  commentController.listReplies,
);
router.patch(
  "/:commentId",
  requireAuth,
  validate(updateCommentSchema),
  commentController.updateComment,
);
router.delete(
  "/:commentId",
  requireAuth,
  validate(commentIdParamSchema),
  commentController.deleteComment,
);

export default router;
