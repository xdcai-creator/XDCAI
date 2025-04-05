// src/services/transactionIntentService.js
import { VITE_API_URL } from "../config";

/**
 * Register a transaction intent before payment
 * @param {Object} params - Intent parameters
 * @param {string} params.walletAddress - User's wallet address
 * @param {string} params.expectedAmount - Expected payment amount
 * @param {string} params.paymentCurrency - Payment currency (ETH, BNB, etc.)
 * @param {string} params.expectedChain - Expected blockchain (ethereum, bsc, etc.)
 * @returns {Promise<Object>} - Intent registration result
 */
export const registerTransactionIntent = async (params) => {
  try {
    const response = await fetch(
      `${VITE_API_URL}/api/transaction-intents/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to register transaction intent"
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error registering transaction intent:", error);
    throw error;
  }
};

/**
 * Get the status of a transaction intent
 * @param {string} intentId - The intent ID to check
 * @returns {Promise<Object>} - Intent status
 */
export const getIntentStatus = async (intentId) => {
  try {
    const response = await fetch(
      `${VITE_API_URL}/api/transaction-intents/status/${intentId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get intent status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting intent status:", error);
    throw error;
  }
};

/**
 * Store intent ID in localStorage for the current session
 * @param {string} intentId - The intent ID to store
 */
export const storeIntentId = (intentId) => {
  localStorage.setItem("xdcai_payment_intent", intentId);
};

/**
 * Get the stored intent ID from localStorage
 * @returns {string|null} - The stored intent ID or null
 */
export const getStoredIntentId = () => {
  return localStorage.getItem("xdcai_payment_intent");
};

/**
 * Clear the stored intent ID from localStorage
 */
export const clearStoredIntentId = () => {
  localStorage.removeItem("xdcai_payment_intent");
};
