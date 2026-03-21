import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import startCronJobs from "./utils/cronJobs.js";
import Task from "./models/Task.js";
dotenv.config();

const app = express();

// ✅ cors and json MUST come before routes
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

app.use("/api/auth",      authRoutes);
app.use("/api/tasks",     taskRoutes);
app.use("/api/calendar",  calendarRoutes);
app.use("/api/analytics", analyticsRoutes);


const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  startCronJobs()
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});