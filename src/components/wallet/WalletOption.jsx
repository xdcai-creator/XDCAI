//src/components/WalletOption.jsx

import React, { useEffect, useState } from "react";
import { MetamaskIcon, CoinbaseWalletIcon, WalletConnectIcon } from "../icons";

// Get icon based on connector ID or name
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

  // Fallback for anything else
  return null;
};

// Get display name based on connector ID or name
const getDisplayName = (connector) => {
  const id = connector.id.toLowerCase();
  const name = connector.name?.toLowerCase() || "";

  // Check for MetaMask
  if (id === "metamask" || name.includes("metamask")) {
    return "Metamask";
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

export function WalletOption({
  connector,
  onClick,
  selectedWallet,
  isPending,
}) {
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

  // Default all connectors to ready=true in this scenario
  // This ensures all wallet options are clickable
  const isReady =
    connector.id === "walletConnect" || connector.id === "coinbaseWallet"
      ? true
      : ready;

  return (
    <button
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 20px",
        backgroundColor: "#112211",
        border: isSelected ? "1px solid #00FA73" : "1px solid #303030",
        borderRadius: "10px",
        color: "white",
        fontSize: "18px",
        fontWeight: "500",
        cursor: isPending ? "not-allowed" : "pointer",
        transition: "background-color 0.2s, border-color 0.2s",
        opacity: isPending ? 0.6 : 1,
        width: "100%",
        marginBottom: "10px",
      }}
      disabled={isPending}
      onClick={onClick}
    >
      <span>{getDisplayName(connector)}</span>
      {isPending ? (
        <div
          className="spinner"
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: "2px solid #00FA73",
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
          }}
        />
      ) : (
        <div style={{ width: "30px", height: "30px" }}>
          {getIconForConnector(connector)}
        </div>
      )}
    </button>
  );
}

export default WalletOption;
