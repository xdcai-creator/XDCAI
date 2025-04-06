import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useNetwork } from "../context/NetworkContext";

/**
 * Custom hook for wallet connection and management
 * @returns {Object} Wallet state and functions
 */
export const useWallet = () => {
  // Wagmi hooks for EVM wallets
  const {
    address,
    isConnected: isEvmConnected,
    chainId: evmChainId,
  } = useAccount();

  const {
    connectors,
    connect,
    isPending: isEvmConnecting,
    error: evmError,
  } = useConnect();

  const { disconnect: disconnectEvm } = useDisconnect();

  // Solana wallet adapter
  const solanaWallet = useSolanaWallet();
  const isSolanaConnected = solanaWallet.connected;
  const solanaPublicKey = solanaWallet.publicKey?.toString();

  // Network context
  const { connectToXdcNetwork, isXdcConnected } = useNetwork();

  // Unified wallet state
  const [activeWallet, setActiveWallet] = useState(null);
  const [error, setError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Determine if any wallet is connected
  const isConnected = isEvmConnected || isSolanaConnected;

  // Format the active address for display
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Get the current active address
  const activeAddress = isEvmConnected ? address : solanaPublicKey;
  const displayAddress = formatAddress(activeAddress);

  // Update active wallet when connection status changes
  useEffect(() => {
    if (isEvmConnected && address) {
      setActiveWallet({
        type: "evm",
        address,
        chainId: evmChainId,
      });
    } else if (isSolanaConnected && solanaPublicKey) {
      setActiveWallet({
        type: "solana",
        address: solanaPublicKey,
      });
    } else {
      setActiveWallet(null);
    }
  }, [isEvmConnected, address, evmChainId, isSolanaConnected, solanaPublicKey]);

  // Handle errors from wagmi
  useEffect(() => {
    if (evmError) {
      setError(evmError.message);
      setConnectionAttempts((prev) => prev + 1);
    }
  }, [evmError]);

  // Connect EVM wallet with timeout
  const connectEvmWallet = useCallback(
    async (connector) => {
      try {
        setError(null);

        // Check for MetaMask if connecting with the MetaMask connector
        if (connector.id === "metaMask" && !window.ethereum?.isMetaMask) {
          window.open("https://metamask.io/download", "_blank");
          throw new Error("Please install MetaMask to continue");
        }

        // Connect using the specified connector
        await connect({ connector });
        setConnectionAttempts(0);
        return true;
      } catch (err) {
        console.error("Wallet connection error:", err);
        setError(err.message || "Failed to connect wallet");
        return false;
      }
    },
    [connect]
  );

  // Universal disconnect function
  const disconnect = useCallback(() => {
    // Disconnect EVM wallet if connected
    if (isEvmConnected) {
      disconnectEvm();
    }

    // Disconnect Solana wallet if connected
    if (isSolanaConnected) {
      solanaWallet.disconnect();
    }

    setActiveWallet(null);
    setError(null);
  }, [isEvmConnected, disconnectEvm, isSolanaConnected, solanaWallet]);

  // Utility to check if wallet is supported
  const isWalletSupported = useCallback((walletType) => {
    if (walletType === "metamask") {
      return Boolean(window.ethereum?.isMetaMask);
    }
    if (walletType === "phantom") {
      return Boolean(window.solana?.isPhantom);
    }
    if (walletType === "coinbase") {
      return Boolean(window.ethereum?.isCoinbaseWallet);
    }
    return true; // Default to true for WalletConnect
  }, []);

  // Get all available connectors
  const getAvailableConnectors = useCallback(() => {
    return connectors.filter((c) => {
      // Only show connectors that have working implementations
      return ["metaMask", "walletConnect", "coinbaseWallet"].includes(c.id);
    });
  }, [connectors]);

  return {
    // Connection state
    isConnected,
    isEvmConnected,
    isSolanaConnected,
    isXdcConnected,
    isLoading: isEvmConnecting,
    error,

    // Current address info
    address: activeAddress,
    displayAddress,
    chainId: evmChainId,

    // Active wallet information
    activeWallet,

    // Connection functions
    connectEvmWallet,
    connectToXdcNetwork,
    disconnect,

    // Utility functions
    formatAddress,
    isWalletSupported,
    getAvailableConnectors,

    // Raw objects for advanced usage
    evmWallet: { address, chainId: evmChainId },
    solanaWallet,
  };
};

export default useWallet;
