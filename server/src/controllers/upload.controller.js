import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as uploadService from "../services/upload.service.js";

export const uploadImage = asyncHandler(async (req, res) => {
  const folder = req.body.folder || "misc";
  const asset = await uploadService.uploadImageAsset(req.file, folder);
  res
    .status(201)
    .json(new ApiResponse(201, asset, "Image uploaded successfully"));
});

export const uploadVideo = asyncHandler(async (req, res) => {
  const folder = req.body.folder || "misc";
  const asset = await uploadService.uploadVideoAsset(req.file, folder);
  res
    .status(201)
    .json(new ApiResponse(201, asset, "Video uploaded successfully"));
});

export const deleteAsset = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const resourceType = req.query.resourceType || "image";
  await uploadService.deleteAsset(decodeURIComponent(publicId), resourceType);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Asset deleted successfully"));
});
