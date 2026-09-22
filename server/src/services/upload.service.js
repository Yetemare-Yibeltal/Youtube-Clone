import { cloudinary, assertCloudinary } from "../config/cloudinary.js";
import { env } from "../config/environment.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

export const createSignature = (userId) => {
  assertCloudinary();

  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: `videos/${userId}`,
    allowed_formats: "mp4,mov,webm,mkv",
  };
  const signature = cloudinary.utils.api_sign_request(
    params,
    env.CLOUDINARY_API_SECRET,
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    apiKey: env.CLOUDINARY_API_KEY,
    signature,
    params,
  };
};

export const inspectVideoAsset = async (userId, publicId) => {
  assertCloudinary();

  if (!publicId.startsWith(`videos/${userId}/`)) {
    throw ApiError.forbidden("This upload does not belong to you");
  }

  let asset;
  try {
    asset = await cloudinary.api.resource(publicId, { resource_type: "video" });
  } catch (error) {
    if (error?.error?.http_code === 404 || error?.http_code === 404) {
      throw ApiError.badRequest("Uploaded video was not found", {
        code: "UPLOAD_NOT_FOUND",
      });
    }
    logger.error(
      "Cloudinary lookup failed",
      new Error(error?.error?.message ?? error?.message ?? "unknown"),
    );
    throw new ApiError(502, "Could not verify the upload, please try again", {
      code: "UPLOAD_VERIFY_FAILED",
    });
  }

  return {
    url: asset.secure_url,
    durationSeconds: Math.round(asset.duration ?? 0),
    thumbnailUrl: cloudinary.url(publicId, {
      resource_type: "video",
      format: "jpg",
      secure: true,
      transformation: [
        { width: 640, height: 360, crop: "fill", start_offset: 1 },
      ],
    }),
  };
};
