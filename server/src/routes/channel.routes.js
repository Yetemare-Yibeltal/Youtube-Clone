import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  handleParamSchema,
  updateChannelSchema,
} from "../validators/channel.validator.js";
import * as channels from "../controllers/channel.controller.js";

const router = Router();

router.get("/me", authenticate, channels.getMine);
router.patch(
  "/me",
  authenticate,
  validate({ body: updateChannelSchema }),
  channels.updateMine,
);
router.get(
  "/:handle",
  validate({ params: handleParamSchema }),
  channels.getByHandle,
);

export default router;
