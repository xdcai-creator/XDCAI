import { ethers } from "ethers";

/**
 * Format token price for display
 * @param {string|BigInt} priceUSD - Price in USD scaled by 10^18
 * @returns {string} - Formatted price string
 */
export const formatTokenPrice = (priceUSD) => {
  if (!priceUSD) return "$0.0000";

  // Convert to ethers BigNumber for proper handling
  const price = ethers.toBigInt(priceUSD);

  // Divide by 10^18 to get the actual price
  const priceInUSD = Number(ethers.formatUnits(price, 18));

  // Format with appropriate decimal places
  return `$${priceInUSD.toFixed(7)}`;
};

/**
 * Format token amount for display
 * @param {string|BigInt} amount - Token amount scaled by token decimals
 * @param {number} decimals - Token decimals
 * @returns {string} - Formatted amount string
 */
export const formatTokenAmount = (amount, decimals = 18) => {
  if (!amount) return "0";

  const amountBN = ethers.toBigInt(amount);
  const formattedAmount = Number(ethers.formatUnits(amountBN, decimals));

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

  const now = Math.floor(Date.now() / 1000);
  const nextUpdateTime = Number(lastUpdateTime) + Number(updateInterval);
  const timeLeft = Math.max(0, nextUpdateTime - now);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return { days, hours, minutes, seconds };
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

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = Math.max(0, Number(nextUnlockTime) - now);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return { days, hours, minutes, seconds };
};

/**
 * Format timestamp to human-readable date
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} - Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return "N/A";

  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
};
