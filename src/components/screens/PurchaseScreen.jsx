import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useWallet } from "../../hooks/useWallet";
import { usePrices } from "../../hooks/usePrices";
import { useContract } from "../../hooks/useContract";
import { useNetwork } from "../../context/NetworkContext";
import CurrencySelector, {
  getCurrencyLogo,
} from "../purchase/CurrencySelector";
import {
  registerTransactionIntent,
  clearStoredIntentId,
} from "../../services/transactionIntentService";
import { executeTransfer } from "../../services/transferService";
import { Connection } from "@solana/web3.js";
import networkConfig from "../../config/networkConfig";
import { formatAddress } from "../../utils/formatters";
import {
  showWarning,
  showError,
  showProcessingTransaction,
  updateToast,
} from "../../utils/toastHandler";

import { getIntentStatus } from "../../services/transactionIntentService";

/**
 * Purchase screen component
 * Handles the token purchase flow
 */
const PurchaseScreen = () => {
  const navigate = useNavigate();
  const {
    address,
    isConnected,
    isSolanaConnected,
    isXdcConnected,
    displayAddress,
    solanaWallet,
    disconnect,
  } = useWallet();

  const {
    marketPrices,
    tokenPrice,
    isLoading: isLoadingPrice,
    calculateBonus,
  } = usePrices();

  const { contract: presaleContract, loading: presaleLoading } =
    useContract("XDCAIPresale2");

  const { isTestnet } = useNetwork();

  // Form state
  const [selectedCurrency, setSelectedCurrency] = useState("ETH");
  const [ethAmount, setEthAmount] = useState("");
  const [xdcaiAmount, setXdcaiAmount] = useState("0");
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);

  // Transaction state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [intentId, setIntentId] = useState(null);
  const [intentExpiry, setIntentExpiry] = useState(null);
  const [intentTimeRemaining, setIntentTimeRemaining] = useState(null);
  const [toastId, setToastId] = useState(null);

  // Calculate bonus based on purchase amount
  const bonusAmount = useMemo(() => {
    const formattedCurrency = selectedCurrency.includes("-")
      ? selectedCurrency.split("-")[0]
      : selectedCurrency;

    if (!ethAmount || !marketPrices[formattedCurrency]) return 0;
    return calculateBonus(ethAmount, formattedCurrency);
  }, [ethAmount, selectedCurrency, marketPrices, calculateBonus]);

  //
  const [processingStep, setProcessingStep] = useState("");
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  // Update XDCAI amount when input or currency changes
  useEffect(() => {
    if (
      ethAmount &&
      !isNaN(parseFloat(ethAmount)) &&
      marketPrices[selectedCurrency] &&
      tokenPrice
    ) {
      const usdValue = parseFloat(ethAmount) * marketPrices[selectedCurrency];
      const tokenAmount = usdValue / tokenPrice;
      setXdcaiAmount(tokenAmount.toFixed(8));
    } else {
      setXdcaiAmount("0");
    }
  }, [ethAmount, selectedCurrency, marketPrices, tokenPrice]);

  // Update XDCAI amount when input or currency changes
  useEffect(() => {
    if (ethAmount && !isNaN(parseFloat(ethAmount)) && tokenPrice) {
      // Handle price calculation for all token types
      let currencyPrice = marketPrices[selectedCurrency];

      // For all USDT and USDC variants, use a fixed price of 1 USD
      if (
        selectedCurrency.includes("USDT") ||
        selectedCurrency.includes("USDC")
      ) {
        currencyPrice = 1;
      } else {
        // For other tokens, get the price from marketPrices or default to 0
        // Extract the base token name for hyphenated tokens (e.g., "ETH" from "ETH-BNB")
        const baseToken = selectedCurrency.split("-")[0];
        currencyPrice = marketPrices[baseToken] || 0;
      }

      const usdValue = parseFloat(ethAmount) * currencyPrice;
      const tokenAmount = usdValue / tokenPrice;
      setXdcaiAmount(tokenAmount.toFixed(8));
    } else {
      setXdcaiAmount("0");
    }
  }, [ethAmount, selectedCurrency, marketPrices, tokenPrice, setXdcaiAmount]);

  // Handle amount input with decimal validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid decimal up to 8 decimal places
    if (value === "" || /^\d*\.?\d{0,8}$/.test(value)) {
      setEthAmount(value);
    }
  };

  // Register transaction intent with backend
  const registerIntent = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0 || !address) {
      toast.error("Please enter a valid amount and connect your wallet");
      return null;
    }

    try {
      // Determine base currency without the chain suffix
      let baseCurrency = selectedCurrency;
      if (selectedCurrency.includes("-")) {
        baseCurrency = selectedCurrency.split("-")[0]; // Extract USDT from USDT-BNB
      }

      // Determine chain
      const currentChain =
        selectedCurrency === "XDC"
          ? "xdc"
          : selectedCurrency.includes("-ETH") || selectedCurrency === "ETH"
          ? "ethereum"
          : selectedCurrency.includes("-BNB") || selectedCurrency === "BNB"
          ? "bsc"
          : selectedCurrency.includes("-SOL") || selectedCurrency === "SOL"
          ? "solana"
          : "xdc";

      // For Solana, use the Solana wallet address if available
      let walletToUse = address;
      if (currentChain === "solana" && solanaWallet && solanaWallet.publicKey) {
        walletToUse = solanaWallet.publicKey.toString();
        console.log("Using Solana wallet address for intent:", walletToUse);
      }

      const result = await registerTransactionIntent({
        walletAddress: walletToUse,
        expectedAmount: ethAmount,
        paymentCurrency: baseCurrency, // Send USDT instead of USDT-BNB
        expectedChain: currentChain,
        tokenType: selectedCurrency, // Include the full token name as tokenType
      });

      setIntentId(result.intentId);
      return result;
    } catch (error) {
      console.error("Error registering intent:", error);
      toast.error("Failed to prepare transaction. Please try again.");
      return null;
    }
  };

  // Handle currency selection
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setShowCurrencySelection(false);
    setError(null);
  };

  const isIntentExpired = async (intentId) => {
    if (!intentId) return true;

    try {
      const status = await getIntentStatus(intentId);
      return status.status === "EXPIRED";
    } catch (error) {
      console.error("Error checking intent status:", error);
      return true; // Consider it expired if there's an error checking
    }
  };

  // Add this function and call it at the beginning of handlePurchase
  const resetTransactionState = () => {
    // Clear ALL localStorage related to transactions
    localStorage.removeItem("xdcai_contribution_id");
    localStorage.removeItem("xdcai_tx_details");
    localStorage.removeItem("xdcai_seen_thank_you");

    // Dismiss any existing toast notifications
    toast.dismiss();

    // Reset state variables
    setIntentId(null);
    setIntentExpiry(null);
    setIntentTimeRemaining(null);
    setToastId(null);
    setError(null);
  };

  // Handle purchase transaction
  const handlePurchase = async () => {
    try {
      // Clear any previous errors
      setError(null);
      setProcessingStep("");

      // Basic input validation
      if (!ethAmount || parseFloat(ethAmount) <= 0) {
        const errorMsg = `Please enter a valid ${selectedCurrency} amount`;
        showError(errorMsg);
        return;
      }

      if (!address) {
        const errorMsg = "No connected wallet account found";
        showError(errorMsg);
        return;
      }

      resetTransactionState();

      // Special handling for Solana wallet connection
      if (
        (selectedCurrency === "SOL" || selectedCurrency.includes("-SOL")) &&
        !isSolanaConnected
      ) {
        if (solanaWallet && solanaWallet.wallet) {
          try {
            await solanaWallet.connect();
            // Don't proceed with purchase yet - user needs to complete connection first
            return;
          } catch (err) {
            console.error("Error connecting to Solana wallet:", err);
            showError("Failed to connect Solana wallet. Please try again.");
            return;
          }
        } else {
          showError("Please connect a Solana wallet to continue");
          return;
        }
      }

      const newIntent = await registerIntent();
      if (!newIntent) {
        showError("Purchase could not be initialized");
        return;
      }

      console.log("newIntent ", newIntent);
      // Check if there's an existing intent and if it's expired
      // if (intentId) {
      //   const expired = await isIntentExpired(intentId);

      //   if (expired) {
      //     // Clear the expired intent
      //     clearStoredIntentId();
      //     setIntentId(null);

      //     // Register a new intent
      //     setProcessingStep("Preparing transaction...");
      //     const newIntent = await registerIntent();
      //     if (!newIntent) {
      //       showError("Purchase could not be initialized");
      //       return;
      //     }
      //   }
      // } else {
      //   // No existing intent, register a new one
      //   setProcessingStep("Preparing transaction...");
      //   const newIntent = await registerIntent();
      //   if (!newIntent) {
      //     showError("Purchase could not be initialized");
      //     return;
      //   }
      // }

      // Processing begins
      setIsProcessing(true);
      const processingToastId = showProcessingTransaction();
      setToastId(processingToastId);

      // For XDC, use the contract directly
      if (selectedCurrency === "XDC") {
        if (!presaleContract) {
          const errorMsg = "Contract not loaded. Please try again.";
          showError(errorMsg);
          setIsProcessing(false);
          return;
        }

        try {
          setProcessingStep("Processing XDC payment...");
          // Process XDC payment through contract
          const parsedAmount = ethers.utils.parseEther(ethAmount);

          updateToast(processingToastId, {
            render: "Please confirm the transaction in your wallet...",
          });

          const tx = await presaleContract.buyWithNativeCoin({
            value: parsedAmount,
            gasLimit: ethers.utils.hexlify(300000),
          });

          updateToast(processingToastId, {
            render: "Transaction submitted, waiting for confirmation...",
          });

          setProcessingStep("Waiting for confirmation...");
          // Wait for transaction confirmation
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            const usdValue =
              parseFloat(ethAmount) * marketPrices[selectedCurrency];

            // Store transaction details for thank you page
            const txDetails = {
              amount: ethAmount,
              currency: selectedCurrency,
              tokenType: selectedCurrency,
              tokenDecimals: 18,
              tokens: xdcaiAmount,
              tokensReceived: xdcaiAmount,
              bonusTokens: bonusAmount.toString() || "0",
              hash: tx.hash || "",
              usdValue,
            };

            localStorage.setItem("xdcai_tx_details", JSON.stringify(txDetails));

            // Navigate to thank you page
            navigateToThankYou();
          } else {
            throw new Error("Transaction failed");
          }
        } catch (txError) {
          console.error("Transaction error:", txError);
          handleTransactionError(txError);
        }
      } else {
        // For other chains (ETH, BNB, SOL, etc.), use the transfer service
        try {
          setIsSwitchingNetwork(true);
          setProcessingStep("Preparing wallet...");

          updateToast(processingToastId, {
            render: "Preparing transaction. Please follow wallet prompts...",
          });

          // Determine which chain and token to use
          let chain = "ethereum"; // Default
          let solanaConnection = null;

          // Determine the chain based on selected currency
          if (selectedCurrency === "ETH") {
            chain = "ethereum";
          } else if (
            selectedCurrency === "BNB" ||
            selectedCurrency.includes("-BNB")
          ) {
            chain = "bsc";
          } else if (
            selectedCurrency === "SOL" ||
            selectedCurrency.includes("-SOL")
          ) {
            chain = "solana";

            // For Solana, we need to initialize the connection
            // const solanaRpcUrl = networkConfig.rpcEndpoints.solana.http;
            // solanaConnection = new Connection(solanaRpcUrl);

            if (!solanaWallet || !solanaWallet.connected) {
              setError("Solana wallet not connected");
              setIsProcessing(false);
              setIsSwitchingNetwork(false);
              return;
            }
          }

          // Initialize provider based on chain
          let provider = null;
          if (chain !== "solana") {
            if (window.ethereum) {
              provider = new ethers.providers.Web3Provider(window.ethereum);
              setProcessingStep("Switching to correct network...");
            } else {
              setError("No Ethereum provider found");
              setIsProcessing(false);
              setIsSwitchingNetwork(false);
              return;
            }
          }

          // Network switch should now be handled within the transfer functions
          setIsSwitchingNetwork(false);
          setProcessingStep("Please confirm transaction in your wallet...");

          updateToast(processingToastId, {
            render: "Please confirm the transaction in your wallet...",
          });

          let transferResult;
          if (chain === "solana") {
            transferResult = await executeTransfer({
              chain,
              token: selectedCurrency,
              amount: ethAmount,
              // connection: solanaConnection,
              wallet: solanaWallet,
            });
          } else {
            transferResult = await executeTransfer({
              chain,
              token: selectedCurrency,
              amount: ethAmount,
              provider,
            });
          }

          // Update toast to show waiting for confirmation
          updateToast(processingToastId, {
            render: "Transaction submitted successfully!",
            autoClose: 3000,
            type: "SUCCESS", //toast.TYPE.SUCCESS,
          });

          setProcessingStep("Transaction complete!");

          // Store transaction details for thank you page
          const formattedCurrency = selectedCurrency.includes("-")
            ? selectedCurrency.split("-")[0]
            : selectedCurrency;
          const usdValue =
            parseFloat(ethAmount) * marketPrices[formattedCurrency];
          //
          const txDetails = {
            amount: ethAmount,
            currency: selectedCurrency,
            tokenDecimals:
              selectedCurrency === "USDT" || selectedCurrency === "USDC"
                ? 6
                : 18,
            tokens: xdcaiAmount,
            tokensReceived: xdcaiAmount,
            bonusTokens: bonusAmount.toString() || "0",
            hash: transferResult.transactionHash || "",
            usdValue,
            senderAddress: transferResult.fromAddress,
            sourceChain: transferResult.chain,
            tokenType: selectedCurrency,
          };

          console.log("txDetails ", txDetails);

          localStorage.setItem("xdcai_tx_details", JSON.stringify(txDetails));

          // Navigate to thank you page
          navigateToThankYou();
        } catch (transferError) {
          console.error("Transfer error:", transferError);
          handleTransactionError(transferError);
        }
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Transaction failed. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
      setIsSwitchingNetwork(false);
      setProcessingStep("");
    }
  };

  const navigateToThankYou = () => {
    // Clear any toast notifications from previous transactions
    toast.dismiss();

    // Navigate with a unique key to ensure complete component remount
    navigate("/thank-you", { state: { txTimestamp: Date.now() } });
  };

  // Helper function to handle transaction errors
  const handleTransactionError = (error) => {
    // Detect common error types
    if (error.code === "ACTION_REJECTED") {
      setError("Transaction was rejected by user.");
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      setError("Insufficient funds for transaction.");
    } else if (error.message?.includes("user rejected")) {
      setError("Transaction was rejected by user.");
    } else if (error.message?.includes("gas")) {
      setError("Transaction failed: Gas estimation failed or out of gas.");
    } else if (error.message?.includes("approve")) {
      setError("Token approval failed. Please try again.");
    } else {
      setError("Transaction failed. Please check console for details.");
    }
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    await disconnect();
    navigate("/connect");
  };

  // Render the purchase form or currency selector
  const renderPageContent = () => {
    if (showCurrencySelection) {
      return (
        <CurrencySelector
          onSelect={handleCurrencySelect}
          onCancel={() => setShowCurrencySelection(false)}
          prices={marketPrices}
        />
      );
    }

    return (
      <div className="px-1">
        {/* Pay with crypto field */}
        <div className="mb-6">
          <p className="text-left text-[#ccc] text-base mb-1">
            Pay with {selectedCurrency}
          </p>
          <div className="flex justify-between gap-2">
            <input
              type="text"
              value={ethAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="flex-1 bg-dark-light border border-[#425152] rounded-lg p-4 text-xl text-white h-14"
            />
            <button
              onClick={() => setShowCurrencySelection(true)}
              className="w-32 bg-dark-light border border-[#425152] rounded-lg px-2 flex items-center justify-between text-white cursor-pointer h-14"
            >
              <span className="mr-3"> {getCurrencyLogo(selectedCurrency)}</span>
              <span className="font-medium text-md">
                {selectedCurrency?.split("-")[0]}
              </span>
              <span className="ml-1">▼</span>
            </button>
          </div>
        </div>

        {/* Receive XDCAI field */}
        <div className="mb-1">
          <p className="text-left text-[#ccc] text-base mb-1">Receive $XDCAI</p>
          <input
            type="text"
            value={xdcaiAmount}
            readOnly
            placeholder="0"
            className="w-full bg-dark-light border border-[#425152] rounded-lg p-4 text-xl text-white h-14 mb-1"
          />
          <p className="text-right text-[#aaa] text-sm mb-5">
            1 $XDCAI = {isLoadingPrice ? "Loading..." : `$${tokenPrice}`}
          </p>
        </div>

        {/* Bonus display */}
        {bonusAmount > 0 && (
          <div className="mb-10">
            <p className="text-[#cccccc] text-[15px] mb-1 text-left">
              Extra $XDCAI Bonus Token
            </p>
            <input
              type="text"
              value={bonusAmount.toFixed(8)}
              readOnly
              className="w-full bg-dark-light border border-[#425152] rounded-lg p-3 text-white text-lg"
            />
          </div>
        )}

        {/* Transaction intent timer */}
        {/* {intentId && intentTimeRemaining > 0 && (
          <div className="bg-dark-light p-4 rounded-lg mb-4 border border-[#425152] text-center">
            <p className="text-primary font-medium mb-1">Time Window Active</p>
            <p className="text-white text-sm">
              Complete your transaction within{" "}
              <span className="font-bold text-primary">
                {Math.floor(intentTimeRemaining / 60)}:
                {(intentTimeRemaining % 60).toString().padStart(2, "0")}
              </span>
            </p>
          </div>
        )} */}

        {/* Buy button */}
        <button
          onClick={handlePurchase}
          disabled={isProcessing || isLoadingPrice}
          className={`w-full py-4 text-xl font-medium text-dark rounded-lg h-15
            ${
              isProcessing || isLoadingPrice
                ? "bg-primary-dark cursor-not-allowed"
                : "bg-[#00FA73] cursor-pointer hover:bg-primary-light"
            }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              {processingStep || "PROCESSING..."}
              <div className="ml-2 animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            </span>
          ) : isLoadingPrice ? (
            "LOADING..."
          ) : (selectedCurrency === "SOL" ||
              selectedCurrency.includes("-SOL")) &&
            !isSolanaConnected ? (
            "CONNECT SOLANA WALLET"
          ) : (
            `BUY $XDCAI`
          )}
        </button>
        {isSwitchingNetwork && (
          <div className="absolute inset-0 bg-dark-darker/70 flex items-center justify-center z-10">
            <div className="bg-dark-light p-4 rounded-lg text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-white">Switching networks...</p>
              <p className="text-gray-light text-sm mt-1">
                Please confirm in your wallet
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 pt-12 relative max-w-xl mx-auto">
      <div className="text-xs text-white font-semibold bg-[#425152] absolute top-0 right-0 left-0 text-center py-1 overflow-x-auto">
        The future of AI-powered agents is here - Grab $XDCAI at presale prices
        & fuel the AI revolution
      </div>

      {/* Account Information Section */}
      <div className="mb-5 bg-dark-light border border-[#425152] rounded-lg p-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3 text-dark font-bold">
            {displayAddress.charAt(0)}
          </div>
          <div>
            <div className="font-bold">{displayAddress}</div>
            <div className="text-sm text-primary">Connected</div>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="bg-transparent border border-accent-red rounded-md text-accent-red py-1 px-3 text-sm cursor-pointer"
        >
          Disconnect
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 text-center">
        <p className="text-right text-[#ccc] text-sm mb-2">
          Can't find tokens in your wallet?
        </p>
        <h2 className="text-xl text-white my-4">
          Take advantage of Huge Early Staking Rewards by becoming an early
          adopter!
        </h2>
        <div className="text-primary text-[#00FA73] text-4xl font-semibold my-6">
          BUY $XDCAI PRESALE NOW!
        </div>
      </div>

      {/* Purchase form or currency selector */}
      {renderPageContent()}
    </div>
  );
};

export default PurchaseScreen;
