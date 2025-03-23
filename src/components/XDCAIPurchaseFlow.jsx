import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./XDCAIPurchaseFlow.css";

// Import components
import { InitialScreen } from "./InitialScreen";
import { ConnectWallet } from "./ConnectWallet";
import { PurchaseScreen } from "./PurchaseScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { ClaimScreen } from "./ClaimScreen";
import ProtectedRoute from "./ProtectedRoute";

const XDCAIPurchaseFlow = () => {
  // State to manage shared data across routes
  const [account, setAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("XDC");
  const [ethAmount, setEthAmount] = useState("0");
  const [xdcaiAmount, setXdcaiAmount] = useState("0");
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setShowCurrencySelection(false);
  };

  return (
    <div className="xdcai-purchase-flow">
      <Routes>
        {/* Home route - shows initial welcome screen */}
        <Route path="/" element={<InitialScreen />} />

        {/* Connect wallet route */}
        <Route
          path="/connect"
          element={
            <ConnectWallet
              setAccount={setAccount}
              onTestSolanaConnect={() => {}}
            />
          }
        />

        {/* Purchase route - protected, requires wallet connection */}
        <Route
          path="/purchase"
          element={
            <ProtectedRoute>
              <PurchaseScreen
                selectedCurrency={selectedCurrency}
                ethAmount={ethAmount}
                setEthAmount={setEthAmount}
                xdcaiAmount={xdcaiAmount}
                setXdcaiAmount={setXdcaiAmount}
                handleCurrencySelect={handleCurrencySelect}
                showCurrencySelection={showCurrencySelection}
                setShowCurrencySelection={setShowCurrencySelection}
              />
            </ProtectedRoute>
          }
        />

        {/* Thank you route after purchase */}
        <Route
          path="/thank-you"
          element={
            <ProtectedRoute>
              <ThankYouScreen />
            </ProtectedRoute>
          }
        />

        {/* Claim tokens route */}
        <Route
          path="/claim"
          element={
            <ProtectedRoute>
              <ClaimScreen />
            </ProtectedRoute>
          }
        />

        {/* Fallback for invalid routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default XDCAIPurchaseFlow;
