import { ApiError } from "../utils/apiError.js";

export const notFound = (req, res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
