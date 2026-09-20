import { verifyAccessToken } from "../config/jwt.js";
import { ApiError } from "../utils/apiError.js";

const readBearer = (req) => {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
};

export const authenticate = (req, res, next) => {
  const token = readBearer(req);
  if (!token) return next(ApiError.unauthorized("Authentication required"));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    const expired = error.name === "TokenExpiredError";
    return next(
      ApiError.unauthorized(
        expired ? "Access token expired" : "Invalid access token",
        {
          code: expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        },
      ),
    );
  }
};

// Attaches req.user when a valid token is present, but never rejects.
export const optionalAuth = (req, res, next) => {
  const token = readBearer(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // ignore invalid or expired tokens on public routes
    }
  }
  next();
};
