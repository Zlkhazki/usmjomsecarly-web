import supabase from "../config/supabase.js";

// Get all system feedback
const getSystemFeedback = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "created_at",
      order = "desc",
    } = req.query;
    const offset = (page - 1) * limit;

    // Query system feedback with user information
    const {
      data: feedback,
      error,
      count,
    } = await supabase
      .from("feedbacks")
      .select(
        `
        id,
        rating,
        feedback,
        created_at,
        user:user_id (
          id,
          name,
          email,
          phone_number
        )
      `,
        { count: "exact" }
      )
      .order(sortBy, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching system feedback:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch system feedback",
        error: error.message,
      });
    }

    // Format the data for frontend
    const formattedFeedback = feedback.map((item) => ({
      id: item.id,
      rating: item.rating,
      comment: item.feedback,
      createdAt: item.created_at,
      submittedBy: item.user?.name || "Unknown User",
      submittedByEmail: item.user?.email,
      submittedByPhone: item.user?.phone_number,
      userId: item.user?.id,
      type: "SYSTEM",
    }));

    res.json({
      success: true,
      data: {
        feedback: formattedFeedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getSystemFeedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get feedback by user ID
const getFeedbackByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const {
      data: feedback,
      error,
      count,
    } = await supabase
      .from("feedbacks")
      .select(
        `
        id,
        rating,
        feedback,
        created_at
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user feedback",
        error: error.message,
      });
    }

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in getFeedbackByUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create new system feedback
const createSystemFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const userId = req.user?.id; // Assuming user ID comes from auth middleware

    // Validate required fields
    if (!rating || !feedback) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rating, feedback",
      });
    }

    // Validate rating range
    if (rating < 1.0 || rating > 5.0) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1.0 and 5.0",
      });
    }

    // Validate feedback length
    if (feedback.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Feedback must be at least 10 characters long",
      });
    }

    const { data: newFeedback, error } = await supabase
      .from("feedbacks")
      .insert({
        user_id: userId,
        rating: rating,
        feedback: feedback.trim(),
      })
      .select(
        `
        id,
        rating,
        feedback,
        created_at,
        user:user_id (
          name,
          email
        )
      `
      )
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create feedback",
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      data: newFeedback,
      message: "Feedback created successfully",
    });
  } catch (error) {
    console.error("Error in createSystemFeedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
  try {
    // Get total feedback count
    const { count: totalFeedback } = await supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true });

    // Get average rating
    const { data: avgRating } = await supabase
      .from("feedbacks")
      .select("rating");

    const averageRating =
      avgRating && avgRating.length > 0
        ? avgRating.reduce((sum, item) => sum + item.rating, 0) /
          avgRating.length
        : 0;

    // Get rating distribution
    const { data: ratingDistribution } = await supabase
      .from("feedbacks")
      .select("rating");

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    if (ratingDistribution) {
      ratingDistribution.forEach((item) => {
        const rating = Math.floor(item.rating);
        if (distribution[rating] !== undefined) {
          distribution[rating]++;
        }
      });
    }

    res.json({
      success: true,
      data: {
        totalFeedback: totalFeedback || 0,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingDistribution: distribution,
      },
    });
  } catch (error) {
    console.error("Error in getFeedbackStats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  getSystemFeedback,
  getFeedbackByUser,
  createSystemFeedback,
  getFeedbackStats,
};
