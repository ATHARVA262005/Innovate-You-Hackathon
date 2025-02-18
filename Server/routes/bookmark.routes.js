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

router.delete(
  "/messages/:messageId/bookmark",
  authMiddleware.authUser,
  bookmarkController.toggleMessageBookmark
);

export default router;