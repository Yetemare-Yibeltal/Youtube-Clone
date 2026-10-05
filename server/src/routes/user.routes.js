import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { uploadImage } from "../middleware/upload.middleware.js";
import {
  updateAccountSchema,
  changePasswordSchema,
  deleteAccountSchema,
  usernameParamSchema,
  listUsersSchema,
} from "../validators/user.validator.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireAdmin,
  validate(listUsersSchema),
  userController.listUsers,
);
router.get("/me", requireAuth, userController.getCurrentUser);
router.patch(
  "/me",
  requireAuth,
  validate(updateAccountSchema),
  userController.updateAccount,
);
router.patch(
  "/me/password",
  requireAuth,
  validate(changePasswordSchema),
  userController.changePassword,
);
router.delete(
  "/me",
  requireAuth,
  validate(deleteAccountSchema),
  userController.deleteAccount,
);

router.patch(
  "/me/avatar",
  requireAuth,
  uploadImage.single("avatar"),
  userController.updateAvatar,
);
router.patch(
  "/me/cover-image",
  requireAuth,
  uploadImage.single("coverImage"),
  userController.updateCoverImage,
);

router.get(
  "/:username",
  optionalAuth,
  validate(usernameParamSchema),
  userController.getUserByUsername,
);

export default router;
