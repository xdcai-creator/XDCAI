// src/components/ConnectWallet.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { WalletOptions } from "./WalletOptions";
import { SolanaWalletProvider } from "./SolanaWalletProvider";
import { SolanaConnectButton } from "./SolanaWalletProvider";
import { SolanaSendToken } from "./SolanaSendToken";
import { PhantomIcon } from "./icons";

export function ConnectWallet({ setAccount, onTestSolanaConnect }) {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showTest, setShowTest] = useState(false);
  const [error, setError] = useState(null);

  // Define wallet detector functions
  const walletDetectors = {
    isMetaMaskInstalled: () => {
      if (typeof window !== "undefined") {
        return Boolean(window.ethereum?.isMetaMask);
      }
      return false;
    },
    isPhantomInstalled: () => {
      if (typeof window !== "undefined") {
        return Boolean(window.solana?.isPhantom);
      }
      return false;
    },
    isCoinbaseInstalled: () => {
      if (typeof window !== "undefined") {
        return Boolean(window.ethereum?.isCoinbaseWallet);
      }
      return false;
    },
    isWalletConnectAvailable: () => true, // WalletConnect is always available as it's a QR code based solution
  };

  // Update the app's account state when the wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      // Automatically proceed to purchase screen when connected
      navigate("/purchase");
    }
  }, [isConnected, address, navigate]);

  // Handle test Solana wallet connection
  const handleTestSolanaConnect = async () => {
    try {
      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/purchase");
    } catch (error) {
      console.error("Test Solana connection error:", error);
      setError(error.message);
    }
  };

  // Handle test interface toggle
  const handleTestInterfaceToggle = () => {
    if (showTest) {
      // When going back to wallet options, reset the test state
      setSelectedWallet(null);
      setError(null);
    }
    setShowTest(!showTest);
  };

  return showTest ? (
    <SolanaWalletProvider>
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <SolanaConnectButton />
          <button
            onClick={handleTestInterfaceToggle}
            style={{
              padding: "10px 15px",
              backgroundColor: "#6B7280",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Back to Wallet Connector
          </button>
        </div>
        <SolanaSendToken />
        {error && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              color: "red",
              borderRadius: "5px",
              marginTop: "10px",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </SolanaWalletProvider>
  ) : (
    <div>
      <WalletOptions
        setSelectedWallet={setSelectedWallet}
        onTestSolanaConnect={handleTestSolanaConnect}
        onError={setError}
        walletDetectors={walletDetectors}
      />
      {error && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            color: "red",
            borderRadius: "5px",
            marginTop: "10px",
          }}
        >
          {error}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "2px",
          padding: "0 20px",
        }}
      >
        <button
          onClick={handleTestInterfaceToggle}
          style={{
            width: "100%",
            maxWidth: "520px",
            padding: "15px 20px",
            backgroundColor: "#112211",
            border: "1px solid #303030",
            borderRadius: "10px",
            color: "white",
            fontSize: "18px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s, border-color 0.2s",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <span>Phantom Wallet </span>
          <div style={{ width: "30px", height: "30px" }}>
            <PhantomIcon />
          </div>
        </button>
      </div>
    </div>
  );
}

export default ConnectWallet;
