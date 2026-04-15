import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js"; // CHANGE #4
import notificationRoutes from "./routes/notificationRoutes.js";
import startCronJobs from "./utils/cronJobs.js";
import { globalLimiter } from "./middleware/rateLimitMiddleware.js";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use("/api", globalLimiter);

app.use("/api/auth",          authRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/calendar",      calendarRoutes);
app.use("/api/analytics",     analyticsRoutes);
app.use("/api/settings",      settingsRoutes); // CHANGE #4
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startCronJobs();
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});