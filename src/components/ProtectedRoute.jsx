// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useSolanaWallet } from "./wallet/SolanaWalletContext";

const ProtectedRoute = ({ children }) => {
  const { isConnected } = useAccount();
  let solanaWallet = useSolanaWallet();

  // Redirect only if BOTH are false
  if (!isConnected && !solanaWallet.connected) {
    return <Navigate to="/connect" replace />;
  }

  // If wallet is connected, render the protected component
  return children;
};

export default ProtectedRoute;
