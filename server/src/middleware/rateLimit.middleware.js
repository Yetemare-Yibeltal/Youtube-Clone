import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/apiError.js";
import { env } from "../config/environment.js";

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (req, res, next) => next(ApiError.tooManyRequests(message)),
  });

const MINUTE = 60 * 1000;

export const apiLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 600,
  message: "Too many requests, please slow down",
});

export const authLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 20,
  message: "Too many attempts, please try again in a few minutes",
});

export const strictLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: "Too many requests, please try again later",
});
