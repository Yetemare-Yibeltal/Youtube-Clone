import { Router } from "express";
import { z } from "zod";
import * as notificationController from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectId, paginationQuery } from "../validators/common.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validate({
    query: paginationQuery.extend({
      unread: z.enum(["true", "false"]).optional(),
    }),
  }),
  notificationController.listNotifications,
);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch(
  "/:notificationId/read",
  validate({ params: z.object({ notificationId: objectId }) }),
  notificationController.markAsRead,
);
router.delete(
  "/:notificationId",
  validate({ params: z.object({ notificationId: objectId }) }),
  notificationController.deleteNotification,
);

export default router;
