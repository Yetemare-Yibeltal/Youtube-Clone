import Video from "../models/Video.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";

const CHANNEL_SELECT = "name handle avatar subscribersCount isVerified";
const SHORTS_FILTER = {
  isShort: true,
  status: "published",
  visibility: "public",
};

export const listShorts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, {
    defaultLimit: 8,
    maxLimit: 20,
  });
  const sort =
    req.query.sortBy === "popular"
      ? { views: -1, publishedAt: -1 }
      : { publishedAt: -1 };

  const [docs, total] = await Promise.all([
    Video.find(SHORTS_FILTER)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("channel", CHANNEL_SELECT)
      .lean(),
    Video.countDocuments(SHORTS_FILTER),
  ]);

  const result = buildPaginatedResult({ docs, total, page, limit });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Shorts fetched successfully"));
});

export const getShortById = asyncHandler(async (req, res) => {
  const short = await Video.findOne({
    _id: req.params.videoId,
    ...SHORTS_FILTER,
  })
    .populate("channel", CHANNEL_SELECT)
    .lean();
  if (!short) throw ApiError.notFound("Short not found");

  res
    .status(200)
    .json(new ApiResponse(200, short, "Short fetched successfully"));
});
