import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  unlockAccount,
  getUserProfile,
} from "../controllers/authController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register new user
router.post("/signup", registerUser);

// Login (JWT + lockout)
router.post("/login", loginUser);

// Forgot password (primary or backup email)
router.post("/forgot-password", forgotPassword);

// Reset password (with token)
router.post("/reset-password", resetPassword);

// Manually unlock account
router.post("/unlock-account", unlockAccount);

// Get logged-in user's profile
router.get("/profile", verifyToken, getUserProfile);

export default router;