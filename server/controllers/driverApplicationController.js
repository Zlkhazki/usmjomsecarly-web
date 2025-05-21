import supabase from "../config/supabase.js";

/**
 * Get all driver applications with optional filtering
 * @route GET /admin/driver-applications
 */
export const getDriverApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "application_date",
      order = "desc",
    } = req.query;

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    // Start building the query
    let query = supabase
      .from("driver_applications")
      .select(
        "*, user:user_id(id, name, email, phone_number, profile_picture)",
        { count: "exact" }
      );

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Apply sorting and pagination
    const {
      data: applications,
      count,
      error,
    } = await query
      .order(sortBy, { ascending: order === "asc" })
      .range(startIndex, startIndex + limitNum - 1);

    if (error) {
      console.error("Error fetching driver applications:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching driver applications",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      applications,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching driver applications:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching driver applications",
      error: error.message,
    });
  }
};

/**
 * Get a specific driver application by ID
 * @route GET /admin/driver-applications/:id
 */
export const getDriverApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the application with user details
    const { data: application, error } = await supabase
      .from("driver_applications")
      .select("*, user:user_id(id, name, email, phone_number, profile_picture)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching driver application:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching driver application",
        error: error.message,
      });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Driver application not found",
      });
    }

    return res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error fetching driver application:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching driver application",
      error: error.message,
    });
  }
};

/**
 * Update driver application status (approve or reject)
 * @route PUT /admin/driver-applications/:id
 */
export const updateDriverApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    const reviewerId = req.user.id; // From auth middleware
    const currentDate = new Date().toISOString();

    // Validate the status
    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'",
      });
    }

    // Start a transaction
    const { data: application, error: applicationError } = await supabase
      .from("driver_applications")
      .update({
        status,
        review_date: currentDate,
        reviewer_id: reviewerId,
        review_notes: reviewNotes || null,
      })
      .eq("id", id)
      .select("*, user:user_id(id, name, email, phone_number, profile_picture)")
      .single();

    if (applicationError) {
      console.error("Error updating driver application:", applicationError);
      return res.status(500).json({
        success: false,
        message: "Error updating driver application",
        error: applicationError.message,
      });
    }

    // Update the user's role_status and role if approved
    const { error: userError } = await supabase
      .from("users")
      .update({
        role: status === "approved" ? "driver" : "user",
        role_status: status,
      })
      .eq("id", application.user_id);

    if (userError) {
      console.error("Error updating user role:", userError);
      return res.status(500).json({
        success: false,
        message: "Error updating user role",
        error: userError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? "Driver application approved successfully"
          : "Driver application rejected successfully",
      application,
    });
  } catch (error) {
    console.error("Error updating driver application status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating driver application status",
      error: error.message,
    });
  }
};
