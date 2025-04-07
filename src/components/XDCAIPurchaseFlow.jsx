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
import InitialScreen from "./screens/InitialScreen";
import ConnectWallet from "./wallet/ConnectWallet";
import PurchaseScreen from "./screens/PurchaseScreen";
import ThankYouScreen from "./screens/ThankYouScreen";
import ProtectedRoute from "./common/ProtectedRoute";

// Import services
import { contractApi } from "../services/api";
import { fetchCurrentPrices } from "../services/priceService";
import {
  registerTransactionIntent,
  getStoredIntentId,
  getIntentStatus,
  clearStoredIntentId,
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

  // Get contract details
  useEffect(() => {
    if (!contractDetails) {
      const fetchContractDetails = async () => {
        try {
          const res = await contractApi.getContractDetails();
          if (res?.data) {
            setContractDetails(res.data);
          }
        } catch (error) {
          console.error("Error fetching contract details:", error);
        }
      };

      fetchContractDetails();
    }
  }, [contractDetails]);

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
      try {
        const response = await contractApi.getContractDetails();
        if (response?.data?.tokenPriceUSD) {
          setTokenPrice(response.data.tokenPriceUSD);
        } else {
          // Fallback token price if API fails
          setTokenPrice(0.002);
        }
      } catch (error) {
        console.error("Error fetching token price:", error);
        // Fallback price
        setTokenPrice(0.002);
      }
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
  };

  // Register transaction intent
  const registerIntent = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0 || !account) {
      setPurchaseError("Please enter a valid amount and connect your wallet");
      return null;
    }

    try {
      const currentChain =
        selectedCurrency === "XDC"
          ? "xdc"
          : selectedCurrency === "ETH" || selectedCurrency.includes("-ETH")
          ? "ethereum"
          : selectedCurrency === "BNB" || selectedCurrency.includes("-BNB")
          ? "bsc"
          : selectedCurrency === "SOL" || selectedCurrency.includes("-SOL")
          ? "solana"
          : "xdc";

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

  return (
    <div className="flex justify-center items-center min-h-screen w-full px-4 py-6 bg-black">
      <div className="w-full max-w-md">
        <div className="relative w-full rounded-lg bg-[#161616] border-2 border-dark-lighter shadow-lg overflow-hidden">
          <Routes>
            {/* Home route - shows initial welcome screen */}
            <Route path="/" element={<InitialScreen />} />

            {/* Connect wallet route */}
            <Route
              path="/connect"
              element={<ConnectWallet setAccount={setAccount} />}
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
                    isLoadingPrice={isLoadingPrices}
                    marketPrices={marketPrices}
                    intentId={intentId}
                    registerIntent={registerIntent}
                    purchaseError={purchaseError}
                    setPurchaseError={setPurchaseError}
                    contractDetails={contractDetails}
                    tokenPrice={tokenPrice}
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
