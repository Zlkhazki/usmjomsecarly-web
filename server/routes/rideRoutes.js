import express from "express";
import {
  getRides,
  getRideById,
  createRide,
  updateRideStatus,
  getRidesByDriver,
  getRideBookings,
} from "../controllers/rideController.js";
import { isAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * Ride Management Routes
 * All routes are prefixed with /api/rides
 */

// GET /api/rides - Get paginated list of all rides with optional filters
router.get("/", getRides);

// GET /api/rides/driver/:driverId - Get rides by specific driver (must come before /:id)
router.get("/driver/:driverId", getRidesByDriver);

// GET /api/rides/:id - Get specific ride by ID
router.get("/:id", getRideById);

// GET /api/rides/:id/bookings - Get bookings for a specific ride
router.get("/:id/bookings", getRideBookings);

// POST /api/rides - Create a new ride
router.post("/", createRide);

// PUT /api/rides/:id/status - Update a ride's status
router.put("/:id/status", updateRideStatus);

export default router;
