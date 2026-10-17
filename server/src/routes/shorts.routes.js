import { Router } from "express";
import { z } from "zod";
import * as shortsController from "../controllers/shorts.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { objectId, paginationQuery } from "../validators/common.validator.js";

const router = Router();

router.get(
  "/",
  validate({
    query: paginationQuery.extend({
      sortBy: z.enum(["newest", "popular"]).optional(),
    }),
  }),
  shortsController.listShorts,
);
router.get(
  "/:videoId",
  validate({ params: z.object({ videoId: objectId }) }),
  shortsController.getShortById,
);
export default router;
