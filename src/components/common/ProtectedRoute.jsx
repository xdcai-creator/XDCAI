import React from "react";
import { Navigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";

/**
 * ProtectedRoute component for restricting access to authenticated users only
 * Redirects to connect page if user is not connected with a wallet
 */
const ProtectedRoute = ({ children }) => {
  const { isConnected, isEvmConnected, isSolanaConnected } = useWallet();

  // Redirect to connect page if not connected with any wallet
  if (!isConnected && !isEvmConnected && !isSolanaConnected) {
    return <Navigate to="/connect" replace />;
  }

  // If wallet is connected, render the protected component
  return children;
};

export default ProtectedRoute;
