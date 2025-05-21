import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminLogin, // Import the new login controller
} from "../controllers/adminUserController.js";
import { isAdmin } from "../middleware/auth.js";
import {
  validate,
  validateGetUsers,
  validateUserId,
  validateUpdateUser,
  validateLogin, // Import login validation
} from "../middleware/userValidation.js";

const router = express.Router();

/**
 * Admin User Management Routes
 * All routes are prefixed with /admin
 */

// POST /admin/login - Admin login
router.post("/login", validate(validateLogin), adminLogin);

// All routes below require admin authentication
// GET /admin/users - Get paginated list of all users with optional filters
router.get("/users", isAdmin, validate(validateGetUsers), getUsers);

// GET /admin/users/:id - Get specific user by ID
router.get("/users/:id", isAdmin, validate(validateUserId), getUserById);

// PATCH /admin/users/:id - Update a user's details
router.patch("/users/:id", isAdmin, validate(validateUpdateUser), updateUser);

// DELETE /admin/users/:id - Soft-delete a user by setting role_status to 'inactive'
router.delete("/users/:id", isAdmin, validate(validateUserId), deleteUser);

export default router;
