import { z } from "zod";
import { handleField } from "./common.validator.js";

export const handleParamSchema = z.object({ handle: handleField });
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
