// src/services/transactionIntentService.js
import { transactionIntentApi } from "./api";

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
    const result = await transactionIntentApi.register(params);

    // Store intent ID in localStorage
    storeIntentId(result.intentId);

    return result;
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
    return await transactionIntentApi.getStatus(intentId);
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

/**
 * Verify if a transaction succeeded by checking the intent status
 * @param {string} intentId - The intent ID to verify
 * @param {number} maxAttempts - Maximum number of status checks
 * @param {number} interval - Interval between checks in ms
 * @returns {Promise<Object>} - Final intent status
 */
export const verifyTransactionSuccess = async (
  intentId,
  maxAttempts = 10,
  interval = 3000
) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getIntentStatus(intentId);

    // If the intent is verified or expired, we're done
    if (status.status === "VERIFIED" || status.status === "EXPIRED") {
      return status;
    }

    // Wait before trying again
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  // If we reach here, we've exceeded maximum attempts
  throw new Error("Transaction verification timed out");
};

export default {
  registerTransactionIntent,
  getIntentStatus,
  storeIntentId,
  getStoredIntentId,
  clearStoredIntentId,
  verifyTransactionSuccess,
};
