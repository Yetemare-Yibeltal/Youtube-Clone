import { z } from "zod";
import { handleField, urlField } from "./common.validator.js";

export const handleParamSchema = z.object({ handle: handleField });

export const updateChannelSchema = z
  .object({
    handle: handleField.optional(),
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name is too long")
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, "Description is too long")
      .optional(),
    avatarUrl: urlField.nullable().optional(),
    bannerUrl: urlField.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });
