import supabase from "../config/supabase.js";

/**
 * Middleware to check if a user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1]; // Verify the token and get user data
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log("Auth error:", error?.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    console.log("Auth user:", { id: user.id, email: user.email });

    // Fetch user details from the database using email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("email", user.email)
      .single();

    console.log("Database query result:", {
      userData,
      userError: userError?.message,
    });

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: "User not found in the database.",
      });
    }

    // Attach user data to request for use in route handlers
    req.user = userData;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed due to server error.",
    });
  }
};

/**
 * Middleware to check if a user is authenticated and has admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const isAdmin = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token and get user data
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    } // Fetch user details from the database to check role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        message: "User not found in the database.",
      });
    }

    // Check if user has admin role
    if (userData.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Attach user data to request for use in route handlers
    req.user = user;
    req.userRole = userData.role;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed due to server error.",
    });
  }
};
