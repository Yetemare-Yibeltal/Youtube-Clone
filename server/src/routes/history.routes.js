import { Router } from "express";
import { z } from "zod";
import * as historyController from "../controllers/history.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectId, paginationQuery } from "../validators/common.validator.js";

const router = Router();

const videoParam = { params: z.object({ videoId: objectId }) };

router.use(requireAuth);

router.get(
  "/",
  validate({ query: paginationQuery }),
  historyController.listHistory,
);
router.delete("/", historyController.clearHistory);
router.patch(
  "/toggle",
  validate({ body: z.object({ isEnabled: z.boolean() }) }),
  historyController.toggleHistory,
);
router.post(
  "/:videoId",
  validate({
    ...videoParam,
    body: z.object({ progressSeconds: z.coerce.number().min(0) }),
  }),
  historyController.recordProgress,
);
router.delete(
  "/:videoId",
  validate(videoParam),
  historyController.removeFromHistory,
);

export default router;
