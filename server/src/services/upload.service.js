import ApiError from "../utils/apiError.js";
import {
  uploadBufferToCloudinary,
  destroyCloudinaryAsset,
} from "../config/cloudinary.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export async function uploadImageAsset(file, folder = "misc") {
  if (!file) throw ApiError.badRequest("Image file is required");
  if (file.size > MAX_IMAGE_BYTES)
    throw ApiError.badRequest("Image must be smaller than 5MB");

  const result = await uploadBufferToCloudinary(file.buffer, {
    resource_type: "image",
    folder: `youtube-clone/${folder}`,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function uploadVideoAsset(file, folder = "misc") {
  if (!file) throw ApiError.badRequest("Video file is required");
  if (file.size > MAX_VIDEO_BYTES)
    throw ApiError.badRequest("Video must be smaller than 2GB");

  const result = await uploadBufferToCloudinary(file.buffer, {
    resource_type: "video",
    folder: `youtube-clone/${folder}`,
    chunk_size: 6 * 1024 * 1024,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function deleteAsset(publicId, resourceType = "image") {
  if (!publicId) throw ApiError.badRequest("publicId is required");
  await destroyCloudinaryAsset(publicId, resourceType);
  return true;
}

export default {
  uploadImageAsset,
  uploadVideoAsset,
  deleteAsset,
};
