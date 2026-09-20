const DEFAULT_CODES = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  429: "TOO_MANY_REQUESTS",
};

export class ApiError extends Error {
  constructor(statusCode, message, { code, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code ?? DEFAULT_CODES[statusCode] ?? "ERROR";
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = "Bad request", options) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = "Authentication required", options) {
    return new ApiError(401, message, options);
  }

  static forbidden(message = "Forbidden", options) {
    return new ApiError(403, message, options);
  }

  static notFound(message = "Resource not found", options) {
    return new ApiError(404, message, options);
  }

  static conflict(message = "Conflict", options) {
    return new ApiError(409, message, options);
  }

  static tooManyRequests(
    message = "Too many requests, please try again later",
    options,
  ) {
    return new ApiError(429, message, options);
  }
}
