import axios from "axios";

// Base URL for the API - using environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
    });
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const feedbackService = {
  // Get all system feedback
  async getSystemFeedback(filters = {}) {
    try {
      const params = new URLSearchParams();

      // Add pagination and sorting
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.order) params.append("order", filters.order);

      const response = await api.get(`/feedback?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch feedback",
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Get feedback by user ID
  async getFeedbackByUser(userId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(
        `/feedback/user/${userId}?${params.toString()}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch user feedback",
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Create new system feedback
  async createSystemFeedback(feedbackData) {
    try {
      const response = await api.post("/feedback", feedbackData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create feedback",
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Get feedback statistics
  async getFeedbackStats() {
    try {
      const response = await api.get("/feedback/stats");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch feedback stats",
        error: error.response?.data?.error || error.message,
      };
    }
  },
};
