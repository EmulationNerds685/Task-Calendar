import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead
} from "../controller/notificationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All notification routes require authentication
router.get("/",            verifyToken, getNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);
router.patch("/read-all",   verifyToken, markAllRead);
router.patch("/:id/read",   verifyToken, markRead);

export default router;
