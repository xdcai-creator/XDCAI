import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  switchToXdcNetwork,
  addXdcNetworkToWallet,
} from "../config/chainConfig";
import networkConfig from "../config/networkConfig";

const NetworkContext = createContext(null);

export const NetworkProvider = ({ children }) => {
  const { isConnected, address, chainId: wagmiChainId } = useAccount();
  const [currentChainId, setCurrentChainId] = useState(null);
  const [isXdcConnected, setIsXdcConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkError, setNetworkError] = useState(null);

  // Update current chain when wagmi chain changes
  useEffect(() => {
    if (wagmiChainId) {
      setCurrentChainId(wagmiChainId);

      // Check if current chain is XDC
      const xdcMainnetId = 50;
      const xdcTestnetId = 51;
      const isXdc =
        wagmiChainId === xdcMainnetId || wagmiChainId === xdcTestnetId;
      setIsXdcConnected(isXdc);
    }
  }, [wagmiChainId]);

  // Listen for ethereum provider chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainIdHex) => {
        const chainIdDecimal = parseInt(chainIdHex, 16);
        setCurrentChainId(chainIdDecimal);

        // Check if XDC network
        const targetChainId = networkConfig.isTestnet ? 51 : 50;
        setIsXdcConnected(chainIdDecimal === targetChainId);
      };

      // Check current chain when component mounts
      window.ethereum
        .request({ method: "eth_chainId" })
        .then((chainIdHex) => handleChainChanged(chainIdHex))
        .catch((err) => console.error("Error getting chain ID:", err));

      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Connect to XDC Network
  const connectToXdcNetwork = async () => {
    try {
      setNetworkError(null);
      setIsConnecting(true);

      // Use utility function to switch to XDC network
      await switchToXdcNetwork(networkConfig.isTestnet);

      // If we get here, the network switch was successful
      setIsXdcConnected(true);
      return true;
    } catch (error) {
      console.error("XDC network connection error:", error);
      setNetworkError("Failed to connect to XDC network. Please try again.");
      setIsXdcConnected(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const getNetworkDetails = () => {
    return {
      networkName: networkConfig.isTestnet
        ? "XDC Apothem Testnet"
        : "XDC Network",
      chainId: networkConfig.isTestnet ? "51" : "50",
      chainIdHex: networkConfig.isTestnet ? "0x33" : "0x32",
      currencySymbol: networkConfig.isTestnet ? "TXDC" : "XDC",
      rpcUrl: networkConfig.isTestnet
        ? "https://erpc.apothem.network"
        : "https://erpc.xinfin.network",
      blockExplorer: networkConfig.isTestnet
        ? "https://explorer.apothem.network"
        : "https://explorer.xinfin.network",
    };
  };

  const value = {
    currentChainId,
    isXdcConnected,
    isConnecting,
    networkError,
    connectToXdcNetwork,
    getNetworkDetails,
    isTestnet: networkConfig.isTestnet,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

export default NetworkContext;
