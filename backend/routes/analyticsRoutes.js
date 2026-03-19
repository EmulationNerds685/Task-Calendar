import express from "express";
import { getAnalytics } from "../controller/analyticsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getAnalytics);

export default router;