import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  handleParamSchema,
  listQuerySchema,
} from "../validators/subscription.validator.js";
import * as subscriptions from "../controllers/subscription.controller.js";

const router = Router();

router.get(
  "/mine",
  authenticate,
  validate({ query: listQuerySchema }),
  subscriptions.listMine,
);
router.post(
  "/:handle",
  authenticate,
  validate({ params: handleParamSchema }),
  subscriptions.subscribe,
);
router.delete(
  "/:handle",
  authenticate,
  validate({ params: handleParamSchema }),
  subscriptions.unsubscribe,
);

export default router;
