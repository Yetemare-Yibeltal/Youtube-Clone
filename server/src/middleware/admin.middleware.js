import { query } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";

export const requireRole =
  (...roles) =>
  async (req, res, next) => {
    try {
      if (!req.user) throw ApiError.unauthorized("Authentication required");

      const { rows } = await query(
        "SELECT role, is_active FROM users WHERE id = $1",
        [req.user.id],
      );
      const account = rows[0];

      if (!account || !account.is_active)
        throw ApiError.unauthorized("Account is unavailable");
      if (!roles.includes(account.role))
        throw ApiError.forbidden("You do not have permission to do this");

      req.user.role = account.role;
      next();
    } catch (error) {
      next(error);
    }
  };

export const requireAdmin = requireRole("admin");
export const requireStaff = requireRole("moderator", "admin");
