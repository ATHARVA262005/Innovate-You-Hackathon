// Server/routes/message.routes.js
import { Router } from "express";
import * as messageService from "../services/message.service.js";
import { authUser } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:projectId", authUser, async (req, res) => {
  try {
    const messages = await messageService.getProjectMessages(
      req.params.projectId
    );
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new route for file history
router.get("/:projectId/file-history", authUser, async (req, res) => {
  try {
    const fileHistory = await messageService.getProjectFileHistory(
      req.params.projectId
    );
    res.json({ fileHistory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/save", authUser, async (req, res) => {
  try {
    const savedMessage = await messageService.saveMessage(req.body);
    res.json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
