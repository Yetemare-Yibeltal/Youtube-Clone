import express from "express";
import morgan from "morgan";
import { env } from "./config/environment.js";
import { applySecurity } from "./middleware/security.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

applySecurity(app);
if (!env.isTest) app.use(morgan(env.isProd ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
// Feature routers are mounted here.

app.use(notFound);
app.use(errorHandler);

export default app;
