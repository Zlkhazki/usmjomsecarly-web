import express from "express";
import {
  getRideRatings,
  getRideRatingsByDriver,
  createRideRating,
  suspendUser,
  unsuspendUser,
} from "../controllers/ratingsController.js";

// Middleware (you may need to adjust these based on your auth setup)
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Routes for ride ratings (driver reports)

// GET /api/ratings - Get all ride ratings with pagination and filtering
router.get("/", authenticateToken, getRideRatings);

// GET /api/ratings/driver/:driverId - Get ratings for a specific driver
router.get("/driver/:driverId", authenticateToken, getRideRatingsByDriver);

// POST /api/ratings - Create a new ride rating
router.post("/", authenticateToken, createRideRating);

// PUT /api/ratings/suspend/:userId - Suspend a user (admin only)
router.put("/suspend/:userId", authenticateToken, suspendUser);

// PUT /api/ratings/unsuspend/:userId - Unsuspend a user (admin only)
router.put("/unsuspend/:userId", authenticateToken, unsuspendUser);

export default router;
