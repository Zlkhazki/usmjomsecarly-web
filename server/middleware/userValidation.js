import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware that validates the request based on the provided validation chains
 * @param {Array} validations - Array of express-validator validation chains
 * @returns {Function} - Express middleware function
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    next();
  };
};

// Validate login data
export const validateLogin = [
  body("email").isEmail().withMessage("Invalid email format").trim(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Validate query parameters for GET /admin/users
export const validateGetUsers = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("role")
    .optional()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("Role must be one of: passenger, driver, admin"),

  query("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .trim(),

  query("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .trim(),

  query("sortBy")
    .optional()
    .isIn(["created_at", "total_rides"])
    .withMessage("Sort must be by created_at or total_rides"),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be asc or desc"),
];

// Validate user ID parameter
export const validateUserId = [
  param("id").isUUID().withMessage("User ID must be a valid UUID"),
];

// Validate user update data
export const validateUpdateUser = [
  param("id").isUUID().withMessage("User ID must be a valid UUID"),

  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email").optional().isEmail().withMessage("Invalid email format").trim(),

  body("phone_number")
    .optional()
    .isMobilePhone()
    .withMessage("Invalid phone number format"),

  body("role")
    .optional()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("Role must be one of: passenger, driver, admin"),

  body("role_status")
    .optional()
    .isIn(["approved", "inactive", "pending", "suspended"])
    .withMessage(
      "Role status must be one of: approved, inactive, pending, suspended"
    ),

  // Prevent updating fields that shouldn't be directly modified by admin
  body("id").not().exists().withMessage("Cannot update user ID"),
  body("created_at")
    .not()
    .exists()
    .withMessage("Cannot update created_at timestamp"),
  body("total_rides")
    .not()
    .exists()
    .withMessage("Cannot directly update total_rides"),
  body("rating")
    .not()
    .exists()
    .withMessage("Cannot directly update user rating"),
];

// ----- Driver Application Validations -----

// Validate driver application status update
export const validateUpdateDriverApplicationStatus = [
  param("id")
    .isUUID()
    .withMessage("Driver application ID must be a valid UUID"),
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Status must be either 'approved' or 'rejected'"),
  body("reviewNotes")
    .optional()
    .isString()
    .withMessage("Review notes must be a string")
    .isLength({ min: 0, max: 1000 })
    .withMessage("Review notes cannot exceed 1000 characters"),
];
