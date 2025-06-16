import axios from "axios";

// Base URL for the API - using environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance with optimized config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip, deflate, br", // Enable compression
  },
  timeout: 10000, // 10 second timeout
  // Enable request/response compression
  decompress: true,
});

// Request cache for GET requests
const requestCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for ride data

// Cache helper functions
const getCacheKey = (url, params) => {
  return `${url}?${new URLSearchParams(params).toString()}`;
};

const getCachedResponse = (key) => {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  requestCache.delete(key);
  return null;
};

const setCachedResponse = (key, data) => {
  requestCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Add request interceptor for authentication and caching
apiClient.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for performance monitoring
    config.metadata = { startTime: performance.now() };

    // Check cache for GET requests
    if (config.method === "get" && !config.skipCache) {
      const cacheKey = getCacheKey(config.url, config.params);
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log(`Cache hit for ${config.url}`);
        // Return cached response as a resolved promise
        return Promise.reject({
          isCache: true,
          data: cachedResponse,
          config,
        });
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and caching
apiClient.interceptors.response.use(
  (response) => {
    // Log performance metrics
    const endTime = performance.now();
    const duration = endTime - response.config.metadata.startTime;
    console.log(
      `API call to ${response.config.url} took ${duration.toFixed(2)}ms`
    );

    // Cache GET responses
    if (response.config.method === "get" && !response.config.skipCache) {
      const cacheKey = getCacheKey(response.config.url, response.config.params);
      setCachedResponse(cacheKey, response.data);
    }

    return response;
  },
  (error) => {
    // Handle cache hits
    if (error.isCache) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        config: error.config,
      });
    }

    console.error("API Error:", error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      // Redirect to login page if needed
    }
    return Promise.reject(error);
  }
);

/**
 * Ride Service API functions with performance optimizations
 */
export const rideService = {
  /**
   * Get filtered rides with server-side pagination and caching
   * @param {Object} filters - Filter parameters
   * @param {number} filters.page - Page number (1-based)
   * @param {number} filters.limit - Items per page
   * @param {string} filters.sortBy - Sort field
   * @param {string} filters.order - Sort order (asc/desc)
   * @param {string} filters.status - Ride status filter
   * @param {string} filters.search - Search term
   * @param {string} filters.startDate - Start date filter
   * @param {string} filters.endDate - End date filter
   * @returns {Promise} API response with rides data
   */
  async getFilteredRides(filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 25,
        sortBy: filters.sortBy || "created_at",
        order: filters.order || "desc",
        ...filters, // Include all other filters
      };

      // Remove undefined values to clean up URL
      Object.keys(params).forEach(key => 
        params[key] === undefined && delete params[key]
      );

      console.log(`Fetching rides with params:`, params);
      
      const response = await apiClient.get("/rides", { params });
      
      return {
        success: true,
        data: {
          rides: response.data.data?.rides || response.data.rides || [],
          total: response.data.data?.total || response.data.total || 0,
          page: response.data.data?.page || response.data.page || 1,
          totalPages: response.data.data?.totalPages || response.data.totalPages || 1,
        },
        message: response.data.message || "Rides fetched successfully",
      };
    } catch (error) {
      console.error("Error fetching filtered rides:", error);
      return {
        success: false,
        data: { rides: [], total: 0 },
        message: error.response?.data?.message || error.message || "Failed to fetch rides",
      };
    }
  },

  /**
   * Get ride by ID with caching
   * @param {string|number} rideId - Ride ID
   * @returns {Promise} API response with ride details
   */
  async getRideById(rideId) {
    try {
      console.log(`Fetching ride details for ID: ${rideId}`);
      
      const response = await apiClient.get(`/rides/${rideId}`);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || "Ride details fetched successfully",
      };
    } catch (error) {
      console.error(`Error fetching ride ${rideId}:`, error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || "Failed to fetch ride details",
      };
    }
  },
  /**
   * Get rides by driver ID
   * @param {string} driverId - Driver ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getRidesByDriver(driverId, params = {}) {
    try {
      console.log(`Fetching rides for driver ID: ${driverId}`);
      
      const response = await apiClient.get(`/rides/driver/${driverId}`, {
        params,
      });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || "Driver rides fetched successfully",
      };
    } catch (error) {
      console.error(`Error fetching rides for driver ${driverId}:`, error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || "Failed to fetch driver rides",
      };
    }
  },

  /**
   * Get bookings for a specific ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} API response
   */
  async getRideBookings(rideId) {
    try {
      console.log(`Fetching bookings for ride ID: ${rideId}`);
      
      const response = await apiClient.get(`/rides/${rideId}/bookings`);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || "Ride bookings fetched successfully",
      };
    } catch (error) {
      console.error(`Error fetching bookings for ride ${rideId}:`, error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || "Failed to fetch ride bookings",
      };
    }
  },

  /**
   * Create a new ride
   * @param {Object} rideData - Ride data
   * @returns {Promise} API response
   */
  async createRide(rideData) {
    try {
      console.log(`Creating new ride:`, rideData);
      
      const response = await apiClient.post("/rides", rideData);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || "Ride created successfully",
      };
    } catch (error) {
      console.error("Error creating ride:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || "Failed to create ride",
      };
    }
  },

  /**
   * Update ride status
   * @param {string} rideId - Ride ID
   * @param {string} status - New status
   * @returns {Promise} API response
   */
  async updateRideStatus(rideId, status) {
    try {
      console.log(`Updating ride ${rideId} status to: ${status}`);
      
      const response = await apiClient.put(`/rides/${rideId}/status`, {
        status,
      });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || "Ride status updated successfully",
      };
    } catch (error) {
      console.error(`Error updating ride ${rideId} status:`, error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || "Failed to update ride status",
      };
    }
  },
  /**
   * Cancel a ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} API response
   */
  async cancelRide(rideId) {
    try {
      console.log(`Cancelling ride ID: ${rideId}`);
        const response = await apiClient.put(`/rides/${rideId}/status`, {
        status: "closed", // Use correct enum value for cancelled
      });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || "Ride cancelled successfully",
      };
    } catch (error) {
      console.error(`Error cancelling ride ${rideId}:`, error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || "Failed to cancel ride",
      };
    }
  },

  /**
   * Handle API errors
   * @private
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        message: error.response.data?.message || "An error occurred",
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        message: "Network error - please check your connection",
        status: 0,
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: error.message || "An unexpected error occurred",
        status: 0,
      };
    }
  },
};

// Export the rideService as the default export
