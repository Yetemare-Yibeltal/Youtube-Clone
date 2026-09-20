import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email("Enter a valid email address");

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/\p{L}/u, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const RESERVED_HANDLES = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "root",
  "support",
  "help",
  "moderator",
  "settings",
  "studio",
  "upload",
  "watch",
  "search",
  "trending",
  "shorts",
  "history",
  "library",
  "subscriptions",
  "me",
  "null",
  "undefined",
  "youtube",
]);

export const handleField = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9_.-]{3,30}$/,
    "Handle must be 3-30 characters: letters, numbers, dot, dash or underscore",
  )
  .refine((value) => !RESERVED_HANDLES.has(value), "This handle is reserved");

export const displayNameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name is too long");

export const urlField = z
  .string()
  .trim()
  .max(2048)
  .url("Enter a valid URL")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "URL must start with http:// or https://",
  );

export const tokenField = z.string().trim().min(20).max(200);

export const uuidField = z.string().uuid("Invalid id");
