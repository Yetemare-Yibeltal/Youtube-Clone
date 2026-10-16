import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as channelService from "../services/channel.service.js";

export const createChannel = asyncHandler(async (req, res) => {
  const channel = await channelService.createChannel(req.user, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, channel, "Channel created successfully"));
});

export const getMyChannel = asyncHandler(async (req, res) => {
  const channel = await channelService.getMyChannel(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, channel, "Channel fetched successfully"));
});

export const getChannelById = asyncHandler(async (req, res) => {
  const channel = await channelService.getChannelById(req.params.channelId);
  res
    .status(200)
    .json(new ApiResponse(200, channel, "Channel fetched successfully"));
});

export const getChannelByHandle = asyncHandler(async (req, res) => {
  const profile = await channelService.getChannelProfileByHandle(
    req.params.handle,
    req.user,
  );
  res
    .status(200)
    .json(new ApiResponse(200, profile, "Channel fetched successfully"));
});

export const updateChannel = asyncHandler(async (req, res) => {
  const channel = await channelService.updateChannel(
    req.params.channelId,
    req.user,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, channel, "Channel updated successfully"));
});

export const updateChannelAvatar = asyncHandler(async (req, res) => {
  const channel = await channelService.updateChannelAvatar(
    req.params.channelId,
    req.user,
    req.file,
  );
  res
    .status(200)
    .json(new ApiResponse(200, channel, "Channel avatar updated successfully"));
});

export const updateChannelBanner = asyncHandler(async (req, res) => {
  const channel = await channelService.updateChannelBanner(
    req.params.channelId,
    req.user,
    req.file,
  );
  res
    .status(200)
    .json(new ApiResponse(200, channel, "Channel banner updated successfully"));
});

export const listChannelVideos = asyncHandler(async (req, res) => {
  const result = await channelService.listChannelVideos(
    req.params.channelId,
    req.user,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Channel videos fetched successfully"));
});

export const deleteChannel = asyncHandler(async (req, res) => {
  await channelService.deleteChannel(req.params.channelId, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Channel deleted successfully"));
});
