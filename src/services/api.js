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
      `/api/transactions/contributions/${address}`
    );
    return response.data;
  },

  // Get user vesting information
  getVestingInfo: async (address) => {
    const response = await apiClient.get(
      `/api/user/vesting-info?address=${address}`
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
    const response = await apiClient.get(
      `/api/users/walletAddress?walletAddress=${walletAddress}`
    );
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
  // Admin login
  login: async (password) => {
    const response = await apiClient.post("/api/auth/admin/login", {
      password,
    });
    return response.data;
  },

  // Get all contributions (with filtering)
  getContributions: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await apiClient.get(
      `/api/transactions/contributions/pending?${params}`,
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
  getContractDetails: async (filters = {}) => {
    const response = await apiClient.get(`/api/contract/details`, {
      headers: authHeader(),
    });
    return response.data;
  },
};

// Authentication helper functions
export const authService = {
  isAuthenticated: () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;

    try {
      // Simple check - in a real app, verify expiration
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp > Date.now() / 1000;
    } catch (e) {
      return false;
    }
  },

  login: async (password) => {
    const { token } = await adminApi.login(password);
    localStorage.setItem("adminToken", token);
    return token;
  },

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
