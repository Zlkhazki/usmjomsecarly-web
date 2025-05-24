import express from "express";
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
  contactPassenger,
} from "../controllers/bookingController.js";
import { isAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * Booking Management Routes
 * All routes are prefixed with /api/bookings
 */

// GET /api/bookings - Get paginated list of all bookings with optional filters
router.get("/", getBookings);

// GET /api/bookings/:id - Get specific booking by ID
router.get("/:id", getBookingById);

// PUT /api/bookings/:id/status - Update a booking's status
router.put("/:id/status", updateBookingStatus);

// POST /api/bookings/:id/contact - Contact passenger via email
router.post("/:id/contact", contactPassenger);

export default router;
