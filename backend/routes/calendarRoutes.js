import express from "express";
import { getCalendarEvents } from "../controller/calendarController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getCalendarEvents);

export default router;