//src/components/WalletOption.jsx

import React, { useEffect, useState } from "react";
import { MetamaskIcon, CoinbaseWalletIcon, WalletConnectIcon } from "./icons";

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
    (async () => {
      try {
        const provider = await connector.getProvider();
        setReady(!!provider);
      } catch (error) {
        console.error(`Error checking connector ${connector.id}:`, error);
        setReady(false);
      }
    })();
  }, [connector]);

  // Debug logging for connector properties
  console.log(`Wallet option: ${connector.id}`, {
    id: connector.id,
    name: connector.name,
    ready: ready,
  });

  // Is this the currently selected wallet?
  const isSelected = selectedWallet === connector.id;

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
        cursor: "pointer",
        transition: "background-color 0.2s, border-color 0.2s",
        opacity: !ready || isPending ? 0.6 : 1,
        width: "100%",
        marginBottom: "10px",
      }}
      disabled={!ready || isPending}
      onClick={onClick}
    >
      <span>{getDisplayName(connector)}</span>
      <div style={{ width: "30px", height: "30px" }}>
        {getIconForConnector(connector)}
      </div>
    </button>
  );
}
