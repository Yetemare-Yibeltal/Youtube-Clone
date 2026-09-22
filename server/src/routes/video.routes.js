import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createVideoSchema,
  idParamSchema,
  limitQuerySchema,
  listQuerySchema,
  pageQuerySchema,
  searchQuerySchema,
  updateVideoSchema,
} from "../validators/video.validator.js";
import * as videos from "../controllers/video.controller.js";

const router = Router();

router.get("/", validate({ query: listQuerySchema }), videos.list);
router.get("/trending", validate({ query: limitQuerySchema }), videos.trending);
router.get("/search", validate({ query: searchQuerySchema }), videos.search);
router.get(
  "/mine",
  authenticate,
  validate({ query: pageQuerySchema }),
  videos.mine,
);
router.post(
  "/",
  authenticate,
  validate({ body: createVideoSchema }),
  videos.create,
);

router.get(
  "/:id",
  optionalAuth,
  validate({ params: idParamSchema }),
  videos.getById,
);
router.patch(
  "/:id",
  authenticate,
  validate({ params: idParamSchema, body: updateVideoSchema }),
  videos.update,
);
router.delete(
  "/:id",
  authenticate,
  validate({ params: idParamSchema }),
  videos.remove,
);
router.post(
  "/:id/view",
  optionalAuth,
  validate({ params: idParamSchema }),
  videos.registerView,
);

export default router;
