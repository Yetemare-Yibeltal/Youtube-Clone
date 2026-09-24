import express from "express";
import morgan from "morgan";
import { env } from "./config/environment.js";
import { applySecurity } from "./middleware/security.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import videoRoutes from "./routes/video.routes.js";
import likeRoutes from "./routes/like.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

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
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/videos", likeRoutes);
app.use("/api/videos/:id/comments", commentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.use(notFound);
app.use(errorHandler);
// added imports
import userRoutes from './routes/user.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// mounted after shorts routes
app.use(`${API_PREFIX}/shorts`, shortsRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/uploads`, uploadRoutes);
// Additional routers (admin, analytics) are mounted here as each module is
// built. See routes/*.routes.js.
export default app;
