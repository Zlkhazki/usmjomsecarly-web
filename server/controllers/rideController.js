import supabase from "../config/supabase.js";

/**
 * Get all rides with optional filtering and pagination
 * @route GET /api/rides
 */
export const getRides = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      driverId,
      date,
      startDate,
      endDate,
      pickup,
      destination,
      minSeats,
      sortBy = "date",
      order = "asc",
    } = req.query;

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    // Start building the query
    let query = supabase.from("rides").select(
      `
        id,
        driver_id,
        date,
        time,
        pickup_address,
        pickup_latitude,
        pickup_longitude,
        drop_address,
        drop_latitude,
        drop_longitude,
        base_fare,
        distance,
        duration,
        is_surge,
        distance_fare,
        duration_fare,
        surge_multiplier,
        total_fare,
        price,
        seats,
        created_at,
        updated_at,
        preferences,
        status,
        users (
          id,
          name,
          email,
          phone_number,
          profile_picture,
          car_model,
          plate_number,
          rating,
          total_rides
        ),
        bookings (
          id,
          user_id,
          seat_number,
          status
        )
        `,
      { count: "exact" }
    );

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }

    if (driverId) {
      query = query.eq("driver_id", driverId);
    }

    if (date) {
      query = query.eq("date", date);
    }

    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    }

    if (pickup) {
      query = query.ilike("pickup_address", `%${pickup}%`);
    }

    if (destination) {
      query = query.ilike("drop_address", `%${destination}%`);
    }

    if (minSeats) {
      query = query.gte("seats", minSeats);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(startIndex, startIndex + limitNum - 1);

    // Execute the query
    const { data: rides, error, count } = await query;

    if (error) {
      console.error("Error fetching rides:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch rides",
        error: error.message,
      });
    }

    // Format the response
    return res.status(200).json({
      success: true,
      message: "Rides fetched successfully",
      data: {
        rides,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Server error in getRides:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get ride by ID with driver details and bookings
 * @route GET /api/rides/:id
 */
export const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch ride with driver details and bookings
    const { data: ride, error } = await supabase
      .from("rides")
      .select(
        `
        id,
        driver_id,
        date,
        time,
        pickup_address,
        pickup_latitude,
        pickup_longitude,
        drop_address,
        drop_latitude,
        drop_longitude,
        base_fare,
        distance,
        duration,
        is_surge,
        distance_fare,
        duration_fare,
        surge_multiplier,
        total_fare,
        price,
        seats,
        created_at,
        updated_at,
        preferences,
        status,        
        users (
          id,
          name,
          email,
          phone_number,
          profile_picture,
          car_model,
          plate_number,
          rating,
          total_rides
        ),
        bookings (
          id,
          user_id,
          seat_number,
          status,
          booking_time,
          users (
            id,
            name,
            email,
            phone_number,
            profile_picture
          )
        )
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching ride:", error);
      return res.status(error.code === "PGRST116" ? 404 : 500).json({
        success: false,
        message:
          error.code === "PGRST116" ? "Ride not found" : "Failed to fetch ride",
        error: error.message,
      });
    }

    // Calculate the number of active (non-cancelled) bookings
    const activeBookings = ride.bookings.filter(
      (booking) => booking.status !== "cancelled"
    );
    const passengerCount = activeBookings.length;
    const totalFare = ride.total_fare || ride.price || 0;

    // Calculate distributed fare per passenger
    const farePerPassenger =
      passengerCount > 0
        ? parseFloat((totalFare / passengerCount).toFixed(2))
        : 0;

    // Add individual fare to each booking
    const bookingsWithFare = ride.bookings.map((booking) => ({
      ...booking,
      // Only assign fare to active bookings
      fare: booking.status !== "cancelled" ? farePerPassenger : 0,
    }));

    // Create a new ride object with the updated bookings
    const rideWithDistributedFares = {
      ...ride,
      bookings: bookingsWithFare,
      fare_per_passenger: farePerPassenger,
    };

    // Format the response
    return res.status(200).json({
      success: true,
      message: "Ride fetched successfully",
      data: rideWithDistributedFares,
    });
  } catch (error) {
    console.error("Server error in getRideById:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Create a new ride
 * @route POST /api/rides
 */
export const createRide = async (req, res) => {
  try {
    const {
      date,
      time,
      pickup_address,
      pickup_latitude,
      pickup_longitude,
      drop_address,
      drop_latitude,
      drop_longitude,
      base_fare,
      distance,
      duration,
      is_surge,
      distance_fare,
      duration_fare,
      surge_multiplier,
      total_fare,
      price,
      seats,
      preferences,
    } = req.body;

    // Get the authenticated user's ID (driver)
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authorization.split(" ")[1];

    // Get the current user (driver)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Create the ride
    const { data: ride, error } = await supabase
      .from("rides")
      .insert({
        driver_id: user.id,
        date,
        time,
        pickup_address,
        pickup_latitude,
        pickup_longitude,
        drop_address,
        drop_latitude,
        drop_longitude,
        base_fare,
        distance,
        duration,
        is_surge: is_surge || false,
        distance_fare,
        duration_fare,
        surge_multiplier: surge_multiplier || 1.0,
        total_fare,
        price,
        seats,
        preferences: preferences || [],
        status: "open",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ride:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create ride",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Ride created successfully",
      data: ride,
    });
  } catch (error) {
    console.error("Server error in createRide:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update ride status
 * @route PUT /api/rides/:id/status
 */
export const updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Get the authenticated user's ID (driver)
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authorization.split(" ")[1];

    // Get the current user (driver)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Check if the ride exists and belongs to this driver
    const { data: existingRide, error: fetchError } = await supabase
      .from("rides")
      .select("driver_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !existingRide) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (existingRide.driver_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this ride",
      });
    }

    // Update the ride status
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating ride status:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update ride status",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride status updated successfully",
      data: updatedRide,
    });
  } catch (error) {
    console.error("Server error in updateRideStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
