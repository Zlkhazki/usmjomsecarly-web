import axios from "axios";

// Base URL for the API
const API_BASE_URL = "https://jomsecarly-server-production.up.railway.app/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
 * Ride Service API functions
 */
export const rideService = {
  /**
   * Get all rides with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getRides(params = {}) {
    try {
      const response = await apiClient.get("/rides", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get ride by ID
   * @param {string} rideId - Ride ID
   * @returns {Promise} API response
   */
  async getRideById(rideId) {
    try {
      const response = await apiClient.get(`/rides/${rideId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
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
      const response = await apiClient.get(`/rides/driver/${driverId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Get bookings for a specific ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} API response
   */
  async getRideBookings(rideId) {
    try {
      const response = await apiClient.get(`/rides/${rideId}/bookings`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Create a new ride
   * @param {Object} rideData - Ride data
   * @returns {Promise} API response
   */
  async createRide(rideData) {
    try {
      const response = await apiClient.post("/rides", rideData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
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
      const response = await apiClient.put(`/rides/${rideId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  /**
   * Cancel a ride
   * @param {string} rideId - Ride ID
   * @returns {Promise} API response
   */
  async cancelRide(rideId) {
    return this.updateRideStatus(rideId, "cancelled");
  },

  /**
   * Get rides with filters for dashboard
   * @param {Object} filters - Filter options
   * @returns {Promise} API response
   */
  async getFilteredRides(filters = {}) {
    const params = {};

    // Map frontend filters to API parameters
    if (filters.status && filters.status !== "All") {
      params.status = filters.status;
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0].toISOString().split("T")[0];
      params.endDate = filters.dateRange[1].toISOString().split("T")[0];
    }

    if (filters.search) {
      // You can search in pickup or destination
      params.pickup = filters.search;
    }

    if (filters.driverId) {
      params.driverId = filters.driverId;
    }

    // Pagination
    if (filters.page) {
      params.page = filters.page;
    }

    if (filters.limit) {
      params.limit = filters.limit;
    }

    // Sorting
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
      params.order = filters.order || "desc";
    }

    return this.getRides(params);
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

export default rideService;
