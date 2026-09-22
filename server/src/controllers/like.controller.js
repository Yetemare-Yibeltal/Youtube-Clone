import * as likeService from "../services/like.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const setReaction = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await likeService.setReaction(
      req.user,
      req.validated.params.id,
      req.validated.body.type,
    ),
  );
});

export const clearReaction = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await likeService.setReaction(req.user, req.validated.params.id, null),
  );
});
