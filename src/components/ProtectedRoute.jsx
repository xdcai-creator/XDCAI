// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAccount } from "wagmi";

const ProtectedRoute = ({ children }) => {
  const { isConnected } = useAccount();

  // If wallet is not connected, redirect to connect wallet page
  if (!isConnected) {
    return <Navigate to="/connect" replace />;
  }

  // If wallet is connected, render the protected component
  return children;
};

export default ProtectedRoute;
