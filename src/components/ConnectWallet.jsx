// src/components/ConnectWallet.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useConnect as useWagmiConnect } from "wagmi";
import { WalletOptions } from "./WalletOptions";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";

export function ConnectWallet({ setAccount }) {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const solanaWallet = useSolanaWallet();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [error, setError] = useState(null);
  const [activeBlockchain, setActiveBlockchain] = useState("evm"); // "evm" or "solana"

  // Use a ref to track if we've already navigated for this connection session
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    hasNavigatedRef.current = false;
  }, [location.pathname]);

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
      setAccount(address);
      // Automatically proceed to purchase screen when connected to EVM wallet
      if (!hasNavigatedRef.current && location.pathname === "/connect") {
        hasNavigatedRef.current = true;
        navigate("/purchase");
      }
    }
  }, [isConnected, address, navigate, setAccount]);

  // Listen for Solana wallet connection changes
  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.publicKey) {
      setAccount(solanaWallet.publicKey.toString());
      // Automatically proceed to purchase screen when connected to Solana wallet
      if (!hasNavigatedRef.current && location.pathname === "/connect") {
        hasNavigatedRef.current = true;
        navigate("/purchase");
      }
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, navigate, setAccount]);

  // Toggle between EVM and Solana wallets

  return (
    <div className="">
      <div className="solana-wallets flex flex-col items-center">
        <div className="w-full max-w-md ">
          <WalletOptions
            setSelectedWallet={setSelectedWallet}
            onError={setError}
            walletDetectors={walletDetectors}
          />
        </div>
      </div>
      {error && (
        <div className="mt-4 p-3 bg-accent-red/20 border border-accent-red rounded-md text-accent-red">
          {error}
        </div>
      )}
    </div>
  );
}

export default ConnectWallet;
