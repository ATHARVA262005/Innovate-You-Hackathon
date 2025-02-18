import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate bookmarks
bookmarkSchema.index(
  { userId: 1, projectId: 1, messageId: 1 },
  { unique: true }
);

const Bookmark = mongoose.model("bookmark", bookmarkSchema);
export default Bookmark;
