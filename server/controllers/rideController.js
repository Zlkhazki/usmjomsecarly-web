import supabase from "../config/supabase.js";

/**
 * Helper function to format ride data for frontend
 */
const formatRideForFrontend = (ride) => {
  // Map database status to frontend status
  const statusMap = {
    open: "Scheduled",
    in_progress: "Active",
    ended: "Completed",
    cancelled: "Cancelled",
  };

  const frontendStatus = statusMap[ride.status] || ride.status;

  // Format driver information
  const driver = ride.users
    ? {
        id: ride.users.id,
        name: ride.users.name || "Unknown Driver",
        phone: ride.users.phone_number || "",
        email: ride.users.email || "",
        avatar: ride.users.profile_picture || null,
        rating: ride.users.rating || 4.5,
        ratingCount: ride.users.total_rides || 0,
        vehicle: {
          make: ride.users.car_model
            ? ride.users.car_model.split(" ")[0]
            : "Unknown",
          model: ride.users.car_model
            ? ride.users.car_model.split(" ").slice(1).join(" ")
            : "Model",
          color: "Silver", // Default since not in schema
          plateNumber: ride.users.plate_number || "N/A",
        },
      }
    : null;

  // Format passengers from bookings
  const passengers = ride.bookings
    ? ride.bookings
        .filter((booking) => booking.status !== "cancelled")
        .map((booking) => ({
          id: booking.user_id,
          name: booking.users?.name || "Unknown Passenger",
          phone: booking.users?.phone_number || "",
          email: booking.users?.email || "",
          avatar: booking.users?.profile_picture || null,
          fare: booking.fare || 0,
          paymentStatus: booking.status === "confirmed" ? "Paid" : "Pending",
          paymentMethod: "DuitNow", // Default since not in schema
          seatNumber: booking.seat_number,
          bookingTime: booking.booking_time,
        }))
    : [];

  // Calculate individual fare
  const totalPassengers = passengers.length;
  const individualFare =
    totalPassengers > 0
      ? parseFloat((ride.total_fare / totalPassengers).toFixed(2))
      : 0;

  // Update passengers with calculated fare
  passengers.forEach((passenger) => {
    passenger.fare = individualFare;
  });

  // Combine date and time for frontend
  const rideDateTime = new Date(`${ride.date}T${ride.time}`);

  return {
    id: ride.id,
    date: rideDateTime,
    status: frontendStatus,
    pickup: ride.pickup_address,
    destination: ride.drop_address,
    distance: parseFloat(ride.distance || 0).toFixed(1),
    duration: Math.round(ride.duration || 0),
    baseFare: parseFloat(ride.base_fare || 0),
    distanceCharge: parseFloat(ride.distance_fare || 0),
    durationCharge: parseFloat(ride.duration_fare || 0),
    serviceFee: 1.0, // Default service fee since not in schema
    totalFare: parseFloat(ride.total_fare || ride.price || 0),
    driver: driver,
    passengers: passengers,
    seats: ride.seats,
    preferences: ride.preferences || [],
    surge: ride.is_surge || false,
    surgeMultiplier: parseFloat(ride.surge_multiplier || 1.0),
    createdAt: ride.created_at,
    updatedAt: ride.updated_at,
  };
};

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
        users!rides_driver_id_fkey (
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
          users!bookings_user_id_fkey1 (
            id,
            name,
            email,
            phone_number,
            profile_picture
          )
        )
        `,
      { count: "exact" }
    );

    // Apply filters if provided
    if (status) {
      // Map frontend status to database status
      const statusMap = {
        Active: "in_progress",
        Completed: "ended",
        Scheduled: "open",
        Cancelled: "cancelled",
      };
      const dbStatus = statusMap[status] || status.toLowerCase();
      query = query.eq("status", dbStatus);
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
        rides: rides.map(formatRideForFrontend),
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

    // Format the response
    return res.status(200).json({
      success: true,
      message: "Ride fetched successfully",
      data: formatRideForFrontend(ride),
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

/**
 * Get rides by driver ID
 * @route GET /api/rides/driver/:driverId
 */
export const getRidesByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = "date",
      order = "desc",
    } = req.query;

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    // Build query for driver-specific rides
    let query = supabase
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
        users!rides_driver_id_fkey (
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
          users!bookings_user_id_fkey1 (
            id,
            name,
            email,
            phone_number,
            profile_picture
          )
        )
        `,
        { count: "exact" }
      )
      .eq("driver_id", driverId);

    // Apply additional filters
    if (status) {
      const statusMap = {
        Active: "started",
        Completed: "ended",
        Scheduled: "open",
        Cancelled: "cancelled",
      };
      const dbStatus = statusMap[status] || status.toLowerCase();
      query = query.eq("status", dbStatus);
    }

    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    }

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: order === "asc" });
    query = query.range(startIndex, startIndex + limitNum - 1);

    const { data: rides, error, count } = await query;

    if (error) {
      console.error("Error fetching driver rides:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch driver rides",
        error: error.message,
      });
    }

    // Format rides for frontend
    const formattedRides = rides.map(formatRideForFrontend);

    return res.status(200).json({
      success: true,
      message: "Driver rides fetched successfully",
      data: {
        rides: formattedRides,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Server error in getRidesByDriver:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get bookings for a specific ride
 * @route GET /api/rides/:id/bookings
 */
export const getRideBookings = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch bookings for the ride
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        ride_id,
        user_id,
        seat_number,
        status,
        booking_time,
        users!bookings_user_id_fkey1 (
          id,
          name,
          email,
          phone_number,
          profile_picture
        )
        `
      )
      .eq("ride_id", id)
      .order("seat_number", { ascending: true });

    if (error) {
      console.error("Error fetching ride bookings:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ride bookings",
        error: error.message,
      });
    }

    // Also get the ride details to calculate individual fares
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("total_fare, price")
      .eq("id", id)
      .single();

    if (rideError) {
      console.error("Error fetching ride for fare calculation:", rideError);
    }

    // Format bookings with individual fare calculation
    const totalFare = ride?.total_fare || ride?.price || 0;
    const activeBookings = bookings.filter(
      (booking) => booking.status !== "cancelled"
    );
    const farePerPassenger =
      activeBookings.length > 0
        ? parseFloat((totalFare / activeBookings.length).toFixed(2))
        : 0;

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      rideId: booking.ride_id,
      userId: booking.user_id,
      seatNumber: booking.seat_number,
      status: booking.status,
      bookingTime: booking.booking_time,
      passenger: {
        id: booking.users?.id,
        name: booking.users?.name || "Unknown Passenger",
        email: booking.users?.email || "",
        phone: booking.users?.phone_number || "",
        avatar: booking.users?.profile_picture || null,
      },
      fare: booking.status !== "cancelled" ? farePerPassenger : 0,
      paymentMethod: "DuitNow", // Default since not in schema
    }));

    return res.status(200).json({
      success: true,
      message: "Ride bookings fetched successfully",
      data: {
        bookings: formattedBookings,
        summary: {
          totalBookings: bookings.length,
          activeBookings: activeBookings.length,
          cancelledBookings: bookings.length - activeBookings.length,
          totalFare: totalFare,
          farePerPassenger: farePerPassenger,
        },
      },
    });
  } catch (error) {
    console.error("Server error in getRideBookings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
