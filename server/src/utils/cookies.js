import { env } from "../config/environment.js";

export const REFRESH_COOKIE = "refresh_token";

const baseOptions = {
  httpOnly: true,
  secure: env.isProd || env.COOKIE_SAME_SITE === "none",
  sameSite: env.COOKIE_SAME_SITE,
  path: "/api/auth",
};

export const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions,
    maxAge: env.refreshTtlMs,
  });

export const clearRefreshCookie = (res) =>
  res.clearCookie(REFRESH_COOKIE, baseOptions);

export const readRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE];
