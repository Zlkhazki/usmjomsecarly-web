import express from "express"; // Changed from require to import
import compression from "compression"; // Add compression middleware
import helmet from "helmet"; // Add security middleware
import adminRoutes from "./routes/adminRoutes.js"; // Import admin routes
import bookingRoutes from "./routes/bookingRoutes.js"; // Import booking routes
import rideRoutes from "./routes/rideRoutes.js"; // Import ride routes
import ratingsRoutes from "./routes/ratingsRoutes.js"; // Import ratings routes
import feedbackRoutes from "./routes/feedbackRoutes.js"; // Import feedback routes
import cors from "cors";

const app = express();
const PORT = 3000;

// Performance and security middleware
app.use(helmet()); // Security headers
app.use(compression()); // Enable gzip compression

// Request logging middleware for performance monitoring
app.use((req, res, next) => {
  req.startTime = performance.now();
  
  // Log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = performance.now() - req.startTime;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
    originalEnd.apply(this, args);
  };
  
  next();
});

// CORS configuration with performance optimizations
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    optionsSuccessStatus: 200, // For legacy browser support
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);

// Body parsing middleware with size limits for performance
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Enable URL encoded parsing

// Cache control middleware for static-like endpoints
app.use('/api/rides', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=60'); // Cache GET requests for 1 minute
  }
  next();
});

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
