import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  authLimiter,
  strictLimiter,
} from "../middleware/rateLimit.middleware.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from "../validators/auth.validator.js";
import * as auth from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  auth.register,
);
router.post("/login", authLimiter, validate({ body: loginSchema }), auth.login);
router.post("/refresh", authLimiter, auth.refresh);
router.post("/logout", auth.logout);
router.post("/logout-all", authenticate, auth.logoutAll);
router.get("/me", authenticate, auth.me);

router.post(
  "/verify-email",
  authLimiter,
  validate({ body: tokenSchema }),
  auth.verifyEmail,
);
router.post(
  "/resend-verification",
  authenticate,
  strictLimiter,
  auth.resendVerification,
);
router.post(
  "/forgot-password",
  strictLimiter,
  validate({ body: forgotPasswordSchema }),
  auth.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validate({ body: resetPasswordSchema }),
  auth.resetPassword,
);
router.post(
  "/change-password",
  authenticate,
  authLimiter,
  validate({ body: changePasswordSchema }),
  auth.changePassword,
);

export default router;
