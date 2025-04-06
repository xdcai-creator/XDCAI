// src/config.js
/**
 * Application configuration file
 * Uses environment variables with fallbacks
 */

// API URL
export const VITE_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3500";

// Chain-specific addresses for transactions
export const VITE_OWNER_ETHEREUM_ADDRESS = import.meta.env
  .VITE_OWNER_ETHEREUM_ADDRESS;
export const VITE_OWNER_BSC_ADDRESS = import.meta.env.VITE_OWNER_BSC_ADDRESS;
export const VITE_OWNER_SOLANA_ADDRESS = import.meta.env
  .VITE_OWNER_SOLANA_ADDRESS;
export const VITE_OWNER_XDC_ADDRESS = import.meta.env.VITE_OWNER_XDC_ADDRESS;

// Feature flags
export const ENABLE_CLAIMS = import.meta.env.VITE_ENABLE_CLAIMS === "true";
export const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN === "true";

// Token contract addresses
export const VITE_XDC_AI_TOKEN_ADDRESS = import.meta.env
  .VITE_XDC_AI_TOKEN_ADDRESS;
export const VITE_XDC_AI_TOKEN_TESTNET_ADDRESS = import.meta.env
  .VITE_XDC_AI_TOKEN_TESTNET_ADDRESS;
export const VITE_XDC_AI_PRESALE_ADDRESS = import.meta.env
  .VITE_XDC_AI_PRESALE_ADDRESS;
export const VITE_XDC_AI_PRESALE_TESTNET_ADDRESS = import.meta.env
  .VITE_XDC_AI_PRESALE_TESTNET_ADDRESS;

export default {
  VITE_API_URL,
  VITE_OWNER_ETHEREUM_ADDRESS,
  VITE_OWNER_BSC_ADDRESS,
  VITE_OWNER_SOLANA_ADDRESS,
  VITE_OWNER_XDC_ADDRESS,
  ENABLE_CLAIMS,
  ENABLE_ADMIN,
  VITE_XDC_AI_TOKEN_ADDRESS,
  VITE_XDC_AI_TOKEN_TESTNET_ADDRESS,
  VITE_XDC_AI_PRESALE_ADDRESS,
  VITE_XDC_AI_PRESALE_TESTNET_ADDRESS,
};
