import { ethers } from "ethers";

/**
 * Format an address for display (e.g., 0x1234...abcd)
 * @param {string} address - The address to format
 * @returns {string} - Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return "";

  // Handle addresses that start with 'xdc'
  if (address.toLowerCase().startsWith("xdc")) {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  }

  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

/**
 * Format token amount for display with token symbol
 * @param {string|number|BigNumber} amount - Amount to format
 * @param {number} decimals - Token decimals
 * @param {string} symbol - Token symbol
 * @returns {string} - Formatted amount with symbol
 */
export const formatTokenAmount = (amount, decimals = 18, symbol = "") => {
  if (!amount) return `0${symbol ? " " + symbol : ""}`;

  try {
    let formattedAmount;

    // Handle ethers.BigNumber
    if (typeof amount === "object" && amount._isBigNumber) {
      formattedAmount = Number(ethers.utils.formatUnits(amount, decimals));
    } else {
      // Handle string or number
      const parsedAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;

      if (decimals === 0) {
        formattedAmount = parsedAmount;
      } else {
        // If amount is already in human readable form
        formattedAmount = parsedAmount;
      }
    }

    // Format based on size
    if (formattedAmount === 0) {
      return `0${symbol ? " " + symbol : ""}`;
    } else if (formattedAmount < 0.000001) {
      return `${formattedAmount.toExponential(4)}${symbol ? " " + symbol : ""}`;
    } else if (formattedAmount < 0.001) {
      return `${formattedAmount.toFixed(6)}${symbol ? " " + symbol : ""}`;
    } else if (formattedAmount < 1) {
      return `${formattedAmount.toFixed(4)}${symbol ? " " + symbol : ""}`;
    } else if (formattedAmount < 10000) {
      return `${formattedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}${symbol ? " " + symbol : ""}`;
    } else {
      return `${formattedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}${symbol ? " " + symbol : ""}`;
    }
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return `0${symbol ? " " + symbol : ""}`;
  }
};

/**
 * Format USD amount for display
 * @param {string|number} amount - USD amount to format
 * @returns {string} - Formatted USD amount
 */
export const formatUsdAmount = (amount) => {
  if (!amount) return "$0.00";

  try {
    const parsedAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    // Format based on size
    if (parsedAmount === 0) {
      return "$0.00";
    } else if (parsedAmount < 0.01) {
      return "$<0.01";
    } else if (parsedAmount < 1) {
      return `$${parsedAmount.toFixed(2)}`;
    } else if (parsedAmount < 10000) {
      return `$${parsedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else if (parsedAmount < 1000000) {
      return `$${(parsedAmount / 1000).toFixed(1)}K`;
    } else {
      return `$${(parsedAmount / 1000000).toFixed(2)}M`;
    }
  } catch (error) {
    console.error("Error formatting USD amount:", error);
    return "$0.00";
  }
};

/**
 * Format a timestamp into a human-readable date
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} - Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return "N/A";

  try {
    const timestampNumber =
      typeof timestamp === "string" ? parseInt(timestamp) : timestamp;

    const date = new Date(timestampNumber * 1000);
    return date.toLocaleString();
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "N/A";
  }
};

/**
 * Calculate time until next event
 * @param {number} targetTimestamp - Target timestamp in seconds
 * @returns {Object} - Object with days, hours, minutes, seconds
 */
export const calculateTimeRemaining = (targetTimestamp) => {
  if (!targetTimestamp) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const targetTime = parseInt(targetTimestamp);
    const timeLeft = Math.max(0, targetTime - now);

    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return { days, hours, minutes, seconds };
  } catch (error) {
    console.error("Error calculating time remaining:", error);
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
};
