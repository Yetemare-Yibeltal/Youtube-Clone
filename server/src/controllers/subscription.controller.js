import * as subscriptionService from "../services/subscription.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const subscribe = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await subscriptionService.subscribe(req.user, req.validated.params.handle),
  );
});

export const unsubscribe = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await subscriptionService.unsubscribe(
      req.user,
      req.validated.params.handle,
    ),
  );
});

export const listMine = asyncHandler(async (req, res) => {
  const { subscriptions, meta } = await subscriptionService.listMine(
    req.user.id,
    req.validated.query,
  );
  sendSuccess(res, { subscriptions }, { meta });
});
