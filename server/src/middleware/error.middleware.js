import { ZodError } from "zod";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/environment.js";

const PG_ERRORS = {
  23505: [409, "CONFLICT", "This resource already exists"],
  23503: [400, "INVALID_REFERENCE", "A referenced resource does not exist"],
  23514: [400, "CONSTRAINT_VIOLATION", "A value violates a data rule"],
  23502: [400, "MISSING_FIELD", "A required field is missing"],
  "22P02": [400, "INVALID_INPUT", "A value has an invalid format"],
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong";
  let details;

  if (err instanceof ApiError) {
    ({ statusCode: status, code, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Some fields are invalid";
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "Request body is not valid JSON";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body is too large";
  } else if (err?.name === "MulterError") {
    status = 400;
    code = "UPLOAD_ERROR";
    message = err.message;
  } else if (err?.code && PG_ERRORS[err.code]) {
    [status, code, message] = PG_ERRORS[err.code];
  }

  if (status >= 500) logger.error(`${req.method} ${req.originalUrl}`, err);

  const error = { code, message };
  if (details) error.details = details;
  if (status >= 500 && env.isDev) error.stack = err.stack;

  return res.status(status).json({ success: false, error });
};
