import { Router } from "express";
import { z } from "zod";
import * as adminController from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectId, paginationQuery } from "../validators/common.validator.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", adminController.getDashboardStats);

router.get(
  "/audit-logs",
  validate({
    query: paginationQuery.extend({
      action: z.string().optional(),
      actor: objectId.optional(),
    }),
  }),
  adminController.listAuditLogs,
);

router.get(
  "/videos",
  validate({
    query: paginationQuery.extend({
      status: z.enum(["processing", "published", "failed"]).optional(),
    }),
  }),
  adminController.listAllVideosForModeration,
);
router.delete(
  "/videos/:videoId",
  validate({ params: z.object({ videoId: objectId }) }),
  adminController.deleteVideoAsAdmin,
);

router.delete(
  "/comments/:commentId",
  validate({ params: z.object({ commentId: objectId }) }),
  adminController.deleteCommentAsAdmin,
);

router.patch(
  "/users/:userId/ban",
  validate({
    params: z.object({ userId: objectId }),
    body: z.object({ reason: z.string().trim().max(500).optional() }),
  }),
  adminController.banUser,
);
router.patch(
  "/users/:userId/unban",
  validate({ params: z.object({ userId: objectId }) }),
  adminController.unbanUser,
);

router.patch(
  "/channels/:channelId/verify",
  validate({
    params: z.object({ channelId: objectId }),
    body: z.object({ isVerified: z.boolean() }),
  }),
  adminController.setChannelVerification,
);

export default router;
