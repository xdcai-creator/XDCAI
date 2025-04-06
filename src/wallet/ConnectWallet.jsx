import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";
import WalletOption from "./WalletOption";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Wallet connection component that handles both EVM and Solana wallets
 */
export function ConnectWallet() {
  const navigate = useNavigate();
  const {
    isConnected,
    isEvmConnected,
    isSolanaConnected,
    error: walletError,
    connectEvmWallet,
    getAvailableConnectors,
    isWalletSupported,
  } = useWallet();

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [error, setError] = useState(null);
  const [pendingConnector, setPendingConnector] = useState(null);

  // Get available wallet connectors
  const availableConnectors = getAvailableConnectors();

  // If connected, redirect to purchase page (avoid rendering)
  if (isConnected && location.pathname === "/connect") {
    navigate("/purchase");
    return null;
  }

  // Handle connection error
  if (walletError && !error) {
    setError(walletError);
  }

  // Handle wallet connection
  const handleConnectWallet = async (connector) => {
    try {
      // Reset error state and update UI
      setError(null);
      setSelectedWallet(connector.id);
      setPendingConnector(connector.id);

      // Check if wallet is available before trying to connect
      if (connector.id === "metaMask" && !isWalletSupported("metamask")) {
        window.open("https://metamask.io/download/", "_blank");
        throw new Error("Please install MetaMask to continue");
      }

      // Attempt connection
      const success = await connectEvmWallet(connector);

      if (success) {
        // Clear pending state and navigate
        setPendingConnector(null);
      } else {
        throw new Error("Connection failed");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err.message || "Failed to connect wallet");
      setPendingConnector(null);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-dark rounded-lg">
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        Connect Wallet
      </h2>

      <p className="text-center text-gray-light mb-4">
        If you already have a wallet, select it from the options below.
      </p>

      <p className="text-center text-gray-light mb-6">
        If you don't have a wallet, install{" "}
        <a
          href="https://metamask.io/download.html"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:text-primary-light font-medium"
        >
          Metamask
        </a>{" "}
        to get started.
      </p>

      <div className="flex flex-col w-full gap-3 mb-4">
        {availableConnectors.length > 0 ? (
          availableConnectors.map((connector) => (
            <WalletOption
              key={connector.uid || connector.id}
              connector={connector}
              onClick={() => handleConnectWallet(connector)}
              selectedWallet={pendingConnector}
              isPending={pendingConnector === connector.id}
            />
          ))
        ) : (
          <p className="text-gray-light text-center">
            No wallet connectors available. Please make sure you have a wallet
            installed.
          </p>
        )}

        {/* Solana wallet connection */}
        <div className="flex justify-center w-full">
          <WalletMultiButton
            className="flex justify-between items-center py-4 px-6 w-full
              bg-dark-light border border-dark-lighter hover:border-primary-dark
              rounded-lg text-white font-medium transition-colors"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "58px",
            }}
          >
            <span>Phantom </span>
            {isSolanaConnected && (
              <div className="text-gray-light text-xs">Connected</div>
            )}
          </WalletMultiButton>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-accent-red/20 border border-accent-red rounded-md p-4 text-accent-red text-center">
          {error}
        </div>
      )}
    </div>
  );
}

export default ConnectWallet;
