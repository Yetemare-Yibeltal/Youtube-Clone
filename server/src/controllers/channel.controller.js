import * as channelService from "../services/channel.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getByHandle = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    channel: await channelService.getByHandle(req.validated.params.handle),
  });
});

export const getMine = asyncHandler(async (req, res) => {
  sendSuccess(res, { channel: await channelService.getMine(req.user.id) });
});

export const updateMine = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    channel: await channelService.updateMine(req.user.id, req.validated.body),
  });
});
