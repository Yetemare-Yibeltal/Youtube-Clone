import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: [
        "new_video",
        "new_subscriber",
        "comment",
        "reply",
        "like",
        "mention",
        "system",
      ],
      required: true,
    },
    video: { type: Schema.Types.ObjectId, ref: "Video", default: null },
    comment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    channel: { type: Schema.Types.ObjectId, ref: "Channel", default: null },
    message: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
