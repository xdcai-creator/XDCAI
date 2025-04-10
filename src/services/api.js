// src/services/api.js
import axios from "axios";
import * as priceService from "./priceService";

// Create base API client with common config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3500",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Auth header helper for admin endpoints
const authHeader = () => {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Error handling middleware
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API Error:",
      error?.response?.data || error.message || error
    );
    return Promise.reject(error);
  }
);

// Transaction Intent API
export const transactionIntentApi = {
  // Register a new transaction intent
  register: async (data) => {
    const response = await apiClient.post(
      "/api/transaction-intents/register",
      data
    );
    return response.data;
  },

  // Get status of a transaction intent
  getStatus: async (intentId) => {
    const response = await apiClient.get(
      `/api/transaction-intents/status/${intentId}`
    );
    return response.data;
  },
};

// User Contributions API
export const contributionsApi = {
  // Get user contributions
  getUserContributions: async (address) => {
    const response = await apiClient.get(
      `/api/transactions/contributions?walletAddress=${address}`
    );
    return response.data;
  },

  // Update XDC claim address for a contribution
  updateClaimAddress: async (contributionId, newAddress) => {
    const response = await apiClient.post(
      "/api/transactions/contribution/update-address",
      {
        contributionId,
        newAddress,
      }
    );
    return response.data;
  },

  // Store user email with contribution information
  storeUserEmail: async (email, walletAddress, transactionData) => {
    const response = await apiClient.post("/api/users/email", {
      email,
      walletAddress,
      transactionData,
    });
    return response.data;
  },

  // Check if user has registered email
  checkUserEmail: async (walletAddress) => {
    const response = await apiClient.get(`/api/users/${walletAddress}`);
    return response.data;
  },
};

// Price Service API
export const priceApi = {
  // Get current market prices
  getCurrentPrices: async () => {
    const response = await priceService.fetchCurrentPrices();
    return response.data;
  },

  // Get pre-purchase quote
  getPrepurchaseQuote: async (params) => {
    const response = await priceService.getPrepurchaseQuote(params);
    return response;
  },
};

// Admin API
export const adminApi = {
  // Check admin status to determine if initial setup is required
  checkAdminStatus: async () => {
    const response = await apiClient.get("/api/auth/admin/status");
    return response.data;
  },

  // Admin login with support for initial setup
  login: async (password, newPassword = null) => {
    // Prepare request body based on whether it's initial setup or regular login
    const requestBody = newPassword
      ? { password, new_password: newPassword }
      : { password };

    const response = await apiClient.post("/api/auth/admin/login", requestBody);
    return response.data;
  },

  // Verify the admin token
  verifyToken: async () => {
    const response = await apiClient.get("/api/auth/admin/verify", {
      headers: authHeader(),
    });
    return response.data;
  },

  registerContribution: async (contributionId) => {
    const response = await apiClient.post(
      "/api/transactions/contribution/register-contract",
      { contributionId },
      { headers: authHeader() }
    );
    return response.data;
  },

  // Get all contributions with flexible filtering options
  getContributions: async (options = {}) => {
    // Build query parameters
    const params = new URLSearchParams();

    // Always add admin=true for admin dashboard
    params.append("admin", "true");

    if (options.walletAddress)
      params.append("walletAddress", options.walletAddress?.toLowerCase());

    // Add pagination
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.skip !== undefined)
      params.append("skip", options.skip.toString());

    // Add sorting
    if (options.sort) params.append("sort", options.sort);
    if (options.order) params.append("order", options.order);

    // Add filters if set
    if (options.status && options.status !== "all") {
      params.append("status", options.status);
    }

    if (options.chain && options.chain !== "all") {
      params.append("chain", options.chain);
    }

    if (options.search) {
      params.append("search", options.search);
    }

    // Add any other custom filters
    if (options.tokenType) params.append("tokenType", options.tokenType);
    if (options.startDate) params.append("startDate", options.startDate);
    if (options.endDate) params.append("endDate", options.endDate);

    const response = await apiClient.get(
      `/api/transactions/contributions?${params.toString()}`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  // Advance contribution status
  advanceContributionStatus: async (contributionId, targetStatus, notes) => {
    const response = await apiClient.post(
      "/api/transactions/contribution/advance",
      {
        contributionId,
        targetStatus,
        notes,
      },
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  // Retry failed contribution
  retryContribution: async (contributionId) => {
    const response = await apiClient.post(
      "/api/transactions/contribution/retry",
      {
        contributionId,
      },
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  // Bridge a contribution
  bridgeContribution: async (contributionId) => {
    const response = await apiClient.post(
      `/api/bridge/contributions/${contributionId}/bridge`,
      {},
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  // Claim tokens on behalf of user
  claimTokensForUser: async (userAddress) => {
    const response = await apiClient.post(
      "/api/admin/claim-tokens",
      {
        userAddress,
      },
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  // Reclaim unsold tokens (only for contract owner)
  reclaimUnsoldTokens: async () => {
    const response = await apiClient.post(
      "/api/admin/reclaim-unsold-tokens",
      {},
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },
};

// Contract API
export const contractApi = {
  getContractDetails: async () => {
    const response = await apiClient.get(`/api/contract/details`);
    return response.data;
  },
};

// Authentication helper functions
export const authService = {
  // Check if admin is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;

    try {
      // Decode token and check expiration
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp > Date.now() / 1000;
    } catch (e) {
      return false;
    }
  },

  // Check if admin setup is required
  checkSetupRequired: async () => {
    try {
      const { adminExists, setupRequired } = await adminApi.checkAdminStatus();
      return { adminExists, setupRequired };
    } catch (error) {
      console.error("Error checking admin status:", error);
      return { adminExists: false, setupRequired: true };
    }
  },

  // Login with support for initial setup
  login: async (password, newPassword = null) => {
    const response = await adminApi.login(password, newPassword);

    // Store the token if login was successful
    if (response.token) {
      localStorage.setItem("adminToken", response.token);
      return response.token;
    }

    // If initial setup is required but new password wasn't provided
    if (response.needsNewPassword) {
      throw new Error("New password required for initial admin setup");
    }

    throw new Error(response.error || "Login failed");
  },

  // Verify the admin token
  verifyToken: async () => {
    try {
      const response = await adminApi.verifyToken();
      return response.valid;
    } catch (error) {
      return false;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("adminToken");
  },
};

export default {
  transactionIntentApi,
  contributionsApi,
  priceApi,
  adminApi,
  authService,
  contractApi,
};
