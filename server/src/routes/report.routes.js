import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createReportSchema,
  listReportsSchema,
  reviewReportSchema,
} from "../validators/report.validator.js";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createReportSchema), reportController.createReport);
router.get(
  "/",
  requireAdmin,
  validate(listReportsSchema),
  reportController.listReports,
);
router.patch(
  "/:reportId",
  requireAdmin,
  validate(reviewReportSchema),
  reportController.reviewReport,
);

export default router;
