// File: frontend/src/components/PurchaseScreen.jsx
// src/components/PurchaseScreen.jsx
import React, { useState, useEffect, useMemo } from "react";
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

import {
  registerTransactionIntent,
  storeIntentId,
  getStoredIntentId,
  getIntentStatus,
  clearStoredIntentId,
} from "../services/transactionIntentService";
import { showWarning } from "../utils/toastHandler";

import * as Icons from "./icons/CryptoIcons";
import BridgeIcon from "./icons/BridgeIcon";

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

  const [activeTab, setActiveTab] = useState("ALL");
  const [coinPrices, setCoinPrices] = useState({});

  //payment intent
  const [intentId, setIntentId] = useState(null);
  const [intentExpiry, setIntentExpiry] = useState(null);
  const [intentTimeRemaining, setIntentTimeRemaining] = useState(null);
  const [intentStatus, setIntentStatus] = useState(null);

  const dummyCoinData = [
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

  // Format the address to show as 0x123...abc
  const displayAddress = formatAddress(address);

  //interval price check
  // useEffect(() => {
  //  const intervalPriceRefresh = setInterval(() => {
  //   refreshMarketPrices()
  //  }, 1000 * 60) //every 1 minute
  // },[])

  //check for existing intent on component mount
  useEffect(() => {
    const storedIntentId = getStoredIntentId();
    if (storedIntentId) {
      setIntentId(storedIntentId);
      // Check the status of the stored intent
      checkIntentStatus(storedIntentId);
    }
  }, []);

  // useEffect to handle the countdown timer for intent expiration
  useEffect(() => {
    if (!intentExpiry) return;

    const countdownInterval = setInterval(() => {
      const now = new Date();
      const expiryTime = new Date(intentExpiry);
      const timeRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000)); // in seconds

      setIntentTimeRemaining(timeRemaining);

      if (timeRemaining <= 0) {
        clearInterval(countdownInterval);
        setIntentStatus("EXPIRED");
        clearStoredIntentId();
        setIntentId(null);
        showWarning("Transaction time window expired. Please try again.");
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [intentExpiry]);

  const [filteredCoins, setFilteredCoins] = useState([]);

  //update coin data
  const coinData = useMemo(() => {
    if (coinPrices) {
      const updatedCoinData = dummyCoinData.map((coin) => {
        // Handle multi-network tokens
        const priceKey = coin.symbol.includes("-")
          ? coin.symbol.split("-")[0]
          : coin.symbol;

        // Get the price from coinPrices, default to 0 if not found
        const currentPrice = coinPrices[priceKey] || 0;

        return {
          ...coin,
          value: currentPrice, // Calculate current value
        };
      });

      setFilteredCoins(updatedCoinData);

      return updatedCoinData;
    }
  }, [coinPrices]);

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
          // console.log(
          //   "Contract XDCAI balance:",
          //   ethers.utils.formatUnits(contractBalance, 18)
          // );
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
      const tokenPriceInUsd = parseFloat(formatTokenAmount(tokenPrice));
      //
      const quote = await getPrepurchaseQuote({
        symbol: selectedCurrency,
        amount: ethAmount,
        xdcaiPrice: tokenPriceInUsd,
      });
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

  const checkIntentStatus = async (id) => {
    try {
      const result = await getIntentStatus(id);
      setIntentStatus(result.status);
      setIntentExpiry(result.expiresAt);

      // If the intent is already expired or verified, clear it
      if (result.status === "EXPIRED") {
        clearStoredIntentId();
        setIntentId(null);
        showWarning(
          "Previous transaction time window expired. Please try again."
        );
      } else if (result.status === "VERIFIED") {
        // Intent was verified, show success message
        showSuccess("Your transaction was verified successfully!");
      }
    } catch (error) {
      console.error("Error checking intent status:", error);
      // Clear invalid intent
      clearStoredIntentId();
      setIntentId(null);
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

      try {
        const intentResult = await registerTransactionIntent({
          walletAddress: address,
          expectedAmount: ethAmount,
          paymentCurrency: selectedCurrency,
          expectedChain: getCurrentChainIdentifier(), // Function to determine current chain
        });

        // Store the intent ID and update state
        setIntentId(intentResult.intentId);
        setIntentStatus("PENDING");
        setIntentExpiry(intentResult.expiresAt);
        storeIntentId(intentResult.intentId);

        // Show toast with time window
        showInfo(
          `You have ${intentResult.timeWindowMinutes} minutes to complete this transaction`
        );
      } catch (intentError) {
        console.error("Error registering transaction intent:", intentError);
        setError("Failed to register transaction intent. Please try again.");
        return;
      }

      // Verify contract has enough XDCAI tokens
      const contractBalance = await checkContractTokenBalance();
      if (contractBalance && purchaseQuote) {
        const requiredTokens = ethers.utils.parseUnits(
          purchaseQuote.totalTokens.toString(),
          18
        );

        if (
          Number(ethers.utils.formatUnits(contractBalance, 18)) <
          Number(ethers.utils.formatUnits(requiredTokens, 18))
        ) {
          setError(`Purchase amount too large.`);
          return;
        }
      }

      // Processing begins
      setIsProcessing(true);
      const processingToastId = showProcessingTransaction();
      setToastId(processingToastId);

      let tx;
      let receipt;

      // Determine if selected currency is native token or ERC20
      const isNativeToken = selectedCurrency === "XDC";
      const isErc20Token = ["USDT", "USDC"].includes(selectedCurrency);

      if (!isNativeToken && !isErc20Token) {
        setError(`${selectedCurrency} is not supported yet.`);
        setIsProcessing(false);
        return;
      }

      try {
        // HANDLE NATIVE TOKEN (XDC)
        if (isNativeToken) {
          // Process native token payment (XDC)
          tx = await processNativeTokenPayment(ethAmount);
        }
        // HANDLE ERC20 TOKENS (USDT, USDC)
        else if (isErc20Token) {
          // Process ERC20 token payment
          tx = await processErc20TokenPayment(
            selectedCurrency,
            ethAmount,
            processingToastId
          );
        }

        if (!tx) throw new Error("Transaction failed to initiate");

        // Set transaction hash for UI display
        setTransactionHash(tx.hash);

        // Update toast to show waiting for confirmation
        updateToast(processingToastId, {
          render: "Transaction submitted, waiting for confirmation...",
        });

        // Wait for transaction confirmation
        console.log("Waiting for transaction confirmation...");
        receipt = await tx.wait();

        // Check transaction success
        if (receipt.status === 1) {
          console.log("Transaction successful:", receipt);

          const usdValue = parseFloat(ethAmount) * coinPrices[selectedCurrency];

          // Store transaction details for thank you page
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
            hash: tx.hash || "",
            usdValue,
          };

          localStorage.setItem("xdcai_tx_details", JSON.stringify(txDetails));

          // Show success notification
          showPurchaseSuccess(tx.hash);

          // Navigate to thank you page
          navigate("/thank-you");
        } else {
          throw new Error("Transaction failed with status: " + receipt.status);
        }
      } catch (txError) {
        console.error("Transaction error:", txError);
        handleTransactionError(txError);
      }
    } catch (err) {
      console.error("Purchase error:", err);
      handlePurchaseError(err);
      setError("Transaction failed. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentChainIdentifier = () => {
    // Map Wagmi chainId to our backend chain identifiers
    switch (currentChainId) {
      case 1: // Ethereum Mainnet
      case 5: // Goerli
      case 11155111: // Sepolia
        return "ethereum";
      case 56: // BSC Mainnet
      case 97: // BSC Testnet
        return "bsc";
      case 50: // XDC Mainnet
      case 51: // XDC Testnet (Apothem)
        return "xdc";
      // Add Solana mapping if needed
      default:
        return "xdc"; // Default to XDC
    }
  };

  // Helper function to process native token payment (XDC)
  const processNativeTokenPayment = async (amount) => {
    console.log("Processing native XDC payment...");

    // Parse amount to Wei (18 decimals for XDC)
    const parsedAmount = ethers.utils.parseUnits(amount, 18);

    // Create transaction options
    const txOptions = {
      value: parsedAmount,
      gasLimit: ethers.utils.hexlify(BigInt(300000)),
    };

    // Send transaction
    return await presaleContract.buyWithNativeCoin(txOptions);
  };

  // Helper function to process ERC20 token payment (USDT, USDC)
  const processErc20TokenPayment = async (tokenSymbol, amount, toastId) => {
    console.log(`Processing ${tokenSymbol} payment...`);

    // Get the appropriate contract based on token symbol
    let tokenContract;
    if (tokenSymbol === "USDT") {
      tokenContract = usdtContractRef.current;
    } else if (tokenSymbol === "USDC") {
      tokenContract = usdcContractRef.current;
    }

    if (!tokenContract) {
      throw new Error(`${tokenSymbol} contract not initialized`);
    }

    // Get token decimals
    const decimals = await tokenContract.decimals();
    console.log(`${tokenSymbol} decimals:`, decimals);

    // Parse amount (typically 6 decimals for USDT/USDC)
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);

    // Step 1: Approve tokens
    console.log(`Approving ${tokenSymbol} tokens...`);
    updateToast(toastId, {
      render: `Approving ${tokenSymbol} transfer, please confirm in your wallet...`,
    });

    // Send approval transaction
    const approveTx = await tokenContract.approve(
      presaleContract.address,
      parsedAmount
    );
    const approveReceipt = await approveTx.wait();

    if (approveReceipt.status !== 1) {
      throw new Error(`${tokenSymbol} approval failed`);
    }

    // Step 2: Execute purchase with approved tokens
    console.log(`${tokenSymbol} approval successful, executing purchase...`);
    updateToast(toastId, {
      render: `${tokenSymbol} approved, now processing purchase transaction...`,
    });

    // Send purchase transaction
    return await presaleContract.buyWithToken(
      tokenContract.address,
      parsedAmount,
      { gasLimit: ethers.toHexString(BigInt(300000)) }
    );
  };

  // Helper function to handle transaction errors
  const handleTransactionError = (error) => {
    // Detect common error types
    if (error.code === "ACTION_REJECTED") {
      setError("Transaction was rejected by user.");
      handlePurchaseError(new Error("Transaction rejected by user"));
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      setError("Insufficient funds for transaction.");
      handlePurchaseError(new Error("Insufficient funds"));
    } else if (error.message?.includes("user rejected")) {
      setError("Transaction was rejected by user.");
      handlePurchaseError(new Error("Transaction rejected by user"));
    } else if (error.message?.includes("gas")) {
      setError("Transaction failed: Gas estimation failed or out of gas.");
      handlePurchaseError(new Error("Gas estimation error"));
    } else if (error.message?.includes("approve")) {
      setError("Token approval failed. Please try again.");
      handlePurchaseError(new Error("Token approval failed"));
    } else {
      setError("Transaction failed. Please check console for details.");
      handlePurchaseError(error);
    }
  };

  // Get logo URL for a currency
  const getCurrencyLogo = (symbol) => {
    if (svgIconToSymbolMatcher[symbol]) return svgIconToSymbolMatcher[symbol];
  };

  const svgIconToSymbolMatcher = {
    ETH: <Icons.EthereumIcon />,
    BNB: (
      <div className="scale-[2] ml-2">
        <Icons.BinanceIcon />
      </div>
    ),
    SOL: (
      <div className="scale-[1.8] ml-2">
        <Icons.SolanaIcon />
      </div>
    ),
    USDT: (
      <div className="scale-[2] ml-2">
        <Icons.TetherIcon />
      </div>
    ),
    "USDT-BNB": (
      <BridgeIcon Icon1={Icons.TetherIcon} Icon2={Icons.BinanceIcon} />
    ),
    "USDT-SOL": (
      <BridgeIcon Icon1={Icons.TetherIcon} Icon2={Icons.SolanaIcon} />
    ),
    USDC: (
      <div className="scale-[2] ml-2">
        <Icons.USDCIcon />
      </div>
    ),
    "USDC-BNB": <BridgeIcon Icon1={Icons.USDCIcon} Icon2={Icons.BinanceIcon} />,
    "USDC-SOL": <BridgeIcon Icon1={Icons.USDCIcon} Icon2={Icons.SolanaIcon} />,
    XDC: <Icons.XDCIcon />,
  };

  const bridgeIcon = (Icon1, Icon2) => {};

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

    // Determine bonus percentage
    let bonusPercent;
    if (usdValue > 5000) bonusPercent = 10;
    // 10% for >$5000
    else if (usdValue > 2000) bonusPercent = 4;
    // 4% for >$2000 and ≤$5000
    else if (usdValue >= 1000) bonusPercent = 2;
    // 2% for ≥$1000 and ≤$2000
    else bonusPercent = 0; // 0% for <$1000

    // Calculate base XDCAI tokens (without bonus)
    // We need to convert USD value to XDCAI tokens using the token price
    const tokenPriceInUsd = parseFloat(formatTokenAmount(tokenPrice));
    const baseTokens = usdValue / tokenPriceInUsd;

    // Calculate bonus tokens (same as contract does)
    const bonusTokens = (baseTokens * bonusPercent) / 100;

    return bonusTokens;
  };

  const bonusAmount = React.useMemo(() => {
    if (!ethAmount || !coinPrices[selectedCurrency]) return 0;
    return calculateBonus(ethAmount, coinPrices[selectedCurrency]);
  }, [ethAmount, coinPrices[selectedCurrency]]);

  const renderPageMain = () => {
    if (showCurrencySelection) {
      return (
        <div className="currency-selection">
          <h2 className="text-lg text-white font-medium mb-4">
            Select a currency
          </h2>

          {/* Tabs */}
          <div className="flex mb-4 overflow-x-auto scrollbar-hide h-[50px] space-x-2 px-2">
            <button
              className={`flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-[#00FF7F] text-white"
                  : "bg-[#1A1A1A] text-[#d2d2d2]"
              } rounded-md`}
              onClick={() => setActiveTab("ALL")}
            >
              ALL
            </button>
            <button
              className={`flex-shrink-0 px-4 py-2 text-sm flex items-center whitespace-nowrap ${
                activeTab === "ETH"
                  ? "bg-[#00FF7F] text-white"
                  : "bg-[#1A1A1A] text-[#d2d2d2]"
              } rounded-md space-x-2`}
              onClick={() => setActiveTab("ETH")}
            >
              <Icons.EthereumIcon className="w-5 h-5" />
              <span>ETH</span>
            </button>
            <button
              className={`flex-shrink-0 px-4 py-2 text-sm flex items-center whitespace-nowrap ${
                activeTab === "BSC"
                  ? "bg-[#00FF7F] text-white"
                  : "bg-[#1A1A1A] text-[#d2d2d2]"
              } rounded-md space-x-2`}
              onClick={() => setActiveTab("BSC")}
            >
              <div className="scale-[1.5]">
                <Icons.BinanceIcon />
              </div>
              <span>BSC</span>
            </button>
            <button
              className={`flex-shrink-0 px-4 py-2 text-sm flex items-center whitespace-nowrap ${
                activeTab === "SOL"
                  ? "bg-[#00FF7F] text-white"
                  : "bg-[#1A1A1A] text-[#d2d2d2]"
              } rounded-md space-x-2`}
              onClick={() => setActiveTab("SOL")}
            >
              <div className="scale-[1.5]">
                <Icons.SolanaIcon />
              </div>
              <span>SOL</span>
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
                  {getCurrencyLogo(coin.symbol)}
                </div>
                <div className="currency-info">
                  <div className="currency-name">{coin.name}</div>
                  <div className="currency-symbol">{coin.symbol}</div>
                </div>
                <div className="currency-balance">
                  <div className="currency-value">
                    ~${coin.value.toFixed(3)}
                  </div>
                  {/* <div className="currency-amount">{coin.balance}</div> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
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

          {bonusAmount > 0 && (
            <div className="mb-10">
              <p className="text-[#cccccc] text-[15px] mb-1 text-left">
                Extra $XDCAI Bonus Token
              </p>
              <input
                type="text"
                value={bonusAmount.toFixed(8)}
                readOnly
                className="w-full bg-[#1A1A1A] rounded-md border border-[#333333] rounded-md p-3 text-white text-lg"
              />
            </div>
          )}

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
                color: "#00FA73",
                backgroundColor: "rgba(0, 100, 0, 0.2)",
                padding: "15px",
                borderRadius: "5px",
                marginBottom: "25px",
              }}
            >
              Transaction submitted, waiting for confirmation...
            </div>
          )}

          {intentId && intentTimeRemaining > 0 && (
            <div className="bg-[#1A1A1A] p-4 rounded-md mb-4 border border-[#333] text-center">
              <p className="text-[#00FA73] font-medium mb-1">
                Time Window Active
              </p>
              <p className="text-white text-sm">
                Complete your transaction within{" "}
                <span className="font-bold text-[#00FA73]">
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
            style={{
              width: "100%",
              backgroundColor:
                isProcessing || isLoadingPrice ? "#5a8f5a" : "#00FA73",
              border: "none",
              borderRadius: "8px",
              padding: "17px",
              fontSize: "20px",
              fontWeight: "500",
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
              : `BUY $${tokenSymbol}`}
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      className="purchase-screen p-4 pt-12 max-w-[600px]"
      // style={{ maxWidth: "", margin: "0 auto" }}
    >
      <div className="text-[11px] text-white font-[600] bg-[#425152] absolute top-0 right-0 left-0 w-[fit-content] text-center overflow-x-auto">
        The future of AI-powered agents is here - Grab $XDCAI at presale prices
        & fuel the AI revolution
      </div>
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
              backgroundColor: "#00FA73",
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
                color: "#00FA73",
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
      </div>
      <div className=" text-[20px] text-center !text-white  ">
        Take advantage of Huge Early Staking Rewards by becoming an early
        adopter!
      </div>
      <div
        style={{
          textAlign: "center",
          color: "#00FA73",
          fontSize: "38px",
          fontWeight: "600",
          margin: "25px 0",
          lineHeight: "1.2",
        }}
      >
        BUY ${tokenSymbol} PRESALE NOW!
      </div>
      {renderPageMain()}
    </div>
  );
};

export default PurchaseScreen;
