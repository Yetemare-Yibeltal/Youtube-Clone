import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';

import env from './config/environment.js';
import logger from './utils/logger.js';
import { requestContextMiddleware } from './utils/requestContext.js';
import {
  helmetMiddleware,
  hppMiddleware,
  corsMiddleware,
  mongoSanitizeMiddleware,
} from './middleware/security.middleware.js';
import { apiLimiter, uploadLimiter } from './middleware/rateLimit.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';
import { errorConverter, errorHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import channelRoutes from './routes/channel.routes.js';
import videoRoutes from './routes/video.routes.js';
import commentRoutes from './routes/comment.routes.js';
import likeRoutes from './routes/like.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import playlistRoutes from './routes/playlist.routes.js';
import historyRoutes from './routes/history.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import searchRoutes from './routes/search.routes.js';
import shortsRoutes from './routes/shorts.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminRoutes from './routes/admin.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(hppMiddleware);
app.use(compression());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(mongoSanitizeMiddleware);
app.use(requestContextMiddleware);

if (!env.isTest) {
  app.use(
    morgan(env.isProduction ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK', uptime: process.uptime() });
});

const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/channels`, channelRoutes);
app.use(`${API_PREFIX}/videos`, videoRoutes);
app.use(`${API_PREFIX}/comments`, commentRoutes);
app.use(`${API_PREFIX}/likes`, likeRoutes);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/playlists`, playlistRoutes);
app.use(`${API_PREFIX}/history`, historyRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/shorts`, shortsRoutes);
app.use(`${API_PREFIX}/uploads`, uploadLimiter, uploadRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

app.use(notFound);
app.use(errorConverter);
app.use(errorHandler);

export default app;