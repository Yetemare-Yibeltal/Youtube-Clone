// added import
import { queueVideoProcessing } from "../jobs/videoProcessing.job.js";

// uploadVideo now creates with status: 'processing' and queues the job
const video = await Video.create({
  // ...
  duration: videoUpload.duration || 0,
  status: "processing",
});

await Channel.findByIdAndUpdate(channel._id, { $inc: { videosCount: 1 } });

queueVideoProcessing(video._id);

return video;

// getVideoById now blocks non-owners from videos that aren't published yet
const isOwner = viewer && video.owner.toString() === viewer._id.toString();

if (video.visibility === "private" && !isOwner) {
  throw ApiError.forbidden("This video is private");
}
if (video.status !== "published" && !isOwner) {
  throw ApiError.notFound("Video not found");
}
