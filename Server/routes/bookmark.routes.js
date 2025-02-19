import { Router } from "express";
import * as bookmarkController from "../controllers/bookmark.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import * as bookmarkService from "../services/bookmark.service.js";

const router = Router();

router.get(
  "/count",
  authMiddleware.authUser,
  bookmarkController.getTotalBookmarkCount
);

router.get(
  "/projects/bookmarked",
  authMiddleware.authUser,
  bookmarkController.getBookmarkedProjects
);

router.get(
  "/projects/:projectId/bookmarked-messages",
  authMiddleware.authUser,
  bookmarkController.getBookmarkedMessages
);

router.post(
  "/projects/:projectId/bookmark",
  authMiddleware.authUser,
  bookmarkController.toggleProjectBookmark
);

// Handle bookmark creation/toggle with POST
router.post(
  "/projects/:projectId/messages/:messageId/bookmark",
  authMiddleware.authUser,
  async (req, res) => {
    const { projectId, messageId } = req.params;
    if (!projectId || !messageId) {
      return res
        .status(400)
        .json({ message: "Project ID and Message ID are required" });
    }
    try {
      const isBookmarked = await bookmarkService.toggleMessageBookmark(
        req.user._id,
        projectId,
        messageId
      );
      res.status(200).json({
        message: isBookmarked
          ? "Message bookmarked"
          : "Message bookmark removed",
        isBookmarked,
      });
    } catch (error) {
      console.error("Error toggling message bookmark:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// New consistent DELETE endpoint that matches the bookmark structure 
router.delete(
  "/projects/:projectId/messages/:messageId/bookmark",
  authMiddleware.authUser,
  async (req, res) => {
    const { projectId, messageId } = req.params;
    if (!projectId || !messageId) {
      return res
        .status(400)
        .json({ message: "Project ID and Message ID are required" });
    }
    try {
      await bookmarkService.removeMessageBookmark(
        req.user._id,
        projectId,
        messageId
      );
      res.status(200).json({
        message: "Message bookmark removed successfully"
      });
    } catch (error) {
      console.error("Error removing message bookmark:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Legacy endpoint - marked as deprecated
router.delete(
  "/messages/:messageId/bookmark",
  authMiddleware.authUser,
  (req, res) => {
    // Log deprecation warning
    console.warn(`Deprecated endpoint used: /messages/${req.params.messageId}/bookmark`);
    return res.status(400).json({ 
      message: "This endpoint requires a project ID. Please use /projects/:projectId/messages/:messageId/bookmark instead" 
    });
  }
);

export default router;