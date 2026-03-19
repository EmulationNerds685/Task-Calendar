import express from "express";
import { login, register, getMe } from "../controller/authController.js";
import { verifyToken,checkRole } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";
import User from "../models/User.js";
const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", verifyToken, getMe);
router.get("/users", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("name email role");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});
export default router;