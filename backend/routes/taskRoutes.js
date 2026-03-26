import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} from "../controller/taskController.js";
import { shareTask } from "../controller/shareController.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../validators/taskValidator.js";

const router = express.Router();

// Members can create tasks (they will be auto-assigned to themselves if no assignedTo given)
router.post("/", verifyToken, validate(createTaskSchema), createTask);
router.get("/", verifyToken, getTasks);
router.get("/:id", verifyToken, getTaskById);
router.patch("/:id", verifyToken, validate(updateTaskSchema), updateTask);
router.delete("/:id", verifyToken, checkRole("admin"), deleteTask);

import upload from "../middleware/uploadMiddleware.js";

// Share a task with additional members (any assigned member or admin)
router.post("/:id/share", verifyToken, shareTask);

// Upload a file (any logged in user)
router.post("/upload", verifyToken, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    name: req.file.originalname,
    url: fileUrl,
    fileType: "file"
  });
});

export default router;