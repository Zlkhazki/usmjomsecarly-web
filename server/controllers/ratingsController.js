import supabase from "../config/supabase.js";

// Get all ride ratings (driver reports)
const getRideRatings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      order = "desc",
    } = req.query;
    const offset = (page - 1) * limit;

    // Query ride ratings with user and target user information
    const {
      data: ratings,
      error,
      count,
    } = await supabase
      .from("ride_ratings")
      .select(
        `
        id,
        booking_id,
        ride_id,
        rating,
        comment,
        created_at,
        user:user_id (
          id,
          name,
          email,
          phone_number
        ),        target_user:target_user_id (
          id,
          name,
          email,
          phone_number,
          role,
          role_status
        ),        booking:booking_id (
          id
        ),
        ride:ride_id (
          id,
          date,
          pickup_address,
          drop_address
        )
      `,
        { count: "exact" }
      )
      .order(sortBy, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching ride ratings:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ride ratings",
        error: error.message,
      });
    }

    // Format the data for frontend
    const formattedRatings = ratings.map((rating) => ({
      id: rating.id,
      bookingId: rating.booking_id,
      rideId: rating.ride_id,
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.created_at,
      submittedBy: rating.user?.name || "Unknown User",
      submittedByEmail: rating.user?.email,
      submittedByPhone: rating.user?.phone_number,
      driverName: rating.target_user?.name || "Unknown Driver",
      driverEmail: rating.target_user?.email,
      driverPhone: rating.target_user?.phone_number,
      driverId: rating.target_user?.id,
      driverRole: rating.target_user?.role,
      driverRoleStatus: rating.target_user?.role_status,
      pickupLocation: rating.ride?.pickup_address,
      dropoffLocation: rating.ride?.drop_address,
      rideDate: rating.ride?.date,
    }));

    res.json({
      success: true,
      data: {
        ratings: formattedRatings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getRideRatings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get ride ratings by driver ID
const getRideRatingsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const {
      data: ratings,
      error,
      count,
    } = await supabase
      .from("ride_ratings")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        user:user_id (
          name,
          email
        )
      `,
        { count: "exact" }
      )
      .eq("target_user_id", driverId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch driver ratings",
        error: error.message,
      });
    }

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getRideRatingsByDriver:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create a new ride rating
const createRideRating = async (req, res) => {
  try {
    const { bookingId, rideId, targetUserId, rating, comment } = req.body;
    const userId = req.user?.id; // Assuming user ID comes from auth middleware

    // Validate required fields
    if (!bookingId || !rideId || !targetUserId || !rating) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: bookingId, rideId, targetUserId, rating",
      });
    }

    // Validate rating range
    if (rating < 1.0 || rating > 5.0) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1.0 and 5.0",
      });
    }

    const { data: newRating, error } = await supabase
      .from("ride_ratings")
      .insert({
        booking_id: bookingId,
        ride_id: rideId,
        user_id: userId,
        target_user_id: targetUserId,
        rating: rating,
        comment: comment,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return res.status(409).json({
          success: false,
          message:
            "Rating already exists for this booking and user combination",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create rating",
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data: newRating,
      message: "Rating created successfully",
    });
  } catch (error) {
    console.error("Error in createRideRating:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Suspend a user (set role to suspended)
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Update user role to suspended
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        role_status: "suspended",
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to suspend user",
        error: error.message,
      });
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optionally log the suspension action
    console.log(
      `User ${userId} suspended. Reason: ${reason || "No reason provided"}`
    );

    res.json({
      success: true,
      data: updatedUser,
      message: "User suspended successfully",
    });
  } catch (error) {
    console.error("Error in suspendUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Unsuspend a user (set role_status to approved)
const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Update user role_status to approved
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        role_status: "approved",
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to unsuspend user",
        error: error.message,
      });
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optionally log the unsuspension action
    console.log(
      `User ${userId} unsuspended. Reason: ${reason || "No reason provided"}`
    );

    res.json({
      success: true,
      data: updatedUser,
      message: "User unsuspended successfully",
    });
  } catch (error) {
    console.error("Error in unsuspendUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  getRideRatings,
  getRideRatingsByDriver,
  createRideRating,
  suspendUser,
  unsuspendUser,
};
