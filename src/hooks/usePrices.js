import { useState, useEffect, useCallback } from "react";
import {
  fetchCurrentPrices,
  getPrepurchaseQuote,
} from "../services/pricing/priceService";
import { contractApi } from "../services/api";

/**
 * Custom hook for fetching and managing token prices
 */
export const usePrices = () => {
  const [marketPrices, setMarketPrices] = useState({});
  const [tokenPrice, setTokenPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Load current market prices from the API
   */
  const loadPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch market prices for crypto currencies
      const prices = await fetchCurrentPrices();
      setMarketPrices(prices);

      // Fetch XDCAI token price from contract API
      try {
        const response = await contractApi.getContractDetails();
        if (response?.data?.tokenPriceUSD) {
          setTokenPrice(response.data.tokenPriceUSD);
        } else {
          // Fallback token price if API fails
          setTokenPrice(0.002);
        }
      } catch (err) {
        console.error("Error fetching token price:", err);
        // Fallback price
        setTokenPrice(0.002);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading prices:", err);
      setError(err.message || "Failed to load price data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial price loading
  useEffect(() => {
    loadPrices();

    // Set up price refresh interval (every 5 minutes)
    const refreshInterval = setInterval(loadPrices, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [loadPrices]);

  /**
   * Generate a purchase quote
   * @param {Object} params Quote parameters
   * @returns {Promise<Object>} Quote information
   */
  const generateQuote = useCallback(
    async (params) => {
      if (
        !params.amount ||
        isNaN(parseFloat(params.amount)) ||
        parseFloat(params.amount) <= 0
      ) {
        return null;
      }

      try {
        const quoteParams = {
          symbol: params.symbol,
          amount: params.amount,
          xdcaiPrice: tokenPrice || 0.002,
        };

        return await getPrepurchaseQuote(quoteParams);
      } catch (err) {
        console.error("Error generating quote:", err);
        setError(err.message || "Failed to generate purchase quote");
        return null;
      }
    },
    [tokenPrice]
  );

  /**
   * Calculate bonus amount based on purchase value
   * @param {string} amount Amount of currency
   * @param {string} currency Currency symbol
   * @returns {number} Bonus token amount
   */
  const calculateBonus = useCallback(
    (amount, currency) => {
      if (!amount || !marketPrices[currency] || !tokenPrice) return 0;

      // Calculate USD value
      const usdValue = parseFloat(amount) * marketPrices[currency];

      // Determine bonus percentage
      let bonusPercent;
      if (usdValue > 5000) {
        bonusPercent = 10; // 10% for >$5000
      } else if (usdValue > 2000) {
        bonusPercent = 4; // 4% for >$2000 and ≤$5000
      } else if (usdValue >= 1000) {
        bonusPercent = 2; // 2% for ≥$1000 and ≤$2000
      } else {
        bonusPercent = 0; // 0% for <$1000
      }

      // Calculate base XDCAI tokens (without bonus)
      const baseTokens = usdValue / tokenPrice;

      // Calculate bonus tokens
      return (baseTokens * bonusPercent) / 100;
    },
    [marketPrices, tokenPrice]
  );

  return {
    marketPrices,
    tokenPrice,
    isLoading,
    error,
    lastUpdated,
    loadPrices,
    generateQuote,
    calculateBonus,
  };
};

export default usePrices;
