//src/utils/tokenUtils.js
import { ethers } from "ethers";

/**
 * Format token price for display
 * @param {string|BigNumber} priceUSD - Price in USD scaled by 10^18
 * @returns {string} - Formatted price string
 */
export const formatTokenPrice = (priceUSD) => {
  if (!priceUSD) return "$0.0000";

  try {
    // Convert to ethers BigNumber for proper handling - v5 style
    const price = ethers.BigNumber.from(priceUSD);

    // Divide by 10^18 to get the actual price
    const priceInUSD = parseFloat(ethers.utils.formatUnits(price, 18));

    // Format with appropriate decimal places
    return `$${priceInUSD.toFixed(7)}`;
  } catch (error) {
    console.error("Error formatting token price:", error);
    return "$0.0000";
  }
};

/**
 * Format token amount for display
 * @param {string|BigNumber} amount - Token amount scaled by token decimals
 * @param {number} decimals - Token decimals
 * @returns {string} - Formatted amount string
 */
export const formatTokenAmount = (amount, decimals = 18) => {
  if (!amount) return "0";

  try {
    const amountBN = ethers.BigNumber.from(amount);
    const formattedAmount = parseFloat(
      ethers.utils.formatUnits(amountBN, decimals)
    );

    // If it's a whole number, don't show decimals
    if (formattedAmount % 1 === 0) {
      return formattedAmount.toString();
    }

    // For large numbers, limit decimals
    if (formattedAmount > 1000) {
      return formattedAmount.toFixed(2);
    }

    // For smaller numbers, show more decimals
    return formattedAmount.toFixed(6);
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
};

/**
 * Calculate time until next price update
 * @param {number} lastUpdateTime - Last price update timestamp in seconds
 * @param {number} updateInterval - Update interval in seconds
 * @returns {Object} - Time remaining object with days, hours, minutes, seconds
 */
export const calculateTimeUntilNextUpdate = (
  lastUpdateTime,
  updateInterval
) => {
  if (!lastUpdateTime || !updateInterval) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const lastUpdateTimeNumber =
      ethers.BigNumber.from(lastUpdateTime).toNumber();
    const updateIntervalNumber =
      ethers.BigNumber.from(updateInterval).toNumber();

    const nextUpdateTime = lastUpdateTimeNumber + updateIntervalNumber;
    const timeLeft = Math.max(0, nextUpdateTime - now);

    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return { days, hours, minutes, seconds };
  } catch (error) {
    console.error("Error calculating time until next update:", error);
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
};

/**
 * Calculate time until next vesting release
 * @param {number} nextUnlockTime - Next unlock timestamp in seconds
 * @returns {Object} - Time remaining object with days, hours, minutes, seconds
 */
export const calculateTimeUntilNextVesting = (nextUnlockTime) => {
  if (!nextUnlockTime) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const nextUnlockTimeNumber =
      ethers.BigNumber.from(nextUnlockTime).toNumber();
    const timeLeft = Math.max(0, nextUnlockTimeNumber - now);

    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return { days, hours, minutes, seconds };
  } catch (error) {
    console.error("Error calculating time until next vesting:", error);
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
};

/**
 * Format timestamp to human-readable date
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} - Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return "N/A";

  try {
    const timestampNumber = ethers.BigNumber.from(timestamp).toNumber();
    const date = new Date(timestampNumber * 1000);
    return date.toLocaleString();
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "N/A";
  }
};
