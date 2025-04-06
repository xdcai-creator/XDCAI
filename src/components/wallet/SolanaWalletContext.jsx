// src/components/wallet/SolanaWalletContext.jsx
import React, { createContext, useContext, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";

// Create a context for Solana wallet functionality
const SolanaWalletContext = createContext(null);

/**
 * Provider component for Solana wallet functionality
 * Wraps the Solana wallet adapter with additional utility functions
 */
export const SolanaWalletProvider = ({ children }) => {
  const walletAdapter = useWallet();

  // Get RPC endpoint from environment or fallback to default
  const rpcEndpoint =
    import.meta.env.VITE_SOLANA_PROVIDER_URL || "https://api.devnet.solana.com";

  // Create a Connection instance
  const connection = useMemo(() => new Connection(rpcEndpoint), [rpcEndpoint]);

  // Utility function to format Solana addresses
  const formatAddress = (address) => {
    if (!address) return "";

    if (typeof address === "string") {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    if (address instanceof PublicKey) {
      const addressStr = address.toString();
      return `${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`;
    }

    return "";
  };

  // Utility function to get SOL balance
  const getSolBalance = async () => {
    if (!walletAdapter.publicKey) return 0;

    try {
      const balance = await connection.getBalance(walletAdapter.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      return 0;
    }
  };

  // Create value object with wallet adapter and utility functions
  const value = {
    ...walletAdapter,
    connection,
    formatAddress,
    getSolBalance,
    isConnected: walletAdapter.connected,
    address: walletAdapter.publicKey?.toString() || null,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};

/**
 * Hook to access Solana wallet functionality
 * @returns {Object} Solana wallet context
 */
export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);

  if (!context) {
    throw new Error(
      "useSolanaWallet must be used within a SolanaWalletProvider"
    );
  }

  return context;
};

export default SolanaWalletProvider;
