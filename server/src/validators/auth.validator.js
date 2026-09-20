import { z } from "zod";
import {
  displayNameField,
  emailField,
  handleField,
  passwordField,
  tokenField,
} from "./common.validator.js";

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    displayName: displayNameField,
    handle: handleField.optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailField,
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export const tokenSchema = z.object({ token: tokenField }).strict();

export const forgotPasswordSchema = z.object({ email: emailField }).strict();

export const resetPasswordSchema = z
  .object({ token: tokenField, password: passwordField })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: passwordField,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });
