//src/components/SolanaWalletProvider.jsx

import React from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// Initialize Phantom wallet adapter
const wallets = [new PhantomWalletAdapter()];

// Use devnet for testing
const endpoint = clusterApiUrl("devnet");

export function SolanaWalletProvider({ children }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function SolanaConnectButton() {
  return (
    <WalletMultiButton
      style={{
        backgroundColor: "#112211",
        border: "1px solid #00FA73",
        borderRadius: "10px",
        color: "white",
        fontSize: "16px",
        padding: "15px 20px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    />
  );
}
