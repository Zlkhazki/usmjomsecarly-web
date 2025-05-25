import express from "express"; // Changed from require to import
import adminRoutes from "./routes/adminRoutes.js"; // Import admin routes
import bookingRoutes from "./routes/bookingRoutes.js"; // Import booking routes
import rideRoutes from "./routes/rideRoutes.js"; // Import ride routes
import ratingsRoutes from "./routes/ratingsRoutes.js"; // Import ratings routes
import feedbackRoutes from "./routes/feedbackRoutes.js"; // Import feedback routes

const app = express();
const PORT = 3000;
import cors from "cors";

app.use(express.json()); // Add middleware to parse JSON bodies
// app.use(express.urlencoded({ extended: true })); // Temporarily commented out
//cors
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
  })
);

app.get("/", (req, res) => {
  res.send("Hello, Geeks!");
});

// Mount the admin routes
app.use("/api/admin", adminRoutes); // Prefixed with /api for clarity

// Mount the booking and ride routes
app.use("/api/bookings", bookingRoutes);
app.use("/api/rides", rideRoutes);

// Mount the new ratings and feedback routes
app.use("/api/ratings", ratingsRoutes);
app.use("/api/feedback", feedbackRoutes);

app.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
