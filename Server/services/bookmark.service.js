import Bookmark from "../models/bookmark.model.js";
import mongoose from "mongoose";

export const getTotalBookmarkCount = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Count total number of bookmarks (both project and message bookmarks)
  return await Bookmark.countDocuments({ userId });
};

export const getBookmarkedProjects = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const bookmarks = await Bookmark.find({ userId, projectId: { $ne: null } })
    .populate("projectId")
    .lean(); // Use lean() for performance

  console.log("Bookmarked Projects in DB:", bookmarks);

  // Ensure unique projects by using a Map to remove duplicates
  const uniqueProjects = Array.from(
    new Map(
      bookmarks.map((b) => [b.projectId._id.toString(), b.projectId])
    ).values()
  );

  return uniqueProjects;
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
  })
    .populate({
      path: "messageId",
      model: "message",
      select:
        "sender message explanation files hasGeneratedFiles isAiResponse timestamp",
    })
    .lean(); // Use lean() for performance

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
    return { isBookmarked: false, message: "Project bookmark removed" };
  } else {
    await Bookmark.create({ userId, projectId, messageId: null });
    return { isBookmarked: true, message: "Project bookmarked" };
  }
};

export const toggleMessageBookmark = async (userId, projectId, messageId) => {
  if (!userId || !projectId || !messageId) {
    throw new Error("User ID, Project ID, and Message ID are required");
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
    await Bookmark.create({ userId, projectId, messageId });
    return true; // Indicates bookmark was added
  }
};

export const removeMessageBookmark = async (userId, projectId, messageId) => {
  if (!userId || !projectId || !messageId) {
    throw new Error("User ID, Project ID, and Message ID are required");
  }

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new Error("Invalid Message ID");
  }

  const bookmark = await Bookmark.findOne({ 
    userId, 
    projectId, 
    messageId 
  });

  if (!bookmark) {
    throw new Error("Bookmark not found"); 
  }

  await Bookmark.deleteOne({ _id: bookmark._id });
  return true;
};

// Legacy function - maintained for backward compatibility
export const deleteMessageBookmark = async (userId, messageId) => {
  if (!userId || !messageId) {
    throw new Error("User ID and Message ID are required");
  }

  const bookmark = await Bookmark.findOne({ userId, messageId });

  if (!bookmark) {
    return { success: false, message: "Bookmark not found" };
  }

  await Bookmark.deleteOne({ _id: bookmark._id });
  return { success: true, message: "Bookmark deleted" };
};