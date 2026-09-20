import { z } from "zod";
import { displayNameField, urlField } from "./common.validator.js";

export const updateProfileSchema = z
  .object({
    displayName: displayNameField.optional(),
    avatarUrl: urlField.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const deleteAccountSchema = z
  .object({ password: z.string().min(1, "Password is required").max(128) })
  .strict();
