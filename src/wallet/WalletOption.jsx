import React, { useEffect, useState } from "react";
import {
  MetamaskIcon,
  CoinbaseWalletIcon,
  WalletConnectIcon,
} from "../../assets/icons";

/**
 * Get icon based on connector ID or name
 * @param {Object} connector - Wallet connector
 * @returns {ReactElement} - Icon component
 */
const getIconForConnector = (connector) => {
  const id = connector.id.toLowerCase();
  const name = connector.name?.toLowerCase() || "";

  // Check for MetaMask
  if (id === "metamask" || name.includes("metamask")) {
    return <MetamaskIcon />;
  }

  // Check for Coinbase Wallet
  if (id === "coinbasewallet" || name.includes("coinbase")) {
    return <CoinbaseWalletIcon />;
  }

  // Check for WalletConnect
  if (id === "walletconnect" || name.includes("walletconnect")) {
    return <WalletConnectIcon />;
  }

  // Fallback
  return null;
};

/**
 * Get display name based on connector ID or name
 * @param {Object} connector - Wallet connector
 * @returns {string} - Display name
 */
const getDisplayName = (connector) => {
  const id = connector.id.toLowerCase();
  const name = connector.name?.toLowerCase() || "";

  // Check for MetaMask
  if (id === "metamask" || name.includes("metamask")) {
    return "MetaMask";
  }

  // Check for Coinbase Wallet
  if (id === "coinbasewallet" || name.includes("coinbase")) {
    return "Coinbase Wallet";
  }

  // Check for WalletConnect
  if (id === "walletconnect" || name.includes("walletconnect")) {
    return "WalletConnect";
  }

  // For other injected connectors
  if (id === "injected") {
    return connector.name || "Browser Wallet";
  }

  // Default to the connector name or ID
  return connector.name || connector.id;
};

/**
 * Wallet option button component
 */
const WalletOption = ({ connector, onClick, selectedWallet, isPending }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if the connector is ready (provider available)
    const checkConnectorReady = async () => {
      try {
        if (connector.id === "walletConnect") {
          // WalletConnect is always considered ready
          setReady(true);
          return;
        }

        // For other connectors, check provider
        const provider = await connector.getProvider();
        setReady(!!provider);
      } catch (error) {
        console.error(`Error checking connector ${connector.id}:`, error);

        // Consider WalletConnect and Coinbase always "ready" as they can be opened in another app
        if (
          connector.id === "walletConnect" ||
          connector.id === "coinbaseWallet"
        ) {
          setReady(true);
        } else {
          setReady(false);
        }
      }
    };

    checkConnectorReady();
  }, [connector]);

  // Is this the currently selected wallet?
  const isSelected = selectedWallet === connector.id;

  // Default all connectors to ready=true for better UX
  // This ensures all wallet options are clickable
  const isReady =
    connector.id === "walletConnect" || connector.id === "coinbaseWallet"
      ? true
      : ready;

  return (
    <button
      className={`flex justify-between items-center p-4 w-full
        ${isSelected ? "border-primary" : "border-dark-lighter"}
        ${
          isPending
            ? "opacity-70 cursor-not-allowed"
            : "cursor-pointer hover:border-primary-dark"
        }
        bg-dark-light border rounded-lg text-white font-medium transition-colors`}
      disabled={isPending}
      onClick={onClick}
    >
      <span>{getDisplayName(connector)}</span>

      {isPending ? (
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
      ) : (
        <div className="w-7 h-7">{getIconForConnector(connector)}</div>
      )}
    </button>
  );
};

export default WalletOption;
