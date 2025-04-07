import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useWallet } from "../../hooks/useWallet";
import { usePrices } from "../../hooks/usePrices";
import { useContract } from "../../hooks/useContract";
import { useNetwork } from "../../context/NetworkContext";
import CurrencySelector from "../purchase/CurrencySelector";
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
  showProcessingTransaction,
  updateToast,
} from "../../utils/toastHandler";

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
  const [selectedCurrency, setSelectedCurrency] = useState("XDC");
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
    if (!ethAmount || !marketPrices[selectedCurrency]) return 0;
    return calculateBonus(ethAmount, selectedCurrency);
  }, [ethAmount, selectedCurrency, marketPrices, calculateBonus]);

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

  // Handle countdown for transaction intent
  useEffect(() => {
    if (!intentExpiry) return;

    const countdownInterval = setInterval(() => {
      const now = new Date();
      const expiryTime = new Date(intentExpiry);
      const timeRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000)); // in seconds

      setIntentTimeRemaining(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(countdownInterval);
        clearStoredIntentId();
        showWarning("Transaction time window expired. Please try again.");
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [intentExpiry]);

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
      setError("Please enter a valid amount and connect your wallet");
      return null;
    }

    try {
      const result = await registerTransactionIntent({
        walletAddress: address,
        expectedAmount: ethAmount,
        paymentCurrency: selectedCurrency,
        expectedChain:
          selectedCurrency === "XDC"
            ? "xdc"
            : selectedCurrency === "ETH" || selectedCurrency.includes("-ETH")
            ? "ethereum"
            : selectedCurrency === "BNB" || selectedCurrency.includes("-BNB")
            ? "bsc"
            : selectedCurrency === "SOL" || selectedCurrency.includes("-SOL")
            ? "solana"
            : "xdc",
      });

      setIntentId(result.intentId);
      setIntentExpiry(result.expiresAt);
      return result;
    } catch (error) {
      console.error("Error registering intent:", error);
      setError("Failed to prepare transaction. Please try again.");
      return null;
    }
  };

  // Handle currency selection
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setShowCurrencySelection(false);
    setError(null);
  };

  // Handle purchase transaction
  const handlePurchase = async () => {
    try {
      // Clear any previous errors
      setError(null);

      // Basic input validation
      if (!ethAmount || parseFloat(ethAmount) <= 0) {
        const errorMsg = `Please enter a valid ${selectedCurrency} amount`;
        setError(errorMsg);
        return;
      }

      if (!address) {
        const errorMsg = "No connected wallet account found";
        setError(errorMsg);
        return;
      }

      // For XDC, use the contract directly
      if (selectedCurrency === "XDC") {
        if (!presaleContract) {
          const errorMsg = "Contract not loaded. Please try again.";
          setError(errorMsg);
          return;
        }

        // Register transaction intent
        const intentResult = await registerIntent();
        if (!intentResult) return;

        // Processing begins
        setIsProcessing(true);
        const processingToastId = showProcessingTransaction();
        setToastId(processingToastId);

        try {
          // Process XDC payment through contract
          const parsedAmount = ethers.utils.parseEther(ethAmount);

          const tx = await presaleContract.buyWithNativeCoin({
            value: parsedAmount,
            gasLimit: ethers.utils.hexlify(300000),
          });

          updateToast(processingToastId, {
            render: "Transaction submitted, waiting for confirmation...",
          });

          // Wait for transaction confirmation
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            const usdValue =
              parseFloat(ethAmount) * marketPrices[selectedCurrency];

            // Store transaction details for thank you page
            const txDetails = {
              amount: ethAmount,
              currency: selectedCurrency,
              tokenDecimals: 18,
              tokens: xdcaiAmount,
              tokensReceived: xdcaiAmount,
              bonusTokens: bonusAmount.toString() || "0",
              hash: tx.hash || "",
              usdValue,
            };

            localStorage.setItem("xdcai_tx_details", JSON.stringify(txDetails));

            // Navigate to thank you page
            navigate("/thank-you");
          } else {
            throw new Error("Transaction failed");
          }
        } catch (txError) {
          console.error("Transaction error:", txError);
          handleTransactionError(txError);
        }
      } else {
        // For other chains (ETH, BNB, SOL, etc.), use the transfer service
        // Register transaction intent
        const intentResult = await registerIntent();
        if (!intentResult) return;

        // Processing begins
        setIsProcessing(true);
        const processingToastId = showProcessingTransaction();
        setToastId(processingToastId);

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
          const solanaRpcUrl = networkConfig.rpcEndpoints.solana.http;
          solanaConnection = new Connection(solanaRpcUrl);

          if (!solanaWallet || !solanaWallet.connected) {
            setError("Solana wallet not connected");
            setIsProcessing(false);
            return;
          }
        }

        // Initialize provider based on chain
        let provider = null;
        if (chain !== "solana") {
          if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);

            // Ensure the correct network is selected
            let requiredChainId;
            switch (chain) {
              case "ethereum":
                requiredChainId = isTestnet ? "aa36a7" : 1; // Goerli/Ethereum Mainnet
                break;
              case "bsc":
                requiredChainId = isTestnet ? 97 : 56; // BSC Testnet/Mainnet
                break;
              default:
                requiredChainId = isTestnet ? 5 : 1; // Default
            }

            try {
              // Request user to switch networks if needed
              const network = await provider.getNetwork();
              if (network.chainId !== requiredChainId) {
                try {
                  await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: `0x${requiredChainId.toString(16)}` }],
                  });
                  // Refresh provider after network switch
                  provider = new ethers.providers.Web3Provider(window.ethereum);
                } catch (switchError) {
                  // Handle the case where the chain has not been added to MetaMask
                  if (switchError.code === 4902) {
                    // Different chains have different parameters
                    let params;
                    if (chain === "bsc") {
                      params = {
                        chainId: `0x${requiredChainId.toString(16)}`,
                        chainName: isTestnet
                          ? "BSC Testnet"
                          : "Binance Smart Chain",
                        nativeCurrency: {
                          name: "BNB",
                          symbol: "BNB",
                          decimals: 18,
                        },
                        rpcUrls: [networkConfig.rpcEndpoints.bsc.http],
                        blockExplorerUrls: [
                          isTestnet
                            ? "https://testnet.bscscan.com/"
                            : "https://bscscan.com/",
                        ],
                      };
                    } else {
                      // Default to Ethereum parameters
                      params = {
                        chainId: `0x${requiredChainId.toString(16)}`,
                        chainName: isTestnet
                          ? "Sepolia Testnet"
                          : "Ethereum Mainnet",
                        nativeCurrency: {
                          name: "Ether",
                          symbol: "ETH",
                          decimals: 18,
                        },
                        rpcUrls: [networkConfig.rpcEndpoints.ethereum.http],
                        blockExplorerUrls: [
                          isTestnet
                            ? "https://sepolia.etherscan.io/"
                            : "https://etherscan.io/",
                        ],
                      };
                    }

                    try {
                      await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [params],
                      });

                      // After adding, try switching again
                      await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [
                          { chainId: `0x${requiredChainId.toString(16)}` },
                        ],
                      });

                      // Refresh provider after network switch
                      provider = new ethers.providers.Web3Provider(
                        window.ethereum
                      );
                    } catch (addError) {
                      setError(
                        `Could not add ${chain} network: ${addError.message}`
                      );
                      setIsProcessing(false);
                      return;
                    }
                  } else {
                    setError(
                      `Please switch to the correct network for ${selectedCurrency}`
                    );
                    setIsProcessing(false);
                    return;
                  }
                }
              }
            } catch (networkError) {
              console.error("Network detection error:", networkError);
              setError("Failed to determine network. Please try again.");
              setIsProcessing(false);
              return;
            }
          } else {
            setError("No Ethereum provider found");
            setIsProcessing(false);
            return;
          }
        }

        // Execute the transfer
        try {
          updateToast(processingToastId, {
            render: "Initiating transfer. Please confirm in your wallet...",
          });

          let transferResult;
          if (chain === "solana") {
            transferResult = await executeTransfer({
              chain,
              token: selectedCurrency,
              amount: ethAmount,
              connection: solanaConnection,
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
            render: "Transaction submitted, waiting for confirmation...",
          });

          // Store transaction details for thank you page
          const usdValue =
            parseFloat(ethAmount) * marketPrices[selectedCurrency];
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
          };

          localStorage.setItem("xdcai_tx_details", JSON.stringify(txDetails));

          // Navigate to thank you page
          navigate("/thank-you");
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
    }
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
              className="flex-1 bg-dark-light border border-dark-darker rounded-lg p-4 text-xl text-white h-14"
            />
            <button
              onClick={() => setShowCurrencySelection(true)}
              className="w-32 bg-dark-light border border-dark-darker rounded-lg px-4 flex items-center justify-center text-white cursor-pointer h-14"
            >
              <span className="font-bold text-lg">{selectedCurrency}</span>
              <span className="ml-2">▼</span>
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
            className="w-full bg-dark-light border border-dark-darker rounded-lg p-4 text-xl text-white h-14 mb-1"
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
              className="w-full bg-dark-light border border-dark-darker rounded-lg p-3 text-white text-lg"
            />
          </div>
        )}

        {/* Error message display */}
        {error && (
          <div className="text-center text-accent-red bg-accent-red/10 p-4 border border-accent-red rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Transaction intent timer */}
        {intentId && intentTimeRemaining > 0 && (
          <div className="bg-dark-light p-4 rounded-lg mb-4 border border-dark-darker text-center">
            <p className="text-primary font-medium mb-1">Time Window Active</p>
            <p className="text-white text-sm">
              Complete your transaction within{" "}
              <span className="font-bold text-primary">
                {Math.floor(intentTimeRemaining / 60)}:
                {(intentTimeRemaining % 60).toString().padStart(2, "0")}
              </span>
            </p>
          </div>
        )}

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
          {isProcessing
            ? "PROCESSING..."
            : isLoadingPrice
            ? "LOADING..."
            : (selectedCurrency === "SOL" ||
                selectedCurrency.includes("-SOL")) &&
              !isSolanaConnected
            ? "CONNECT SOLANA WALLET"
            : `BUY $XDCAI`}
        </button>
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
      <div className="mb-5 bg-dark-light border border-dark-darker rounded-lg p-4 flex justify-between items-center">
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
