import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  idParamSchema,
  reactionSchema,
} from "../validators/video.validator.js";
import * as likes from "../controllers/like.controller.js";

const router = Router();

router.put(
  "/:id/reaction",
  authenticate,
  validate({ params: idParamSchema, body: reactionSchema }),
  likes.setReaction,
);
router.delete(
  "/:id/reaction",
  authenticate,
  validate({ params: idParamSchema }),
  likes.clearReaction,
);

export default router;
