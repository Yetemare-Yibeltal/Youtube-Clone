import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as searchService from "../services/search.service.js";
import * as recommendationService from "../services/recommendation.service.js";

export const searchVideos = asyncHandler(async (req, res) => {
  const result = await searchService.searchVideos(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

export const searchChannels = asyncHandler(async (req, res) => {
  const result = await searchService.searchChannels(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Channels fetched successfully"));
});

export const getSuggestions = asyncHandler(async (req, res) => {
  const result = await searchService.getSuggestions(req.query.q);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Suggestions fetched successfully"));
});

export const getTrending = asyncHandler(async (req, res) => {
  const videos = await recommendationService.getTrendingVideos(req.query);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { results: videos },
        "Trending videos fetched successfully",
      ),
    );
});

export const getRelatedVideos = asyncHandler(async (req, res) => {
  const videos = await recommendationService.getRelatedVideos(
    req.params.videoId,
    req.query,
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { results: videos },
        "Related videos fetched successfully",
      ),
    );
});

export const getSubscriptionFeed = asyncHandler(async (req, res) => {
  const result = await recommendationService.getSubscriptionFeed(
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, result, "Subscription feed fetched successfully"),
    );
});
