import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "", maxlength: 5000 },
    videos: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "private",
    },
    isSystem: { type: Boolean, default: false },
    systemType: {
      type: String,
      enum: ["watch_later", "liked_videos", null],
      default: null,
    },
    thumbnail: { type: String, default: "" },
  },
  { timestamps: true },
);

playlistSchema.index(
  { owner: 1, systemType: 1 },
  {
    unique: true,
    partialFilterExpression: { systemType: { $type: "string" } },
  },
);

const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
