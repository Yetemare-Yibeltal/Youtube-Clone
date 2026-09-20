import * as Channel from "../models/Channel.js";
import { ApiError } from "../utils/apiError.js";

export const getByHandle = async (handle) => {
  const row = await Channel.findByHandle(handle);
  if (!row) throw ApiError.notFound("Channel not found");
  return Channel.toPublicChannel(row);
};

export const getMine = async (userId) => {
  const row = await Channel.findByUserId(userId);
  if (!row) throw ApiError.notFound("Channel not found");
  return Channel.toPublicChannel(row);
};

export const updateMine = async (userId, changes) => {
  let row;
  try {
    row = await Channel.updateByUserId(userId, changes);
  } catch (error) {
    if (error.code === "23505" && error.constraint === "channels_handle_key") {
      throw ApiError.conflict("This handle is already taken", {
        code: "HANDLE_TAKEN",
      });
    }
    throw error;
  }
  if (!row) throw ApiError.notFound("Channel not found");
  return Channel.toPublicChannel(row);
};
