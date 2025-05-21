import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminLogin, // Import the new login controller
  getStats, // Import the new getStats controller
  getAdminProfile, // Import the new getAdminProfile controller
} from "../controllers/adminUserController.js";
import {
  getDriverApplications,
  getDriverApplicationById,
  updateDriverApplicationStatus,
} from "../controllers/driverApplicationController.js";
import { isAdmin } from "../middleware/auth.js";
import {
  validate,
  validateGetUsers,
  validateUserId,
  validateUpdateUser,
  validateLogin, // Import login validation
  validateUpdateDriverApplicationStatus,
} from "../middleware/userValidation.js";

const router = express.Router();

/**
 * Admin User Management Routes
 * All routes are prefixed with /admin
 */

// POST /admin/login - Admin login
router.post("/login", validate(validateLogin), adminLogin);

// GET /admin/stats - Get dashboard statistics
router.get("/stats", isAdmin, getStats);

// GET /admin/profile - Get admin profile information
router.get("/profile", isAdmin, getAdminProfile);

// All routes below require admin authentication
// GET /admin/users - Get paginated list of all users with optional filters
router.get("/users", isAdmin, validate(validateGetUsers), getUsers);

// GET /admin/users/:id - Get specific user by ID
router.get("/users/:id", isAdmin, validate(validateUserId), getUserById);

// PATCH /admin/users/:id - Update a user's details
router.patch("/users/:id", isAdmin, validate(validateUpdateUser), updateUser);

// DELETE /admin/users/:id - Soft-delete a user by setting role_status to 'inactive'
router.delete("/users/:id", isAdmin, validate(validateUserId), deleteUser);

/**
 * Driver Application Management Routes
 */

// GET /admin/driver-applications - Get all driver applications
router.get("/driver-applications", isAdmin, getDriverApplications);

// GET /admin/driver-applications/:id - Get a specific driver application
router.get("/driver-applications/:id", isAdmin, getDriverApplicationById);

// PUT /admin/driver-applications/:id - Update driver application status (approve/reject)
router.put(
  "/driver-applications/:id",
  isAdmin,
  validate(validateUpdateDriverApplicationStatus),
  updateDriverApplicationStatus
);

export default router;
