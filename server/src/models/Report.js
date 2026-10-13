import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["video", "comment", "channel", "user"],
      required: true,
    },
    video: { type: Schema.Types.ObjectId, ref: "Video", default: null },
    comment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    channel: { type: Schema.Types.ObjectId, ref: "Channel", default: null },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "violence",
        "nudity",
        "misinformation",
        "copyright",
        "child_safety",
        "other",
      ],
      required: true,
    },
    details: { type: String, default: "", maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
