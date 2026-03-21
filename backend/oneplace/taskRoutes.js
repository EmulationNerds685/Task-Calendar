import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} from "../controller/taskController.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../validators/taskValidator.js";

const router = express.Router();

router.post("/", verifyToken, checkRole("admin"), validate(createTaskSchema), createTask);
router.get("/", verifyToken, getTasks);
router.get("/:id", verifyToken, getTaskById);
router.patch("/:id", verifyToken, validate(updateTaskSchema), updateTask);
router.delete("/:id", verifyToken, checkRole("admin"), deleteTask);

export default router;