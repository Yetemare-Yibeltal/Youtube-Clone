import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
import logger from "../utils/logger.js";
import { queueNewVideoNotifications } from "./notification.job.js";

/**
 * In a production system this would live behind a real queue (BullMQ, SQS,
 * a transcoding webhook, etc). Cloudinary already handles the actual video
 * encoding for us, so here we simulate the "processing" window a real
 * pipeline would have: flip the video from `processing` to `published`
 * shortly after upload, then fan out new-video notifications to
 * subscribers. Runs fire-and-forget so the upload request itself stays fast.
 */
const SIMULATED_PROCESSING_DELAY_MS =
  Number(process.env.VIDEO_PROCESSING_DELAY_MS) || 3000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processUploadedVideo(videoId) {
  try {
    await wait(SIMULATED_PROCESSING_DELAY_MS);

    const video = await Video.findById(videoId);
    if (!video) {
      logger.warn(
        `videoProcessing.job: video ${videoId} no longer exists, skipping`,
      );
      return;
    }

    if (video.status !== "processing") {
      // Already published/failed/deleted by the time this job ran.
      return;
    }

    video.status = "published";
    video.publishedAt = new Date();
    await video.save();

    logger.info(`videoProcessing.job: video ${videoId} marked as published`);

    if (video.visibility === "public") {
      const channel = await Channel.findById(video.channel);
      if (channel) {
        queueNewVideoNotifications(channel, video);
      }
    }
  } catch (err) {
    logger.error(
      `videoProcessing.job failed for video ${videoId}: ${err.message}`,
    );
    await Video.findByIdAndUpdate(videoId, { status: "failed" }).catch(
      () => {},
    );
  }
}

/** Fire-and-forget entry point used by video.service.js right after upload. */
export function queueVideoProcessing(videoId) {
  processUploadedVideo(videoId).catch((err) =>
    logger.error(`queueVideoProcessing: unexpected error: ${err.message}`),
  );
}

export default { processUploadedVideo, queueVideoProcessing };
