import * as Like from "../models/Like.js";
import { ApiError } from "../utils/apiError.js";
import { loadVisible } from "./video.service.js";

export const setReaction = async (user, videoId, type) => {
  const video = await loadVisible(videoId, user);
  if (video.status !== "ready" || video.visibility === "private")
    throw ApiError.notFound("Video not found");
  return Like.setVideoReaction({ userId: user.id, videoId, type });
};
