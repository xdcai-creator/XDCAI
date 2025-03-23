// File: frontend/src/components/PurchaseScreen.jsx
// src/components/PurchaseScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { formatUnits } from "viem";
import { ethers } from "ethers";
import { useContract } from "../hooks/useContract";
import {
  showPurchaseSuccess,
  showProcessingTransaction,
  updateToast,
  handlePurchaseError,
} from "../utils/toastHandler";
import {
  formatTokenPrice,
  formatTokenAmount,
  calculateTimeUntilNextUpdate,
} from "../utils/tokenUtils";
import {
  fetchCurrentPrices,
  getPrepurchaseQuote,
} from "../services/priceService";
import { getNativeCurrencySymbol, formatAddress } from "../utils/chainUtils";

export const PurchaseScreen = ({
  selectedCurrency, // Used in amount calculations
  ethAmount, // Input amount state
  setEthAmount, // Setter for input amount
  xdcaiAmount, // Calculated XDCAI amount
  setXdcaiAmount, // Setter for XDCAI amount
  handleCurrencySelect, // Function to select currency
  showCurrencySelection, // Flag to show currency selection
  setShowCurrencySelection, // Setter for currency selection
}) => {
  const navigate = useNavigate();

  // Account related hooks
  const { address, isConnected, chainId: currentChainId } = useAccount();
  const { disconnect } = useDisconnect();

  // Contract hooks
  const {
    contract: presaleContract,
    loading: presaleLoading,
    error: presaleError,
  } = useContract("XDCAIPresale2");

  const {
    contract: tokenContract,
    loading: tokenLoading,
    error: tokenError,
  } = useContract("XDCAIToken");

  // Local state for transaction status
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);
  const [nextPriceIncrease, setNextPriceIncrease] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [tokenSymbol, setTokenSymbol] = useState("XDCAI");
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [transactionHash, setTransactionHash] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [toastId, setToastId] = useState(null);
  const [currentMarketPrices, setCurrentMarketPrices] = useState({});
  const [purchaseQuote, setPurchaseQuote] = useState(null);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  // Coin network associations with chain IDs
  const coinNetworks = {
    ETH: { name: "ETH", chainId: 1 },
    BNB: { name: "BSC", chainId: 56 },
    SOL: { name: "SOL", chainId: null }, // Solana isn't an EVM chain
    USDT: { name: "ETH", chainId: 1 },
    USDC: { name: "ETH", chainId: 1 },
    "USDT-BNB": { name: "BSC", chainId: 56 },
    "USDC-BNB": { name: "BSC", chainId: 56 },
    "USDT-SOL": { name: "SOL", chainId: null },
    "USDC-SOL": { name: "SOL", chainId: null },
    XDC: { name: "XDC", chainId: 50 },
  };

  // Original coin data with added network property
  const coinData = [
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: 0.001,
      value: 3.122,
      network: "ETH",
    },
    {
      symbol: "BNB",
      name: "Binance Coin",
      balance: 0.001,
      value: 0.968,
      network: "BSC",
    },
    { symbol: "SOL", name: "Solana", balance: 0, value: 0, network: "SOL" },
    { symbol: "USDT", name: "USDT", balance: 0, value: 0, network: "ETH" },
    { symbol: "USDC", name: "USD Coin", balance: 0, value: 0, network: "ETH" },
    { symbol: "USDT-BNB", name: "USDT", balance: 0, value: 0, network: "BSC" },
    {
      symbol: "USDC-BNB",
      name: "USD Coin",
      balance: 0,
      value: 0,
      network: "BSC",
    },
    { symbol: "USDT-SOL", name: "USDT", balance: 0, value: 0, network: "SOL" },
    {
      symbol: "USDC-SOL",
      name: "USD Coin",
      balance: 0,
      value: 0,
      network: "SOL",
    },
    { symbol: "XDC", name: "XDC", balance: 0.1, value: 0.04, network: "XDC" },
  ];

  const [activeTab, setActiveTab] = useState("ALL");
  const [filteredCoins, setFilteredCoins] = useState(coinData);
  const [coinPrices, setCoinPrices] = useState({});

  // Format the address to show as 0x123...abc
  const displayAddress = formatAddress(address);

  // Fetch contract info and market prices when contract is loaded
  useEffect(() => {
    const fetchContractInfo = async () => {
      try {
        if (presaleContract && !presaleLoading) {
          setIsLoadingPrice(true);

          // Get current token price
          const price = await presaleContract.tokenPriceUSD();
          setTokenPrice(price.toString());

          // Get last update time and update interval
          const lastUpdateTimeValue =
            await presaleContract.lastPriceUpdateTime();
          setLastUpdateTime(lastUpdateTimeValue.toString());

          const updateIntervalValue =
            await presaleContract.PRICE_UPDATE_INTERVAL();
          setUpdateInterval(updateIntervalValue.toString());

          // Check token contract balance
          const contractBalance = await tokenContract?.balanceOf(
            presaleContract.address
          );
          console.log(
            "Contract XDCAI balance:",
            ethers.utils.formatUnits(contractBalance, 18)
          );
        }

        if (tokenContract && !tokenLoading) {
          const symbol = await tokenContract.symbol();
          setTokenSymbol(symbol);

          const decimals = await tokenContract.decimals();
          setTokenDecimals(decimals);
        }

        // Fetch current market prices
        const marketPrices = await fetchCurrentPrices();
        setCurrentMarketPrices(marketPrices);
        setCoinPrices(marketPrices);
      } catch (err) {
        console.error("Error fetching contract info:", err);
        // setError("Error fetching contract information. Please try again.");
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchContractInfo();
  }, [presaleContract, presaleLoading, tokenContract, tokenLoading]);

  // Update next price increase timer
  useEffect(() => {
    if (!lastUpdateTime || !updateInterval) return;

    const intervalId = setInterval(() => {
      const timeLeft = calculateTimeUntilNextUpdate(
        lastUpdateTime,
        updateInterval
      );
      setNextPriceIncrease(timeLeft);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [lastUpdateTime, updateInterval]);

  // Filter coins based on active tab
  useEffect(() => {
    if (activeTab === "ALL") {
      setFilteredCoins(coinData);
    } else {
      setFilteredCoins(coinData.filter((coin) => coin.network === activeTab));
    }
  }, [activeTab]);

  // Generate purchase quote when amount changes
  useEffect(() => {
    // Clear existing quote
    setPurchaseQuote(null);

    if (
      ethAmount &&
      !isNaN(parseFloat(ethAmount)) &&
      parseFloat(ethAmount) > 0
    ) {
      generatePurchaseQuote();
    }
  }, [ethAmount, selectedCurrency]);

  // Generate a purchase quote
  const generatePurchaseQuote = async () => {
    try {
      if (
        !ethAmount ||
        isNaN(parseFloat(ethAmount)) ||
        parseFloat(ethAmount) <= 0
      ) {
        return;
      }

      setIsGeneratingQuote(true);
      const quote = await getPrepurchaseQuote(selectedCurrency, ethAmount);
      setPurchaseQuote(quote);

      // Update XDCAI amount based on the quote
      setXdcaiAmount(quote.totalTokens.toFixed(8));
    } catch (err) {
      console.error("Error generating purchase quote:", err);
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  // Fetch current market prices
  const refreshMarketPrices = async () => {
    try {
      setIsLoadingPrice(true);
      const prices = await fetchCurrentPrices();
      setCurrentMarketPrices(prices);
      setCoinPrices(prices);

      // Regenerate purchase quote with new prices
      if (ethAmount && parseFloat(ethAmount) > 0) {
        await generatePurchaseQuote();
      }
    } catch (err) {
      console.error("Error refreshing market prices:", err);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Check contract token balance
  const checkContractTokenBalance = async () => {
    try {
      if (!presaleContract || !tokenContract) {
        console.log("Contracts not loaded yet");
        return;
      }

      const balance = await tokenContract.balanceOf(presaleContract.address);
      console.log(
        "Contract XDCAI balance:",
        ethers.utils.formatUnits(balance, 18)
      );

      return balance;
    } catch (err) {
      console.error("Error checking token balance:", err);
    }
  };

  // Debug purchase calculation
  const debugPurchaseCalculation = async () => {
    try {
      if (!presaleContract) return;

      // Get the current token price
      const tokenPrice = await presaleContract.tokenPriceUSD();
      console.log(
        "XDCAI price (USD):",
        ethers.utils.formatUnits(tokenPrice, 18)
      );

      // Get native coin price
      const nativeCoinPrice = await presaleContract.tokenPrices(
        ethers.constants.AddressZero
      );
      console.log(
        "Native coin price (USD):",
        ethers.utils.formatUnits(nativeCoinPrice, 18)
      );

      // Manual calculation based on purchase amount
      const purchaseAmount = ethers.utils.parseEther(ethAmount);
      console.log(
        "Purchase amount (XDC):",
        ethers.utils.formatEther(purchaseAmount)
      );

      // Calculate expected tokens
      const paymentValueUSD = purchaseAmount
        .mul(nativeCoinPrice)
        .div(ethers.utils.parseEther("1"));
      console.log(
        "Payment value (USD):",
        ethers.utils.formatUnits(paymentValueUSD, 18)
      );

      const baseTokens = paymentValueUSD
        .mul(ethers.utils.parseEther("1"))
        .div(tokenPrice);
      console.log("Base tokens:", ethers.utils.formatUnits(baseTokens, 18));

      // We can't easily calculate bonus tokens from here, but this gives us a starting point
      console.log(
        "Required contract balance for this purchase (excluding bonus):",
        ethers.utils.formatUnits(baseTokens, 18)
      );
    } catch (err) {
      console.error("Error in debug calculation:", err);
    }
  };

  // Handle input change with decimal validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid decimal up to 8 decimal places
    if (value === "" || /^\d*\.?\d{0,8}$/.test(value)) {
      setEthAmount(value);
    }
  };

  // Handle purchase with price verification
  const handlePurchase = async () => {
    try {
      setError(null);
      setTransactionHash(null);

      // Basic input validation
      if (!ethAmount || parseFloat(ethAmount) <= 0) {
        setError(`Please enter a valid ${selectedCurrency} amount`);
        return;
      }

      if (!address) {
        setError("No connected wallet account found");
        return;
      }

      if (!presaleContract) {
        setError("Contract not loaded. Please try again.");
        return;
      }

      // Verify contract has enough tokens
      const contractBalance = await checkContractTokenBalance();
      if (contractBalance && purchaseQuote) {
        const requiredTokens = ethers.utils.parseUnits(
          purchaseQuote.totalTokens.toString(),
          18
        );

        if (contractBalance.lt(requiredTokens)) {
          setError(
            `Purchase amount too large. Maximum available: ${ethers.utils.formatUnits(
              contractBalance,
              18
            )} tokens`
          );
          return;
        }
      }

      setIsProcessing(true);

      // Show processing toast notification
      const processingToastId = showProcessingTransaction();
      setToastId(processingToastId);

      // For XDC purchases (native token)
      if (selectedCurrency === "XDC") {
        const parsedAmount = ethers.utils.parseEther(ethAmount);

        // Add more detailed logging

        console.log("Calling buyWithNativeCoin...");

        // Use a more explicit transaction approach with better error handling
        try {
          // Create transaction object with explicit gas settings
          const txOptions = {
            value: parsedAmount,
            gasLimit: ethers.utils.hexlify(300000), // Explicit gas limit
          };

          // Send transaction
          const tx = await presaleContract.buyWithNativeCoin(txOptions);
          setTransactionHash(tx.hash);

          // Update toast to show transaction is pending
          updateToast(processingToastId, {
            render: "Transaction submitted, waiting for confirmation...",
          });

          // Wait for confirmation with timeout handling
          console.log("Waiting for transaction confirmation...");
          const receipt = await tx.wait();
          console.log("Transaction confirmed:", receipt);

          if (receipt.status === 1) {
            console.log("Transaction successful");

            const txDetails = {
              amount: ethAmount,
              currency: selectedCurrency,
              tokens: xdcaiAmount,
              hash: tx.hash,
            };

            localStorage.setItem("xdcai_tx_details", JSON.stringify(txDetails));

            // Update the processing toast to success
            showPurchaseSuccess(tx.hash);
            // Success - move to thank you screen
            navigate("/thank-you");
          } else {
            throw new Error(
              "Transaction failed with status: " + receipt.status
            );
          }
        } catch (txError) {
          console.error("Transaction execution error:", txError);

          // Check for specific error types
          if (txError.code === "ACTION_REJECTED") {
            setError("Transaction was rejected by user.");
            handlePurchaseError(new Error("Transaction rejected by user"));
          } else if (txError.code === "INSUFFICIENT_FUNDS") {
            setError("Insufficient funds for gas * price + value.");
            handlePurchaseError(new Error("Insufficient funds"));
          } else if (txError.message && txError.message.includes("gas")) {
            setError(
              "Transaction failed: Gas estimation failed or out of gas. Try increasing gas limit."
            );
            handlePurchaseError(new Error("Gas estimation error"));
          } else {
            setError("Transaction failed. Please check console for details.");
            handlePurchaseError(txError);
          }
        }
      } else {
        // Handle other tokens here
        setError("Only XDC purchases are supported for testing on Apothem");
        handlePurchaseError(new Error("Only XDC purchases are supported"));
      }
    } catch (err) {
      console.error("Purchase error:", err);
      // Use our toast handler to display friendly error
      handlePurchaseError(err);
      // Set a simpler error message in the UI
      setError("Transaction failed. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Get logo URL for a currency
  const getCurrencyLogo = (symbol) => {
    switch (symbol) {
      case "ETH":
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzYyN0VFQSIvPjxnIGZpbGw9IiNGRkYiIGZpbGwtcnVsZT0ibm9uemVybyI+PHBhdGggZmlsbC1vcGFjaXR5PSIuNjAyIiBkPSJNMTYuNDk4IDR2OS4xMDNMOCA1VjE2LjQ5OHoiLz48cGF0aCBkPSJNMTYuNDk4IDRMMjUgMTYuNDk4TDE2LjQ5OCAxMy4xMDNWNHoiLz48cGF0aCBmaWxsLW9wYWNpdHk9Ii42MDIiIGQ9Ik0xNi40OTggMjEuOTc2djYuMDIxTDggMTZsMTYuNDk4IDguMjV2LTIuMjc0TDE2LjQ5OCAyMS45NzZ6Ii8+PHBhdGggZD0iTTE2LjQ5OCAyNy45OTVWMjEuOTc2TDI1IDE2TDE2LjQ5OCAyNy45OTV6Ii8+PHBhdGggZmlsbC1vcGFjaXR5PSIuMiIgZD0iTTE2LjQ5OCAyMC41NzNMMjQuODk1IDE2LjE5TDE2LjQ5OCAxMy4xMDR2Ny40N3oiLz48cGF0aCBmaWxsLW9wYWNpdHk9Ii42MDIiIGQ9Ik04IDEhNi4xOWw4LjQ5OCA3LjQ3VjEzLjFMOCAxNi4xOTB6Ii8+PC9nPjwvZz48L3N2Zz4=";
      case "BNB":
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0JBMkYiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTIuMTE2IDE0LjQwNEwxNiAxMC41MmwzLjg4NiAzLjg4NiAyLjI2IDIuMjZMMTYgMjIuNzg0bC02LjE0NC02LjE0NCAxLjE0NC0xLjE0NCAxLjExNi0xLjA5MnpNOS4wNzYgMTYuNDY0bDEuMTQ0LTEuMTQgNS43OCA1Ljc3OC01Ljc4IDUuNzgtMS4xNDQtMS4xNDRMMTMuNzA4IDIxbC00LjYzMi00LjUzNnptMTMuODQ4IDBsLTEuMTQ0IDEuMTQ0TDE3LjE0OCAyMWw0LjYzMiA0LjYzNiAxLjE0NC0xLjE0NC01Ljc4LTUuNzggNS43OC01Ljc3OHpNMTYgOEw4IDE2bDEuMTQ0IDEuMTQ0TDE2IDEwLjI4OGw2Ljg1NiA2Ljg1NkwyNCAuNnoiLz48L2c+PC9zdmc+";
      case "SOL":
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2ODBBNCI+PC9jaXJjbGU+PHBhdGggZD0iTTkuOTQgMjAuMTg4YzEuMjM1IDAgNC40MSAwIDUuNTI5IDBhLjQxLjQxIDAgMSAwIDAtLjgyMWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIxaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTAuNzZhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNWMxLjIzNSAwIDIuODc2LTEuMjMzIDMuNjk0LTIuMDVsLjIwNy0uMjA4Yy4yMjktLjIyOC42LTYuNDEyLjYtOC4wMzhNMjIuMDU4IDEyLjYzNWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIyaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTYuMjlhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNGMxLjIzNiAwIDIuODc3LTEuMjMyIDMuNjk1LTIuMDUiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNMjIuMDU4IDE5LjM2NmEuNDEuNDEgMCAwIDEgMCAuODIyaC01LjUzYS40MS40MSAwIDAgMCAwIC44MjFoNi4zNTJhLjQxLjQxIDAgMSAxIDAgLjgyMkgxNi4yOWEuNDEuNDEgMCAwIDAgMCAuODIxaDQuNzA0YzEuMjM2IDAgMi44NzcgMS4yMzMgMy42OTUgMi4wNWwuMjA3LjIwN2MuMjI5LjIyOS42IDYuNDEzLjYgOC4wMzgiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNOS45NCAyMy41MTFoNS41MjlhLjQxLjQxIDAgMSAxIDAgLjgyMmgtNi4zNTJhLjQxLjQxIDAgMCAwIDAgLjgyMWg1LjU4OWEuNDEuNDEgMCAwIDEgMCAuODIxSDkuOTRjLTEuMjM2IDAtMi44NzcgMS4yMzMtMy42OTQgMi4wNSIgZmlsbD0iI0ZGRiI+PC9wYXRoPjwvZz48L3N2Zz4=";
      case "USDT":
      case "USDT-BNB":
      case "USDT-SOL":
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzI2QTE3QiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0xNy45MjIgMTcuMzgzdi0uMDAyYy0uMTEuMDA4LS42NzcuMDQyLTEuOTQyLjA0Mi0xLjAxIDAtMS43MjEtLjAzLTEuOTcxLS4wNDJ2LjAwM2MtMy44ODgtLjE3MS02Ljc5LS44NDgtNi43OS0xLjY1OCAwLS44MDkgMi45MDItMS40ODYgNi43OS0xLjY2di0yLjEyYzEuMjYuMDEzIDEuOTcuMDQ0IDEuOTguMDQ0bC4wMDMtLjAwMmMuMDEgMCAuNzE3LS4wMzEgMS45NjEtLjA0NHYyLjEyMmMzLjg4OC4xNzMgNi43OS44NSA2Ljc5IDEuNjU5IDAgLjgxLTIuOTAyIDEuNDg2LTYuNzkgMS42NTdtMC0zLjk2NnYtLjAwMWMtLjEyOS4wMS0uNzI0LjA0NC0xLjk0Mi4wNDQtMS4wMTggMC0xLjc2NS0uMDMtMS45NzEtLjA0M3YuMDAxYy00LjkxNC0uMTcxLTguNTgtLjk4LTguNTgtMS44NTVzMy42NjYtMS42ODQgOC41OC0xLjg1NnYuMDAxYzEuMjQ1LjAyIDEuOTg4LjA0NyAxLjk4OC4wNDcuMDExIDAgLjcxNy0uMDMgMS45NDQtLjA0OHYtLjAwMWM0LjkxNS4xNzIgOC41OC45OCA4LjU4IDEuODU2cy0zLjY2NSAxLjY4NC04LjU4IDEuODU1bS0xLjk1MSA1LjI3NHYzLjU3MmMtLjAwMSAwLS43MS4wMzctMS45NjMuMDM3LTEuMDI1IDAtMS43MzQtLjAzLTEuOTg4LS4wMzd2LTMuNTcyYy4yNTQuMDA4Ljk2Mi4wMzcgMS45ODguMDM3IDEuMjUxIDAgMS45Ni0uMDM3IDEuOTYzLS4wMzciLz48L2c+PC9zdmc+";
      case "USDC":
      case "USDC-BNB":
      case "USDC-SOL":
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzJDNzVDQSIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0xNS45OTEgMjZDMTEuMDMgMjYgNi45OTggMjEuOTcgNi45OTggMTcuMDExYzAtNC45NTggNC4wMzMtOC45OSA4Ljk5My04Ljk5IDQuOTU4IDAgOC45OTEgNC4wMzMgOC45OTEgOC45OSAwIDQuOTU5LTQuMDMzIDguOTg5LTguOTkgOC45ODl6bTQuNDQ1LTUuMzAzYS43MTMuNzEzIDAgMCAwLS43MTIuNzEuNzEzLjcxMyAwIDAgMCAxLjQyNC4wMDEuNzEuNzEgMCAwIDAtLjcxMi0uNzExem0wLTIuODVhLjc5NC43OTQgMCAwIDAgLjc5MS0uNzkxLjc5Ni43OTYgMCAwIDAtLjc5MS0uNzkzLjc5NS43OTUgMCAwIDAtLjc5Mi43OTMuNzk0Ljc5NCAwIDAgMCAuNzkyLjc5em0tOC44MjEgMi44NWEuNzExLjcxMSAwIDEgMC0uMDAxIDEuNDIyLjcxMi43MTIgMCAwIDAgLjcxMi0uNzEuNzEzLjcxMyAwIDAgMC0uNzExLS43MTJ6bTAtMi44NWEuNzkyLjc5MiAwIDEgMCAwIDEuNTgzLjc5Mi43OTIgMCAwIDAgMC0xLjU4MnptOC44MTUtMi4wNjJjLS40NzMgMC0uNzQyLS41MDYtLjQyOS0uODQyYTYuMjI1IDYuMjI1IDAgMCAwIDEuNzcyLTQuMzM1IDYuMjMgNi4yMyAwIDAgMC0xLjc1NS00LjMxM2MtLjMyNS0uMzQ0LS4wNTEtLjg5NS40NTQtLjg5NS41MDYgMCAuNzA3LjU1NC4zODkuODk0YTYuMjMxIDYuMjMxIDAgMCAwLTEuNzcxIDQuMzE0IDYuMjI3IDYuMjI3IDAgMCAwIDEuNzU0IDQuMzM2Yy4zMjMuMzQzLjA0Ni44NDEtLjQxNC44NDF6bS0xLjk0NS4wMDRjLS40NyAwLS43MjctLjQ3Ni0uNDE0LTguMzQuMDcyLS4wNzguMTU2LS4xNTcuMjQyLS4yMzkuMzQ3LS4zMjUuODU2LS4wNDguODU2LjQ0NHYuMDAyYzAgLjUwNy0uNTU2LjcwNS0uODg5LjM4Ni0uMDY5LS4wNjYtLjE0Mi0uMTM1LS4yMTktLjIwNmEzLjcxIDMuNzEgMCAwIDAtMS4wMzEtMi41NzFjLS43ODMtLjc4NC0xLjgxNC0xLjIxNi0yLjkxNi0xLjIxNmgtLjAxNWMtMS4xMDYuMDAzLTIuMTM5LjQzOC0yLjkyMSAxLjIyM2EzLjcxNiAzLjcxNiAwIDAgMC0xLjAyNSAyLjU3MnYuMDAzYTMuNzEzIDMuNzEzIDAgMCAwIDEuMDI0IDIuNTcxIDMuNzMgMy43MyAwIDAgMCAyLjkyMiAxLjIyM2guM3YtLjAwNGMwLS41MDYuNTU2LS43MDQuODktLjM4NS4wNjguMDY1LjE0Mi4xMzQuMjE4LjIwNS4zNDcuMzI0LjA0OS44My0uNDEuODNINy41OWMtLjQ3IDAtLjczLS40NS0uNDEyLS44MTkuMDg2LS4xLjE4MS0uMjA3LjI4NS0uMzE4LjMyLS4zMzcuODk2LS4wNjEuOS4zODcuMDUxLS4wNC4xMDMtLjA4LjE1Ni0uMTJhNi4xMzggNi4xMzggMCAwIDAgMS43MTUtNC4yMjcgNi4xNDQgNi4xNDQgMCAwIDAtMS43MDEtNC4yMDZ2LS4wMDJhNi4xNjYgNi4xNjYgMCAwIDAtNC4zNDItMS44MDNoLS4wMmE2LjE2NyA2LjE2NyAwIDAgMC00LjM1MyAxLjgwM2gtLjAwMUE2LjE0ODYuMTQ4IDAgMCAwIC4wODMgMTdoLjAwMWE2LjE0MiA2LjE0MiAwIDAgMCAxLjcxNCA0LjIzYy4wNTUuMDQ1LjExLjA4NC4xNjMuMTI0LjAxLjQzOC41OC42OTQuODg2LjM3OC4xLS4xMDQuMTk2LS4yMTEuMjg2LS4zMjMuMzEzLS4zNjQuMDQ5LS44MDktLjQxOS0uODA5LS40NzQgMC0uNzQuNTA3LS40MzEuODQuNjI0LjY3MiAxLjI5IDEuMjM4IDIuMTEgMS42MzlhNy4zMDUgNy4zMDUgMCAwIDAgMi45MS43MjdjMS4wMyAwIDEuOTgtLjI1MSAyLjkxLS43MjdhNy4zMDcgNy4zMDcgMCAwIDAgMi4xMS0xLjY0Yy4zMS0uMzMxLjA0NC0uODM4LS40My0uODM4eiIvPjwvZz48L3N2Zz4=";
      case "XDC":
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNjQgNjQiPjxkZWZzPjxzdHlsZT4uYXtmaWxsOiMxZDFkMWQ7fS5ie2ZpbGw6IzEwMGYwZDt9LmN7ZmlsbDp1cmwoI2EpO30uZHtmaWxsOnVybCgjYik7fS5le2ZpbGw6dXJsKCNjKTt9LmZ7ZmlsbDp1cmwoI2QpO308L3N0eWxlPjxsaW5lYXJHcmFkaWVudCBpZD0iYSIgeDE9IjQ4IiB5MT0iMTYiIHgyPSI0OCIgeTI9IjQ4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMmI3ZmUyIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMTQzYzdlIi8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIxNiIgeTE9IjE2IiB4Mj0iMTYiIHkyPSI0OCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzViYTRmYyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzI3NTRlMiIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjIiB4MT0iMTYiIHkxPSIzMiIgeDI9IjQ4IiB5Mj0iMzIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxMDZmZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwMDM2YjciLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iZCIgeDE9IjE2IiB5MT0iMzIiIHgyPSI0OCIgeTI9IjMyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMWQ5MGZmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMDA0NWU4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHRpdGxlPnhpbmZpbjwvdGl0bGU+PHBhdGggY2xhc3M9ImEiIGQ9Ik0zMiw1OGEyNiwyNiwwLDEsMSwxOC4zODQtNy42MTZBMjUuODU3LDI1Ljg1NywwLDAsMSwzMiw1OFoiLz48cGF0aCBjbGFzcz0iYiIgZD0iTTMyLDhBMjQsMjQsMCwxLDEsOCwzMiwyNC4wMjcsMjQuMDI3LDAsMCwxLDMyLDhtMC00QTI4LDI4LDAsMSwwLDYwLDMyLDI4LDI4LDAsMCwwLDMyLDRaIi8+PHBhdGggY2xhc3M9ImMiIGQ9Ik00OCw0OEgzMlYzMmgxNlYxNmgxNlY0OFoiLz48cGF0aCBjbGFzcz0iZCIgZD0iTTMyLDQ4SDE2VjMyaDEyaDB2MTZaIi8+PC9zdmc+";
      default:
        return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNDNEM0QzQiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTYgN2E5IDkgMCAxIDAgMCAxOCA5IDkgMCAwIDAgMC0xOHptMS40OTggMTMuMDc4aC0zdi0zLjA1OWgzdjMuMDZ6bTAtNC4zNzVoLTN2LTQuNzAzaDN2NC43MDN6Ii8+PC9nPjwvc3ZnPg==";
    }
  };

  // Handle disconnect with correct screen change
  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Only change screen after disconnect is complete
      navigate("/connect");
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  // Check connection status - redirect to connect screen if disconnected
  useEffect(() => {
    if (!isConnected) {
      navigate("/connect");
    }
  }, [isConnected]);

  const calculateBonus = (amount, coinPrice) => {
    if (!amount || !coinPrice) return 0;

    // Calculate USD value
    const usdValue = parseFloat(amount) * coinPrice;

    // Apply bonus tiers
    if (usdValue > 5000) return 10; // 10% for >$5000
    if (usdValue > 2000) return 4; // 4% for >$2000 and ≤$5000
    if (usdValue >= 1000) return 2; // 2% for ≥$1000 and ≤$2000
    return 0; // 0% for <$1000
  };

  return (
    <div
      className="purchase-screen"
      style={{ maxWidth: "600px", margin: "0 auto" }}
    >
      {showCurrencySelection ? (
        <div className="currency-selection">
          <h2>Select a currency</h2>

          <div className="currency-tabs">
            <button
              className={`currency-tab ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              ALL
            </button>
            <button
              className={`currency-tab ${activeTab === "ETH" ? "active" : ""}`}
              onClick={() => setActiveTab("ETH")}
            >
              <img
                src={getCurrencyLogo("ETH")}
                alt="ETH"
                style={{ width: "16px", height: "16px", marginRight: "4px" }}
              />{" "}
              ETH
            </button>
            <button
              className={`currency-tab ${activeTab === "BSC" ? "active" : ""}`}
              onClick={() => setActiveTab("BSC")}
            >
              <img
                src={getCurrencyLogo("BNB")}
                alt="BSC"
                style={{ width: "16px", height: "16px", marginRight: "4px" }}
              />{" "}
              BSC
            </button>
            <button
              className={`currency-tab ${activeTab === "XDC" ? "active" : ""}`}
              onClick={() => setActiveTab("XDC")}
            >
              <img
                src={getCurrencyLogo("XDC")}
                alt="XDC"
                style={{ width: "16px", height: "16px", marginRight: "4px" }}
              />{" "}
              XDC
            </button>
          </div>

          <div className="currency-list">
            {filteredCoins.map((coin) => (
              <div
                key={coin.symbol}
                className="currency-item"
                onClick={() => handleCurrencySelect(coin.symbol)}
              >
                <div className="currency-icon-wrapper">
                  <img
                    src={getCurrencyLogo(coin.symbol)}
                    alt={coin.symbol}
                    style={{ width: "32px", height: "32px" }}
                  />
                </div>
                <div className="currency-info">
                  <div className="currency-name">{coin.name}</div>
                  <div className="currency-symbol">{coin.symbol}</div>
                </div>
                <div className="currency-balance">
                  <div className="currency-value">
                    ~${coin.value.toFixed(3)}
                  </div>
                  <div className="currency-amount">{coin.balance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Account Information Section */}
          <div
            style={{
              marginBottom: "20px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "10px",
              padding: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#90EE90",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "10px",
                  fontSize: "16px",
                  color: "#1a1a1a",
                  fontWeight: "bold",
                }}
              >
                {displayAddress.charAt(0)}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {displayAddress}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#90EE90",
                  }}
                >
                  Connected
                </div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #ff4c4c",
                borderRadius: "6px",
                color: "#ff4c4c",
                padding: "6px 10px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Disconnect
            </button>
          </div>

          {/* Header section */}
          <div className="presale-header">
            <p
              style={{
                textAlign: "right",
                margin: "10px 0",
                fontSize: "16px",
                color: "#ccc",
              }}
            >
              Can't find tokens in your wallet?
            </p>
            <h2
              style={{
                textAlign: "center",
                margin: "15px 0",
                fontSize: "24px",
                lineHeight: "1.3",
              }}
            >
              Take advantage of Huge Early Staking Rewards by becoming an early
              adopter!
            </h2>
            <div
              style={{
                textAlign: "center",
                color: "#90EE90",
                fontSize: "38px",
                fontWeight: "bold",
                margin: "25px 0",
                lineHeight: "1.2",
              }}
            >
              BUY ${tokenSymbol} PRESALE NOW!
            </div>
          </div>

          {/* Dynamic Price Display Area */}
          <div
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#3a4a4a",
              borderRadius: "10px",
              marginBottom: "20px",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            >
              Current Price:{" "}
              {isLoadingPrice ? "Loading..." : formatTokenPrice(tokenPrice)}
            </div>

            <div style={{ fontSize: "14px", color: "#ddd" }}>
              Next price increase in: {nextPriceIncrease.days}d{" "}
              {nextPriceIncrease.hours}h {nextPriceIncrease.minutes}m{" "}
              {nextPriceIncrease.seconds}s
            </div>
          </div>

          {/* Payment section */}
          <div style={{ padding: "0 5px" }}>
            {/* Pay with crypto field */}
            <div style={{ marginBottom: "25px" }}>
              <p
                style={{
                  textAlign: "left",
                  margin: "5px 0",
                  fontSize: "16px",
                  color: "#ccc",
                }}
              >
                Pay with {selectedCurrency}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  value={ethAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  style={{
                    flex: "1",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    padding: "15px",
                    fontSize: "20px",
                    color: "white",
                    height: "55px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={() => setShowCurrencySelection(true)}
                  style={{
                    width: "120px",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    padding: "0 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    cursor: "pointer",
                    height: "55px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "#627EEA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "8px",
                    }}
                  >
                    <img
                      src={getCurrencyLogo(selectedCurrency)}
                      alt={selectedCurrency}
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {selectedCurrency}
                  </span>
                  <span style={{ marginLeft: "8px" }}>▼</span>
                </button>
              </div>
            </div>

            {/* Receive XDCAI field */}
            <div style={{ marginBottom: "5px" }}>
              <p
                style={{
                  textAlign: "left",
                  margin: "5px 0",
                  fontSize: "16px",
                  color: "#ccc",
                }}
              >
                Receive ${tokenSymbol}
              </p>
              <input
                type="text"
                value={xdcaiAmount}
                readOnly
                placeholder="0"
                style={{
                  width: "100%",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "15px",
                  fontSize: "20px",
                  color: "white",
                  height: "55px",
                  boxSizing: "border-box",
                  marginBottom: "5px",
                }}
              />
              <p
                style={{
                  textAlign: "right",
                  margin: "5px 0 20px 0",
                  fontSize: "14px",
                  color: "#aaa",
                }}
              >
                1 ${tokenSymbol} ={" "}
                {isLoadingPrice ? "Loading..." : formatTokenPrice(tokenPrice)}
              </p>
            </div>

            {/* Network info display */}
            <div
              style={{
                textAlign: "center",
                color: "#aaa",
                backgroundColor: "rgba(30, 30, 30, 0.7)",
                padding: "10px",
                borderRadius: "5px",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              {currentChainId &&
                `Connected to ${
                  currentChainId === 1
                    ? "Ethereum"
                    : currentChainId === 56
                    ? "Binance Smart Chain"
                    : currentChainId === 50
                    ? "XDC Network"
                    : currentChainId === 51
                    ? "XDC Apothem Testnet"
                    : `Chain ID: ${currentChainId}`
                }`}
            </div>

            {/* Bonus tokens info */}
            <div
              style={{
                textAlign: "center",
                color: "#aaa",
                backgroundColor: "rgba(30, 30, 30, 0.7)",
                padding: "10px",
                borderRadius: "5px",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              <p style={{ margin: 0, color: "#90EE90", fontWeight: "bold" }}>
                Bonus Tokens
              </p>
              <p style={{ margin: "5px 0 0 0" }}>
                2% bonus for purchases ≥ $1,000
                <br />
                4% bonus for purchases {">"} $2,000
                <br />
                10% bonus for purchases {">"} $5,000
              </p>
            </div>
            <div className="bonus-display">
              <p>
                Current bonus:{" "}
                {calculateBonus(ethAmount, coinPrices[selectedCurrency])}%
              </p>
            </div>

            {/* Error message - displayed only if there's an error */}
            {error && (
              <div
                style={{
                  textAlign: "center",
                  color: "#ff6b6b",
                  backgroundColor: "rgba(100, 0, 0, 0.2)",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "25px",
                }}
              >
                {error}
              </div>
            )}

            {/* Transaction status indicators */}
            {isProcessing && (
              <div
                style={{
                  textAlign: "center",
                  color: "#90EE90",
                  backgroundColor: "rgba(0, 100, 0, 0.2)",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "25px",
                }}
              >
                Transaction submitted, waiting for confirmation...
              </div>
            )}

            {/* Transaction hash display */}
            {transactionHash && (
              <div
                style={{
                  textAlign: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "25px",
                  wordBreak: "break-all",
                }}
              >
                <p style={{ color: "white", marginBottom: "5px" }}>
                  Transaction Hash:
                </p>
                <p style={{ color: "#90EE90", fontSize: "14px" }}>
                  {transactionHash}
                </p>
              </div>
            )}

            {/* Buy button */}
            <button
              onClick={handlePurchase}
              disabled={isProcessing || isLoadingPrice}
              style={{
                width: "100%",
                backgroundColor:
                  isProcessing || isLoadingPrice ? "#5a8f5a" : "#90EE90",
                border: "none",
                borderRadius: "8px",
                padding: "17px",
                fontSize: "20px",
                fontWeight: "bold",
                color: "black",
                cursor:
                  isProcessing || isLoadingPrice ? "not-allowed" : "pointer",
                marginBottom: "15px",
                height: "60px",
              }}
            >
              {isProcessing
                ? "PROCESSING..."
                : isLoadingPrice
                ? "LOADING..."
                : `BUY ${tokenSymbol}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PurchaseScreen;
