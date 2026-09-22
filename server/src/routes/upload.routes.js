import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { signature } from "../controllers/upload.controller.js";

const router = Router();

router.post("/signature", authenticate, signature);

export default router;
