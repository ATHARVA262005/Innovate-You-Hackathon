import Bookmark from "../models/bookmark.model.js";
import ProjectModel from "../models/project.model.js";
import mongoose from "mongoose";

export const getTotalBookmarkCount = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Count total number of bookmarks (both project and message bookmarks)
  const count = await Bookmark.countDocuments({ userId });
  return count;
};

export const getBookmarkedProjects = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const bookmarks = await Bookmark.find({
    userId,
  }).populate("projectId");

  console.log("Bookmarked Projects in DB:", bookmarks);

  return bookmarks.map((bookmark) => bookmark.projectId);
};

export const getBookmarkedMessages = async (userId, projectId) => {
  if (!userId || !projectId) {
    throw new Error("User ID and Project ID are required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid Project ID");
  }

  const bookmarks = await Bookmark.find({
    userId,
    projectId,
    messageId: { $ne: null },
  }).populate({
    path: "messageId",
    model: "message",
    select:
      "sender message explanation files hasGeneratedFiles isAiResponse timestamp",
  });

  return bookmarks.map((bookmark) => bookmark.messageId);
};

export const toggleProjectBookmark = async (userId, projectId) => {
  if (!userId || !projectId) {
    throw new Error("User ID and Project ID are required");
  }

  const existingBookmark = await Bookmark.findOne({
    userId,
    projectId,
    messageId: null,
  });

  if (existingBookmark) {
    await Bookmark.deleteOne({ _id: existingBookmark._id });
    return false; // Indicates bookmark was removed
  } else {
    await Bookmark.create({
      userId,
      projectId,
      messageId: null,
    });
    return true; // Indicates bookmark was added
  }
};

export const toggleMessageBookmark = async (userId, projectId, messageId) => {
  if (!userId || !projectId || !messageId) {
    throw new Error("User ID, Project ID and Message ID are required");
  }

  const existingBookmark = await Bookmark.findOne({
    userId,
    projectId,
    messageId,
  });

  if (existingBookmark) {
    await Bookmark.deleteOne({ _id: existingBookmark._id });
    return false; // Indicates bookmark was removed
  } else {
    await Bookmark.create({
      userId,
      projectId,
      messageId,
    });
    return true; // Indicates bookmark was added
  }
};

export const deleteMessageBookmark = async (userId, messageId) => {
  if (!userId || !messageId) {
    throw new Error("User ID and Message ID are required");
  }

  // Check if the bookmark exists for the given message and user
  const bookmark = await Bookmark.findOne({
    userId,
    messageId,
  });

  if (!bookmark) {
    return false; // No bookmark found, so nothing to delete
  }

  // Delete the bookmark
  await Bookmark.deleteOne({ _id: bookmark._id });
  return true; // Successfully deleted the bookmark
};