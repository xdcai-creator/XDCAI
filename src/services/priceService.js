import { ethers } from "ethers";
import { getCurrentChainId } from "../utils/chainUtils";
import { CONTRACT_ADDRESSES } from "../contracts/contractAddresses";

// Cache for storing prices to avoid excessive API calls
const priceCache = {
  lastUpdated: 0,
  prices: {},
  TTL: 5 * 60 * 1000, // 5 minutes cache time
};

// List of supported tokens with their IDs for coingecko
const SUPPORTED_TOKENS = {
  // Native tokens
  ETH: {
    id: "ethereum",
    isNative: true,
    address: ethers.constants.AddressZero,
  },
  BNB: {
    id: "binancecoin",
    isNative: true,
    address: "0x0000000000000000000000000000000000000001",
  }, // Special address for BNB in our contract
  XDC: {
    id: "xdce-crowd-sale",
    isNative: true,
    address: ethers.constants.AddressZero,
  },

  // ERC20 tokens
  USDT: {
    id: "tether",
    isNative: false,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  USDC: {
    id: "usd-coin",
    isNative: false,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  SOL: {
    id: "solana",
    isNative: false,
    address: "0x4e3Decbb3645551B8A19f0eA1678079FCB33fB4c",
  },

  // Add wrapped ETH on XDC network if available
  WETH: { id: "ethereum", isNative: false, address: "0xYourWethAddressOnXdc" },
};

// Contract ABIs for price updates
const presaleABI = [
  "function setPaymentToken(address _token, uint256 _priceUSD) external",
  "function tokenPrices(address token) external view returns (uint256)",
];

/**
 * Fetch the current prices from CoinGecko
 * @returns {Promise<Object>} - Object with token prices in USD
 */
const fetchCurrentPrices = async () => {
  // Check cache first
  if (
    priceCache.lastUpdated > 0 &&
    Date.now() - priceCache.lastUpdated < priceCache.TTL &&
    Object.keys(priceCache.prices).length > 0
  ) {
    return { ...priceCache.prices };
  }

  try {
    // Get IDs for all supported tokens
    const ids = Object.values(SUPPORTED_TOKENS)
      .map((token) => token.id)
      .join(",");

    // Fetch prices from CoinGecko API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch prices: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Process the response
    const prices = {};
    for (const [symbol, details] of Object.entries(SUPPORTED_TOKENS)) {
      if (data[details.id] && data[details.id].usd) {
        prices[symbol] = data[details.id].usd;
      }
    }

    // Update cache
    priceCache.prices = prices;
    priceCache.lastUpdated = Date.now();

    return prices;
  } catch (error) {
    console.error("Error fetching prices:", error);

    // If cache exists, return that instead
    // if (Object.keys(priceCache.prices).length > 0) {
    //   console.log("Using cached prices due to error");
    //   return { ...priceCache.prices };
    // }

    // Fallback prices if API fails and no cache
    return {
      ETH: 3000,
      BNB: 300,
      XDC: 0.04,
      USDT: 1,
      USDC: 1,
      WSOL: 100,
      WETH: 3000,
    };
  }
};

/**
 * Check if the contract prices are significantly different from current market prices
 * @param {Object} provider - Ethers.js provider
 * @param {number} threshold - Threshold percentage difference (e.g., 5 for 5%)
 * @returns {Promise<Object>} - Object with tokens that need updates
 */
const checkPriceDiscrepancies = async (provider, threshold = 5) => {
  try {
    // Get current chain ID
    const chainId = await getCurrentChainId(provider);

    // Get contract addresses
    const presaleAddress = CONTRACT_ADDRESSES[chainId]?.XDCAIPresale2;
    if (!presaleAddress) {
      throw new Error(
        `No presale contract address found for chain ID ${chainId}`
      );
    }

    // Create contract instance
    const presaleContract = new ethers.Contract(
      presaleAddress,
      presaleABI,
      provider
    );

    // Fetch current market prices
    const marketPrices = await fetchCurrentPrices();

    // Check each token's contract price vs market price
    const discrepancies = {};

    for (const [symbol, details] of Object.entries(SUPPORTED_TOKENS)) {
      try {
        // Get contract price
        const contractPriceWei = await presaleContract.tokenPrices(
          details.address
        );
        const contractPrice = Number(
          ethers.utils.formatUnits(contractPriceWei, 18)
        );

        // Get market price
        const marketPrice = marketPrices[symbol];

        if (!marketPrice) continue;

        // Calculate percent difference
        const percentDiff = Math.abs(
          ((marketPrice - contractPrice) / marketPrice) * 100
        );

        if (percentDiff > threshold) {
          discrepancies[symbol] = {
            contractPrice,
            marketPrice,
            percentDiff,
            needsUpdate: true,
          };
        }
      } catch (err) {
        console.log(`Error checking price for ${symbol}:`, err);
      }
    }

    return discrepancies;
  } catch (error) {
    // console.error("Error checking price discrepancies:", error);
    throw error;
  }
};

/**
 * Get a pre-purchase price quote to verify before transaction
 * @param {string} symbol - Token symbol (e.g., 'XDC')
 * @param {string} amount - Amount of tokens to purchase with
 * @returns {Promise<Object>} - Price quote information
 */
const getPrepurchaseQuote = async ({ symbol, amount, xdcaiPrice }) => {
  try {
    // Fetch latest prices
    const prices = await fetchCurrentPrices();

    // Get price for the token
    const tokenPrice = prices[symbol];

    if (!tokenPrice) {
      throw new Error(`Price not available for ${symbol}`);
    }

    // Convert token amount to USD
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber)) {
      throw new Error("Invalid amount");
    }

    const usdValue = amountNumber * tokenPrice;

    // Calculate XDCAI tokens to receive
    // Assuming $0.0004 per XDCAI token
    // const xdcaiPrice = 0.0004;
    const xdcaiAmount = usdValue / xdcaiPrice;

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
    const totalTokens = xdcaiAmount; // + bonusTokens;

    return {
      inputToken: symbol,
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

export { getPrepurchaseQuote, fetchCurrentPrices, checkPriceDiscrepancies };
