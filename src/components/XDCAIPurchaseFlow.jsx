// src/components/XDCAIPurchaseFlow.jsx
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAccount } from "wagmi";
import "./XDCAIPurchaseFlow.css";

// Import components
import { InitialScreen } from "./InitialScreen";
import { ConnectWallet } from "./ConnectWallet";
import { PurchaseScreen } from "./PurchaseScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { ClaimScreen } from "./ClaimScreen";
import ProtectedRoute from "./ProtectedRoute";

// Import services
import { contractApi } from "../services/api";
import {
  fetchCurrentPrices,
  getPrepurchaseQuote,
} from "../services/priceService";
import {
  registerTransactionIntent,
  getStoredIntentId,
  getIntentStatus,
} from "../services/transactionIntentService";

const XDCAIPurchaseFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, address } = useAccount();

  // State to manage shared data across routes
  const [account, setAccount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("XDC");
  const [ethAmount, setEthAmount] = useState("0");
  const [xdcaiAmount, setXdcaiAmount] = useState("0");
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [intentId, setIntentId] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);
  const [contractDetails, setContractDetails] = useState(null);

  // Initialize account when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setAccount(address);
    } else {
      setAccount(null);
    }
  }, [isConnected, address]);

  // Load prices on component mount
  useEffect(() => {
    loadPrices();

    // Set up price refresh interval (every 5 minutes)
    const refreshInterval = setInterval(loadPrices, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  //get contract details
  useEffect(() => {
    if (!contractDetails) {
      const details = (async () => {
        const res = await contractApi.getContractDetails();

        if (res?.data) {
          setContractDetails(res.data);
        }
      })();
    }
  }, []);

  // Check for existing transaction intent
  useEffect(() => {
    const storedIntentId = getStoredIntentId();
    if (storedIntentId) {
      setIntentId(storedIntentId);
      checkExistingIntent(storedIntentId);
    }
  }, []);

  // Load token prices
  const loadPrices = async () => {
    try {
      setIsLoadingPrices(true);
      const prices = await fetchCurrentPrices();

      setMarketPrices(prices);

      // Fetch XDCAI token price
      // Assuming you have a method to get this from your contract or API
      // try {
      //   const tokenPriceData = await priceApi.getTokenPrice();
      //   setTokenPrice(tokenPriceData.priceUSD);
      // } catch (error) {
      //   console.error("Error fetching token price:", error);
      //   // Fallback price
      //   setTokenPrice("0.0003");
      // }
    } catch (error) {
      console.error("Error loading prices:", error);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Check status of existing intent
  const checkExistingIntent = async (id) => {
    try {
      const status = await getIntentStatus(id);

      // If the intent is verified or expired, navigate accordingly
      if (status.status === "VERIFIED") {
        navigate("/thank-you");
      } else if (status.status === "EXPIRED") {
        // Clear the intent and allow a new purchase
        clearStoredIntentId();
        setIntentId(null);
      }
    } catch (error) {
      console.error("Error checking intent status:", error);
    }
  };

  // Handle currency selection
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setShowCurrencySelection(false);

    // Reset error message
    setPurchaseError(null);

    // Recalculate XDCAI amount based on new currency
    if (ethAmount && ethAmount !== "0") {
      generateQuote(ethAmount, currency);
    }
  };

  // Generate purchase quote
  const generateQuote = async (amount, currency = selectedCurrency) => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setXdcaiAmount("0");
      return;
    }

    try {
      const params = {
        symbol: currency,
        amount: amount,
        xdcaiPrice: parseFloat(tokenPrice) || 0.0003,
      };

      const quote = await getPrepurchaseQuote(params);
      setXdcaiAmount(quote.totalTokens.toFixed(8));
    } catch (error) {
      console.error("Error generating quote:", error);
      setXdcaiAmount("0");
    }
  };

  // Register transaction intent
  const registerIntent = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0 || !account) {
      setPurchaseError("Please enter a valid amount and connect your wallet");
      return null;
    }

    try {
      const currentChain = getCurrentChainId();

      const result = await registerTransactionIntent({
        walletAddress: account,
        expectedAmount: ethAmount,
        paymentCurrency: selectedCurrency,
        expectedChain: currentChain,
      });

      setIntentId(result.intentId);
      return result;
    } catch (error) {
      console.error("Error registering intent:", error);
      setPurchaseError("Failed to prepare transaction. Please try again.");
      return null;
    }
  };

  // Helper to get current chain identifier
  const getCurrentChainId = () => {
    // This is a simplified version - in production, detect the actual connected chain
    return "xdc";
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4 py-6 bg-black">
      <div className="w-full max-w-md">
        <div className="relative w-full rounded-lg bg-gradient-widget border-2 border-dark-lighter shadow-lg overflow-hidden">
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
                    setEthAmount={(amount) => {
                      setEthAmount(amount);
                      generateQuote(amount);
                    }}
                    xdcaiAmount={xdcaiAmount}
                    setXdcaiAmount={setXdcaiAmount}
                    handleCurrencySelect={handleCurrencySelect}
                    showCurrencySelection={showCurrencySelection}
                    setShowCurrencySelection={setShowCurrencySelection}
                    isLoadingPrice={isLoadingPrices}
                    marketPrices={marketPrices}
                    intentId={intentId}
                    registerIntent={registerIntent}
                    purchaseError={purchaseError}
                    setPurchaseError={setPurchaseError}
                    contractDetails={contractDetails}
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
