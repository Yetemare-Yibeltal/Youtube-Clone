import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "../config/environment.js";
import { ApiError } from "../utils/apiError.js";

const allowedOrigin = new URL(env.CLIENT_URL).origin;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// CSRF defence for cookie-authenticated endpoints: state-changing requests
// that carry an Origin header must come from our own client.
export const originGuard = (req, res, next) => {
  const { origin } = req.headers;
  if (SAFE_METHODS.has(req.method) || !origin || origin === allowedOrigin)
    return next();
  return next(ApiError.forbidden("Origin not allowed"));
};

export const applySecurity = (app) => {
  app.disable("x-powered-by");
  if (env.isProd) app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(originGuard);
};
