import { z } from "zod";
import { objectId, paginationQuery } from "./common.validator.js";

export const updateAccountSchema = {
  body: z.object({
    fullName: z.string().trim().min(1).max(100).optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(
        /^[a-z0-9._]+$/,
        "Username can only contain letters, numbers, dots and underscores",
      )
      .optional(),
  }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters"),
      confirmPassword: z.string().min(8),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

export const deleteAccountSchema = {
  body: z.object({
    password: z.string().min(1, "Password is required to delete your account"),
  }),
};

export const userIdParamSchema = {
  params: z.object({ userId: objectId }),
};

export const usernameParamSchema = {
  params: z.object({ username: z.string().trim().toLowerCase().min(1) }),
};

export const listUsersSchema = {
  query: paginationQuery.extend({
    q: z.string().trim().optional(),
    role: z.enum(["user", "admin"]).optional(),
  }),
};

export const toggleWatchHistorySchema = {
  body: z.object({
    isEnabled: z.boolean(),
  }),
};

export default {
  updateAccountSchema,
  changePasswordSchema,
  deleteAccountSchema,
  userIdParamSchema,
  usernameParamSchema,
  listUsersSchema,
  toggleWatchHistorySchema,
};
