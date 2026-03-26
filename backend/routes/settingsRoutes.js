import express from "express";
import { getSettings, updateSettings } from "../controller/settingsController.js";
import { verifyToken, checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Any authenticated user can read settings (dropdowns need this)
router.get("/", verifyToken, getSettings);

// Only admins can modify settings
router.patch("/", verifyToken, checkRole("admin"), updateSettings);

export default router;