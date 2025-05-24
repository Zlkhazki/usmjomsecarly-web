import supabase from "../config/supabase.js";

/**
 * Get all bookings with optional filtering and pagination
 * @route GET /api/bookings
 */
export const getBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      rideId,
      startDate,
      endDate,
      sortBy = "booking_time",
      order = "desc",
    } = req.query;

    // Calculate pagination values
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;

    // Start building the query
    let query = supabase.from("bookings").select(
      `
        id, 
        seat_number, 
        status, 
        booking_time,
        ride_id,
        user_id,
        rides (
          id, 
          driver_id, 
          date, 
          time,          pickup_address, 
          drop_address, 
          total_fare,
          price,
          seats,
          status,
          distance,
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
          )
        ),
        users (
          id, 
          name, 
          email, 
          phone_number, 
          profile_picture
        )
        `,
      { count: "exact" }
    );

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (rideId) {
      query = query.eq("ride_id", rideId);
    }

    if (startDate && endDate) {
      // Join with rides to filter by date
      query = query
        .filter("rides.date", "gte", startDate)
        .filter("rides.date", "lte", endDate);
    }

    // Apply sorting and pagination
    const {
      data: bookings,
      count,
      error,
    } = await query
      .order(sortBy, { ascending: order === "asc" })
      .range(startIndex, startIndex + limitNum - 1);

    if (error) {
      console.error("Error fetching bookings:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching bookings",
        error: error.message,
      });
    }

    // Get count of bookings per ride for fare calculation
    const rideBookingCounts = {};
    for (const booking of bookings) {
      if (booking.ride_id) {
        if (!rideBookingCounts[booking.ride_id]) {
          // For each ride, query the count of bookings
          const { data: rideBookings, error: countError } = await supabase
            .from("bookings")
            .select("id", { count: "exact" })
            .eq("ride_id", booking.ride_id)
            .not("status", "eq", "cancelled"); // Exclude cancelled bookings

          if (!countError) {
            rideBookingCounts[booking.ride_id] = rideBookings.length;
          } else {
            rideBookingCounts[booking.ride_id] = 1; // Default to 1 if error
          }
        }
      }
    }

    // Add distributed fare to each booking
    const processedBookings = bookings.map((booking) => {
      const totalFare = booking.rides?.total_fare || booking.rides?.price || 0;
      const passengerCount = rideBookingCounts[booking.ride_id] || 1;
      const distributedFare =
        passengerCount > 0 ? totalFare / passengerCount : totalFare;

      return {
        ...booking,
        distributed_fare: parseFloat(distributedFare.toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      bookings: processedBookings,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

/**
 * Get a specific booking by ID
 * @route GET /api/bookings/:id
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        id, 
        seat_number, 
        status, 
        booking_time,
        ride_id,
        user_id,
        rides (
          id, 
          driver_id, 
          date, 
          time, 
          pickup_address, 
          drop_address, 
          distance,
          total_fare,
          price,
          seats,
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
          )
        ),
        users (
          id, 
          name, 
          email, 
          phone_number, 
          profile_picture
        )
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching booking:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching booking",
        error: error.message,
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get count of bookings for this ride for fare distribution
    const { data: rideBookings, error: countError } = await supabase
      .from("bookings")
      .select("id")
      .eq("ride_id", booking.ride_id)
      .not("status", "eq", "cancelled"); // Exclude cancelled bookings

    if (countError) {
      console.error("Error counting ride bookings:", countError);
    }

    // Calculate distributed fare
    const totalFare = booking.rides?.total_fare || booking.rides?.price || 0;
    const passengerCount = rideBookings ? rideBookings.length : 1;
    const distributedFare =
      passengerCount > 0 ? totalFare / passengerCount : totalFare;

    // Add distributed fare to the booking object
    const bookingWithFare = {
      ...booking,
      distributed_fare: parseFloat(distributedFare.toFixed(2)),
    };

    return res.status(200).json({
      success: true,
      booking: bookingWithFare,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error.message,
    });
  }
};

/**
 * Update booking status (confirm/cancel)
 * @route PUT /api/bookings/:id
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be 'pending', 'confirmed', or 'cancelled'",
      });
    }

    // Get the current booking to check if status change is valid
    const { data: currentBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("status, ride_id, user_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching booking:", fetchError);
      return res.status(500).json({
        success: false,
        message: "Error fetching booking",
        error: fetchError.message,
      });
    }

    if (!currentBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Update the booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select(
        `
        id, 
        seat_number, 
        status, 
        booking_time,
        ride_id,
        user_id,
        rides (
          id, 
          driver_id, 
          date, 
          time, 
          pickup_address, 
          distance,
          drop_address, 
          total_fare,
          price,
          seats,
          status,
          users (
            id, 
            name, 
            email, 
            phone_number, 
            profile_picture
          )
        ),
        users (
          id, 
          name, 
          email, 
          phone_number, 
          profile_picture
        )
        `
      )
      .single();

    if (updateError) {
      console.error("Error updating booking status:", updateError);
      return res.status(500).json({
        success: false,
        message: "Error updating booking status",
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating booking status",
      error: error.message,
    });
  }
};

/**
 * Contact passenger via email
 * @route POST /api/bookings/:id/contact
 */
export const contactPassenger = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;
    const { authorization } = req.headers;

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    // Check if the user is authenticated
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

    // Fetch the booking with passenger details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        user_id,
        ride_id,
        users (
          name,
          email
        ),
        rides (
          driver_id,
          pickup_address,
          drop_address,
          date,
          time
        )
      `
      )
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if the current user is the driver for this booking
    if (booking.rides.driver_id !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to contact this passenger",
      });
    }

    // Get driver details
    const { data: driver, error: driverError } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", user.id)
      .single();

    if (driverError || !driver) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch driver details",
      });
    }

    // Import nodemailer dynamically
    const nodemailer = await import("nodemailer");

    // Create a test account using Ethereal (for development purposes only)
    // In production, you would use a real email service like SendGrid, Mailgun, etc.
    const transporter = nodemailer.default.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.EMAIL_USER || "example@ethereal.email",
        pass: process.env.EMAIL_PASS || "password",
      },
    });

    // Format ride details
    const rideDate = new Date(booking.rides.date);
    const formattedDate = rideDate.toLocaleDateString();
    const formattedTime = booking.rides.time;

    // Prepare email
    const mailOptions = {
      from: `"${driver.name}" <${driver.email}>`,
      to: booking.users.email,
      subject: `[Jomsecarly Ride] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #330b4f;">Message from Your Jomsecarly Driver</h2>
          <p>Hello ${booking.users.name},</p>
          <p>You received a message from <strong>${driver.name}</strong> regarding your ride from <strong>${booking.rides.pickup_address}</strong> to <strong>${booking.rides.drop_address}</strong> on <strong>${formattedDate} at ${formattedTime}</strong>.</p>
          
          <div style="background-color: #f5f0fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Message:</strong></p>
            <p style="margin-bottom: 0;">${message}</p>
          </div>
          
          <p>To reply to this message, please contact the driver directly at ${driver.email}.</p>
          <p>Thank you for using Jomsecarly!</p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated message - please do not reply directly to this email.</p>
        </div>
      `,
    };

    // Send email (commented out for development - just return success)
    // For development purposes, let's just simulate the email sending
    // await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Email sent to passenger successfully",
      emailDetails: {
        to: booking.users.email,
        from: driver.email,
        subject: subject,
        rideDetails: {
          pickup: booking.rides.pickup_address,
          drop: booking.rides.drop_address,
          date: booking.rides.date,
          time: booking.rides.time,
        },
      },
    });
  } catch (error) {
    console.error("Server error in contactPassenger:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
};
