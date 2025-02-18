import * as bookmarkService from "../services/bookmark.service.js";

export const getTotalBookmarkCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await bookmarkService.getTotalBookmarkCount(userId);
    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

export const getBookmarkedProjects = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming req.user is already populated by auth middleware
    const projects = await bookmarkService.getBookmarkedProjects(userId);
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

export const getBookmarkedMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    const userId = req.user._id; // Assuming req.user is already populated by auth middleware
    const messages = await bookmarkService.getBookmarkedMessages(
      userId,
      projectId
    );
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

export const toggleProjectBookmark = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    const userId = req.user._id; // Assuming req.user is already populated by auth middleware
    const isBookmarked = await bookmarkService.toggleProjectBookmark(
      userId,
      projectId
    );
    res.status(200).json({
      message: isBookmarked ? "Project bookmarked" : "Project bookmark removed",
      isBookmarked,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

export const toggleMessageBookmark = async (req, res) => {
  try {
    const { projectId, messageId } = req.params;
    if (!projectId || !messageId) {
      return res
        .status(400)
        .json({ message: "Project ID and Message ID are required" });
    }
    const userId = req.user._id; // Assuming req.user is already populated by auth middleware
    const isBookmarked = await bookmarkService.toggleMessageBookmark(
      userId,
      projectId,
      messageId
    );
    res.status(200).json({
      message: isBookmarked ? "Message bookmarked" : "Message bookmark removed",
      isBookmarked,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteMessageBookmark = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id; // Assuming req.user is populated by auth middleware

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    const isDeleted = await bookmarkService.deleteMessageBookmark(
      userId,
      messageId
    );

    if (isDeleted) {
      res.status(200).json({
        message: "Message bookmark deleted",
      });
    } else {
      res.status(404).json({ message: "Bookmark not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};
