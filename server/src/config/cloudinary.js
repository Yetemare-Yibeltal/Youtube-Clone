import { v2 as cloudinary } from "cloudinary";
import { env } from "./environment.js";
import { ApiError } from "../utils/apiError.js";

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const assertCloudinary = () => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Video uploads are not configured on this server", {
      code: "UPLOADS_DISABLED",
    });
  }
};

export { cloudinary };
