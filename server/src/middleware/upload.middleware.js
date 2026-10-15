import multer from "multer";
import ApiError from "../utils/apiError.js";

const storage = multer.memoryStorage();

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

function fileFilterFor(allowedTypes) {
  return (_req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
  };
}

export const uploadImage = multer({
  storage,
  fileFilter: fileFilterFor(IMAGE_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadVideoFiles = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "video")
      return fileFilterFor(VIDEO_TYPES)(req, file, cb);
    if (file.fieldname === "thumbnail")
      return fileFilterFor(IMAGE_TYPES)(req, file, cb);
    cb(ApiError.badRequest(`Unexpected field: ${file.fieldname}`));
  },
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});
