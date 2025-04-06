// src/services/priceService.js
import { priceApi } from "./api";

// Cache prices to avoid excessive API calls
const priceCache = {
  lastUpdated: 0,
  prices: {},
  TTL: 5 * 60 * 1000, // 5 minutes cache time
};

/**
 * Fetch the current prices
 * @returns {Promise<Object>} - Object with token prices in USD
 */
export const fetchCurrentPrices = async () => {
  try {
    // Check cache first
    if (
      priceCache.lastUpdated > 0 &&
      Date.now() - priceCache.lastUpdated < priceCache.TTL &&
      Object.keys(priceCache.prices).length > 0
    ) {
      return { ...priceCache.prices };
    }

    const data = await priceApi.getCurrentPrices();

    // Update cache
    priceCache.prices = data.prices || data; // Handle both formats
    priceCache.lastUpdated = Date.now();

    return { ...priceCache.prices };
  } catch (error) {
    console.error("Error fetching prices:", error);

    // If cache exists, return that instead
    if (Object.keys(priceCache.prices).length > 0) {
      console.log("Using cached prices due to error");
      return { ...priceCache.prices };
    }

    // Fallback prices if API fails and no cache
    return {
      ETH: 3000,
      BNB: 300,
      XDC: 0.04,
      USDT: 1,
      USDC: 1,
      SOL: 100,
    };
  }
};

/**
 * Get a pre-purchase price quote to verify before transaction
 * @param {Object} params - Quote parameters
 * @param {string} params.symbol - Token symbol (e.g., 'XDC')
 * @param {string} params.amount - Amount of tokens to purchase with
 * @param {number} params.xdcaiPrice - Current XDCAI token price in USD
 * @returns {Promise<Object>} - Price quote information
 */
export const getPrepurchaseQuote = async (params) => {
  try {
    // Try to get quote from API first
    try {
      const quoteData = await priceApi.getPrepurchaseQuote(params);
      return quoteData;
    } catch (apiError) {
      console.warn(
        "API quote failed, falling back to client-side calculation:",
        apiError
      );
    }

    // Client-side fallback calculation if API fails
    // Fetch latest prices
    const prices = await fetchCurrentPrices();

    // Get price for the token
    const tokenPrice = prices[params.symbol];
    if (!tokenPrice) {
      throw new Error(`Price not available for ${params.symbol}`);
    }

    // Convert token amount to USD
    const amountNumber = parseFloat(params.amount);
    if (isNaN(amountNumber)) {
      throw new Error("Invalid amount");
    }

    const usdValue = amountNumber * tokenPrice;

    // Calculate XDCAI tokens to receive
    const xdcaiAmount = usdValue / params.xdcaiPrice;

    // Calculate bonus based on USD value
    let bonusPercent = 0;
    if (usdValue > 5000) {
      bonusPercent = 10;
    } else if (usdValue > 2000) {
      bonusPercent = 4;
    } else if (usdValue >= 1000) {
      bonusPercent = 2;
    }

    const bonusTokens = (xdcaiAmount * bonusPercent) / 100;
    const totalTokens = xdcaiAmount + bonusTokens;

    return {
      inputToken: params.symbol,
      inputAmount: amountNumber,
      inputValueUSD: usdValue,
      xdcaiTokens: xdcaiAmount,
      bonusPercent,
      bonusTokens,
      totalTokens,
      quoteTimestamp: Date.now(),
      expiresIn: 300, // 5 minutes validity
    };
  } catch (error) {
    console.error("Error generating pre-purchase quote:", error);
    throw error;
  }
};

/**
 * Calculate bonus amount based on USD value
 * @param {number} amount - Token amount
 * @param {number} tokenPrice - Token price in USD
 * @returns {number} - Bonus amount
 */
export const calculateBonus = (amount, tokenPrice) => {
  if (!amount || !tokenPrice) return 0;

  // Calculate USD value
  const usdValue = parseFloat(amount) * tokenPrice;

  // Determine bonus percentage
  let bonusPercent;
  if (usdValue > 5000) bonusPercent = 10;
  else if (usdValue > 2000) bonusPercent = 4;
  else if (usdValue >= 1000) bonusPercent = 2;
  else bonusPercent = 0;

  // Calculate base XDCAI tokens
  const baseTokens = usdValue / global.tokenPriceInUsd;

  // Calculate bonus tokens
  return (baseTokens * bonusPercent) / 100;
};

export default {
  fetchCurrentPrices,
  getPrepurchaseQuote,
  calculateBonus,
};
