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
    <div className="xdcai-purchase-floww !flex !justify-center !items-center min-h-screen w-[100vw]">
      <div className="relative">
        <div className="relative max-w-md w-full rounded-lg !bg-[#121212] shadow-lg  p-4">
          {/* Widget side decorations */}
          {/* <div className="absolute bg-[#121212] right-[-12px] top-[180px] z-10">
            <div className="w-[40px] h-[40px] bg-[#121212] flex items-center justify-center transform rotate-45 mb-2">
              <span className="transform -rotate-45 text-[#00FF7F]">X</span>
            </div>
            <div className="w-[40px] h-[40px] bg-[#121212] flex items-center justify-center transform rotate-45 mb-2">
              <span className="transform -rotate-45 text-[#00FF7F]">🔍</span>
            </div>
          </div> */}
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
        <div className="w-full text-center p-3 text-gray-400 text-sm">
          Smart Contract Is Fully Audited.
        </div>
      </div>
    </div>
  );
};

export default XDCAIPurchaseFlow;
