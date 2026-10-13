import mongoose, { Schema } from "mongoose";

const watchHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },
    progressSeconds: { type: Number, default: 0, min: 0 },
    watchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

watchHistorySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistorySchema.index({ user: 1, watchedAt: -1 });

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

export default WatchHistory;
