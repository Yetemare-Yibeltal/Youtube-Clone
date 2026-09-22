import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  commentIdParamSchema,
  createCommentSchema,
  idParamSchema,
  listQuerySchema,
  updateCommentSchema,
} from "../validators/comment.validator.js";
import { reactionSchema } from "../validators/video.validator.js";
import * as comments from "../controllers/comment.controller.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  optionalAuth,
  validate({ params: idParamSchema, query: listQuerySchema }),
  comments.list,
);
router.post(
  "/",
  authenticate,
  validate({ params: idParamSchema, body: createCommentSchema }),
  comments.create,
);
router.get(
  "/:commentId/replies",
  optionalAuth,
  validate({ params: idParamSchema.merge(commentIdParamSchema) }),
  comments.listReplies,
);
router.patch(
  "/:commentId",
  authenticate,
  validate({
    params: idParamSchema.merge(commentIdParamSchema),
    body: updateCommentSchema,
  }),
  comments.update,
);
router.delete(
  "/:commentId",
  authenticate,
  validate({ params: idParamSchema.merge(commentIdParamSchema) }),
  comments.remove,
);
router.put(
  "/:commentId/reaction",
  authenticate,
  validate({
    params: idParamSchema.merge(commentIdParamSchema),
    body: reactionSchema,
  }),
  comments.setReaction,
);
router.delete(
  "/:commentId/reaction",
  authenticate,
  validate({ params: idParamSchema.merge(commentIdParamSchema) }),
  comments.clearReaction,
);

export default router;
