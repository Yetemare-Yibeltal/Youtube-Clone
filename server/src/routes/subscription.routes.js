import { Router } from "express";
import * as subscriptionController from "../controllers/subscription.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  channelIdParamSchema,
  listSubscriptionsSchema,
  listSubscribersSchema,
  updatePreferenceSchema,
} from "../validators/subscription.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validate(listSubscriptionsSchema),
  subscriptionController.listMySubscriptions,
);
router.post(
  "/:channelId",
  validate(channelIdParamSchema),
  subscriptionController.toggleSubscription,
);
router.get(
  "/:channelId/status",
  validate(channelIdParamSchema),
  subscriptionController.getSubscriptionStatus,
);
router.get(
  "/:channelId/subscribers",
  validate(listSubscribersSchema),
  subscriptionController.listChannelSubscribers,
);
router.patch(
  "/:channelId/preference",
  validate(updatePreferenceSchema),
  subscriptionController.updateNotificationPreference,
);

export default router;
