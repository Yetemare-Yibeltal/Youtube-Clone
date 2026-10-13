import mongoose, { Schema } from "mongoose";

const videoViewSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: { type: String, default: "", index: true },
    ipHash: { type: String, default: "" },
    watchTimeSeconds: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    device: { type: String, default: "" },
    country: { type: String, default: "" },
  },
  { timestamps: true },
);

videoViewSchema.index({ video: 1, createdAt: -1 });
videoViewSchema.index({ video: 1, viewer: 1, sessionId: 1 });

const VideoView = mongoose.model("VideoView", videoViewSchema);

export default VideoView;
