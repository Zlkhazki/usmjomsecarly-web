import supabase from "../config/supabase.js";
import jwt from "jsonwebtoken"; // Import jwt

/**
 * Get a paginated list of all users with optional filters
 * @route GET /admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      name,
      email,
      sortBy = "created_at",
      order = "desc",
    } = req.query;

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    // Start building the query
    let query = supabase
      .from("users")
      .select(
        "id, created_at, name, email, phone_number, profile_picture, rating, car_model, plate_number, role, role_status, total_rides",
        { count: "exact" }
      );

    // Apply filters if provided
    if (role) {
      query = query.eq("role", role);
    }

    if (name) {
      query = query.ilike("name", `%${name}%`);
    }

    if (email) {
      query = query.eq("email", email);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(startIndex, startIndex + limitNum - 1);

    // Execute the query
    const { data: users, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve users",
        error: error.message,
      });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

/**
 * Get a specific user by ID
 * @route GET /admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Handle different types of errors
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

/**
 * Update a user's details
 * @route PATCH /admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists before updating
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update user",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

/**
 * Soft-delete a user by setting role_status to 'inactive'
 * @route DELETE /admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists before deleting
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, role_status")
      .eq("id", id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If already inactive, no need to update
    if (existingUser.role_status === "inactive") {
      return res.status(200).json({
        success: true,
        message: "User is already inactive",
        data: existingUser,
      });
    }

    // Soft delete by setting role_status to 'inactive'
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ role_status: "inactive" })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Delete error:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to delete user",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User successfully deactivated",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

/**
 * Admin login
 * @route POST /api/admin/login
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log received credentials
    console.log("Received email in request:", email);
    console.log(
      "Password received (first few chars):",
      password ? password.substring(0, 3) + "..." : "undefined/empty"
    );

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData || !authData.user) {
      console.error("Authentication error:", authError?.message);
      return res.status(401).json({
        success: false,
        message: authError?.message || "Invalid email or password",
      });
    }

    const user = authData.user;
    console.log("Supabase Auth user email:", user.email); // Log the email returned by Supabase Auth

    // 2. Query the users table using the original email from req.body
    let userData, userError;
    let query = supabase
      .from("users")
      .select("id, role, email, role_status")
      .eq("email", email) // Try original email first
      .single();

    ({ data: userData, error: userError } = await query);

    // Fallback: Try normalized email if original email fails
    if (userError || !userData) {
      const normalizedEmail = email
        .toLowerCase()
        .replace(/\.(.+?)@gmail\.com$/, "$1@gmail.com");
      console.log(
        "Original email not found, trying normalized email:",
        normalizedEmail
      );

      query = supabase
        .from("users")
        .select("id, role, email, role_status")
        .eq("email", normalizedEmail)
        .single();

      ({ data: userData, error: userError } = await query);
    }

    if (userError || !userData) {
      console.error(
        "Error fetching user or user not found:",
        userError?.message
      );
      return res.status(404).json({
        success: false,
        message:
          "User not found in database. Please ensure your account is registered.",
      });
    }

    // 3. Check if user is active and has admin role
    if (userData.role_status === "inactive") {
      console.log(`User ${userData.email} is inactive`);
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    if (userData.role !== "admin") {
      console.log(
        `User ${userData.email} attempted admin login but has role: ${userData.role}`
      );
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // 4. Return successful login response
    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token: authData.session.access_token,
      user: {
        id: user.id,
        email: userData.email, // Return email as stored in users table
        role: userData.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login",
      error: error.message,
    });
  }
};
