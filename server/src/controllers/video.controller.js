import * as videoService from "../services/video.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendCreated,
  sendNoContent,
  sendSuccess,
} from "../utils/apiResponse.js";
import { requestContext } from "../utils/requestContext.js";

export const create = asyncHandler(async (req, res) => {
  sendCreated(res, {
    video: await videoService.create(req.user, req.validated.body),
  });
});

export const getById = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    video: await videoService.getById(req.validated.params.id, req.user),
  });
});

export const update = asyncHandler(async (req, res) => {
  const video = await videoService.update(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, { video });
});

export const remove = asyncHandler(async (req, res) => {
  await videoService.remove(req.user, req.validated.params.id);
  sendNoContent(res);
});

export const list = asyncHandler(async (req, res) => {
  const { videos, nextCursor } = await videoService.listFeed(
    req.validated.query,
  );
  sendSuccess(res, { videos }, { meta: { nextCursor } });
});

export const trending = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    videos: await videoService.trending(req.validated.query),
  });
});

export const search = asyncHandler(async (req, res) => {
  const { videos, meta } = await videoService.search(req.validated.query);
  sendSuccess(res, { videos }, { meta });
});

export const mine = asyncHandler(async (req, res) => {
  const { videos, meta } = await videoService.listMine(
    req.user.id,
    req.validated.query,
  );
  sendSuccess(res, { videos }, { meta });
});

export const registerView = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await videoService.registerView(
      req.validated.params.id,
      req.user,
      requestContext(req),
    ),
  );
});
