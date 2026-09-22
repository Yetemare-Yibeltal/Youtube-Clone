import * as uploadService from "../services/upload.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const signature = asyncHandler(async (req, res) => {
  sendSuccess(res, uploadService.createSignature(req.user.id));
});
