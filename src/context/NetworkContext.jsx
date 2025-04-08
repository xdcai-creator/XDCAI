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
      const handleChainChanged = async (chainIdHex) => {
        const chainIdDecimal = parseInt(chainIdHex, 16);
        setCurrentChainId(chainIdDecimal);

        // Check if XDC network
        const targetChainId = networkConfig.isTestnet ? 51 : 50;

        // Check if we're on XDC network AND have an account connected
        const isOnXdc = chainIdDecimal === targetChainId;

        if (isOnXdc) {
          try {
            // Check if we have an account
            const accounts = await window.ethereum.request({
              method: "eth_accounts",
            });
            setIsXdcConnected(isOnXdc && accounts && accounts.length > 0);
          } catch (err) {
            console.error("Error checking accounts:", err);
            setIsXdcConnected(false);
          }
        } else {
          setIsXdcConnected(false);
        }
      };

      // Initial check
      const checkCurrentChain = async () => {
        try {
          const chainIdHex = await window.ethereum.request({
            method: "eth_chainId",
          });
          await handleChainChanged(chainIdHex);
        } catch (err) {
          console.error("Error getting chain ID:", err);
        }
      };

      checkCurrentChain();
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", checkCurrentChain);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("accountsChanged", checkCurrentChain);
      };
    }
  }, []);

  // Connect to XDC Network
  const connectToXdcNetwork = async () => {
    try {
      setNetworkError(null);
      setIsConnecting(true);

      // First ensure we have wallet authorization - ask for accounts first
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts authorized");
      }

      // Then switch to XDC network
      await switchToXdcNetwork(networkConfig.isTestnet);

      // Verify chain ID after switching
      const chainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      });
      const chainIdDecimal = parseInt(chainIdHex, 16);
      const targetChainId = networkConfig.isTestnet ? 51 : 50;

      if (chainIdDecimal !== targetChainId) {
        throw new Error("Failed to switch to XDC network");
      }

      // Double-check accounts after network switch (some wallets disconnect on network change)
      const accountsAfterSwitch = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (!accountsAfterSwitch || accountsAfterSwitch.length === 0) {
        throw new Error("Account access lost after network switch");
      }

      // All checks passed - we have the right network and authorized accounts
      console.log("XDC connection successful:", {
        chain: chainIdDecimal,
        account: accountsAfterSwitch[0],
      });

      setIsXdcConnected(true);
      return true;
    } catch (error) {
      console.error("XDC network connection error:", error);
      setNetworkError(`Failed to connect to XDC network: ${error.message}`);
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
