// frontend/src/utils/chainUtils.js

import { ethers } from "ethers";
import { XDC_NETWORK } from "../components/config";

/**
 * Get the current connected chain ID
 * @param {Object} provider - Ethers.js provider
 * @returns {Promise<number>} - Chain ID as a number
 */
export const getCurrentChainId = async (provider) => {
  try {
    if (!provider) {
      throw new Error("Provider not available");
    }

    const { chainId } = await provider.getNetwork();
    return chainId;
  } catch (error) {
    console.error("Error getting chain ID:", error);
    // Default to XDC testnet if we can't get the chain ID
    return XDC_NETWORK.id;
  }
};

/**
 * Check if the current network is XDC Network
 * @param {Object} provider - Ethers.js provider
 * @returns {Promise<boolean>} - True if on XDC Network
 */
export const isXdcNetwork = async (provider) => {
  try {
    const chainId = await getCurrentChainId(provider);
    return chainId === 50 || chainId === 51; // XDC Mainnet or Testnet
  } catch (error) {
    console.error("Error checking if XDC network:", error);
    return false;
  }
};

/**
 * Get a provider for the current network
 * @returns {ethers.providers.Web3Provider|null} - Provider or null if not available
 */
export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return null;
};

/**
 * Get a signer for the current network
 * @returns {Promise<ethers.Signer|null>} - Signer or null if not available
 */
export const getSigner = async () => {
  try {
    const provider = getProvider();
    if (!provider) return null;

    // Request account access if needed
    await window.ethereum.request({ method: "eth_requestAccounts" });

    return provider.getSigner();
  } catch (error) {
    console.error("Error getting signer:", error);
    return null;
  }
};

/**
 * Format address for display (0x123...abc)
 * @param {string} address - Full address
 * @returns {string} - Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

/**
 * Get native currency symbol based on chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} - Native currency symbol
 */
export const getNativeCurrencySymbol = (chainId) => {
  switch (chainId) {
    case 1:
      return "ETH";
    case 56:
      return "BNB";
    case 50:
    case 51:
      return "XDC";
    default:
      return "ETH";
  }
};
