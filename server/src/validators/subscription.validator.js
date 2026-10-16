import { z } from "zod";
import { objectId, paginationQuery } from "./common.validator.js";

export const channelIdParamSchema = {
  params: z.object({ channelId: objectId }),
};

export const listSubscriptionsSchema = {
  query: paginationQuery,
};

export const listSubscribersSchema = {
  params: z.object({ channelId: objectId }),
  query: paginationQuery,
};

export const updatePreferenceSchema = {
  params: z.object({ channelId: objectId }),
  body: z.object({
    notificationsEnabled: z.enum(["all", "personalized", "none"]),
  }),
};

export default {
  channelIdParamSchema,
  listSubscriptionsSchema,
  listSubscribersSchema,
  updatePreferenceSchema,
};
