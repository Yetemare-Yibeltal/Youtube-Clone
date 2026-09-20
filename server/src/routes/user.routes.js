import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import {
  deleteAccountSchema,
  updateProfileSchema,
} from "../validators/user.validator.js";
import * as users from "../controllers/user.controller.js";

const router = Router();

router.patch(
  "/me",
  authenticate,
  validate({ body: updateProfileSchema }),
  users.updateMe,
);
router.delete(
  "/me",
  authenticate,
  authLimiter,
  validate({ body: deleteAccountSchema }),
  users.deleteMe,
);

export default router;
