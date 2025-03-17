import React, { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useEnsName, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { mainnet, base, bsc, optimism } from 'wagmi/chains';

export const PurchaseScreen = ({
  handleCurrencySelect,
  handlePurchase: originalHandlePurchase,
  showCurrencySelection,
  setShowCurrencySelection,
  selectedCurrency,
  ethAmount,
  setEthAmount,
  xdcaiAmount,
  setXdcaiAmount,
  setCurrentScreen
}) => {
  // Account related hooks
  const { address, isConnected, chainId: currentChainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  
  // Network switching hook
  const { switchChain, isPending: isSwitchingChain, error: switchChainError } = useSwitchChain();
  
  // Transaction hooks
  const { 
    data: hash,
    error: txError, 
    isPending: isSendingTx, 
    sendTransaction 
  } = useSendTransaction();
  
  // Combined pending state
  const isPending = isSendingTx || isSwitchingChain;
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash, 
  });

  // Local state for transaction status
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Format the address to show as 0x123...abc
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const displayAddress = ensName || formatAddress(address);

  // Presale contract address - Replace with your actual contract address
  const PRESALE_CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

  // Coin network associations with chain IDs
  const coinNetworks = {
    ETH: { name: 'ETH', chainId: mainnet.id },
    BNB: { name: 'BSC', chainId: bsc.id },
    SOL: { name: 'SOL', chainId: null }, // Solana isn't an EVM chain, will need special handling
    USDT: { name: 'ETH', chainId: mainnet.id },
    USDC: { name: 'ETH', chainId: mainnet.id },
    'USDT-BNB': { name: 'BSC', chainId: bsc.id },
    'USDC-BNB': { name: 'BSC', chainId: bsc.id },
    'USDT-SOL': { name: 'SOL', chainId: null },
    'USDC-SOL': { name: 'SOL', chainId: null },
  };
  
  // Presale contract addresses on different chains
  const presaleContractAddresses = {
    [mainnet.id]: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // ETH mainnet address
    [bsc.id]: "0x9A67F1940164d0318612b497E8e6038f902a00a4", // BSC address
    [optimism.id]: "0x45C27821303a643F1Fc7F2EB3Cd4835A5Cd4909c", // Optimism address
    // Add other chain contract addresses as needed
  };

  // Original coin data with added network property
  const coinData = [
    { symbol: 'ETH', name: 'Ethereum', balance: 0.001, value: 3.122, network: 'ETH' },
    { symbol: 'BNB', name: 'Binance Coin', balance: 0.001, value: 0.968, network: 'BSC' },
    { symbol: 'SOL', name: 'Solana', balance: 0, value: 0, network: 'SOL' },
    { symbol: 'USDT', name: 'USDT', balance: 0, value: 0, network: 'ETH' },
    { symbol: 'USDC', name: 'USD Coin', balance: 0, value: 0, network: 'ETH' },
    { symbol: 'USDT-BNB', name: 'USDT', balance: 0, value: 0, network: 'BSC' },
    { symbol: 'USDC-BNB', name: 'USD Coin', balance: 0, value: 0, network: 'BSC' },
  ];

  const [activeTab, setActiveTab] = useState('ALL');
  const [filteredCoins, setFilteredCoins] = useState(coinData);
  const [coinPrices, setCoinPrices] = useState({});
  const [xdcPrice, setXdcPrice] = useState(0.0033722);
  const [isLoading, setIsLoading] = useState(false);
  
  // Watch for transaction confirmation and proceed to thank you screen
  useEffect(() => {
    if (isConfirmed) {
      // Reset any error messages
      setError(null);
      // Move to thank you screen after successful transaction
      setCurrentScreen(3);
    }
  }, [isConfirmed, setCurrentScreen]);
  
  // Update error state when transaction or chain switching error occurs
  useEffect(() => {
    if (txError) {
      setError(txError.message || "Transaction failed");
      setIsProcessing(false);
    }
    
    if (switchChainError) {
      setError(switchChainError.message || "Failed to switch network");
      setIsProcessing(false);
    }
  }, [txError, switchChainError]);
  
  // Handle currency selection and network switching
  const handleNetworkCurrencySelect = async (currency) => {
    // First update the selected currency in the UI
    handleCurrencySelect(currency);
    
    // Get the required chain for this currency
    const requiredNetwork = coinNetworks[currency];
    
    // If this currency requires a chain switch and isn't SOL (which isn't EVM compatible)
    if (requiredNetwork.chainId && requiredNetwork.chainId !== currentChainId) {
      try {
        setError(null);
        await switchChain({ chainId: requiredNetwork.chainId });
      } catch (error) {
        console.error("Failed to switch chains:", error);
        setError(`Failed to switch to ${requiredNetwork.name} network. ${error.message}`);
      }
    }
    
    // For SOL and other non-EVM chains, we would need to handle differently
    if (currency === 'SOL' || currency === 'USDT-SOL' || currency === 'USDC-SOL') {
      setError("Solana payments are coming soon. Please select an EVM compatible currency.");
    }
  };

  // Handle disconnect with correct screen change
  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Only change screen after disconnect is complete
      setCurrentScreen(1);
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  // Check connection status - redirect to connect screen if disconnected
  useEffect(() => {
    if (!isConnected) {
      setCurrentScreen(1);
    }
  }, [isConnected, setCurrentScreen]);

  // Fetch real-time cryptocurrency prices
  const fetchCryptoPrices = async () => {
    setIsLoading(true);
    try {
      // Simplified API call - in real implementation would call CoinGecko or similar
      const fallbackPrices = {
        'ETH': 3000,
        'BNB': 350,
        'SOL': 100,
        'USDT': 1,
        'USDC': 1,
        'USDT-BNB': 1,
        'USDC-BNB': 1,
        'USDT-SOL': 1,
        'USDC-SOL': 1,
      };
      setCoinPrices(fallbackPrices);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter coins based on active tab
  useEffect(() => {
    if (activeTab === 'ALL') {
      setFilteredCoins(coinData);
    } else {
      setFilteredCoins(coinData.filter(coin => coin.network === activeTab));
    }
  }, [activeTab]);

  // Fetch prices on component mount
  useEffect(() => {
    fetchCryptoPrices();
    // Update prices every 60 seconds
    const interval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate xdcai amount when eth amount changes
  useEffect(() => {
    if (ethAmount && coinPrices[selectedCurrency]) {
      const ethValue = parseFloat(ethAmount) * coinPrices[selectedCurrency];
      const xdcaiValue = ethValue / xdcPrice;
      setXdcaiAmount(xdcaiValue.toFixed(8));
    } else {
      setXdcaiAmount('0');
    }
  }, [ethAmount, selectedCurrency, coinPrices, xdcPrice, setXdcaiAmount]);

  // Handle input change with decimal validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid decimal up to 8 decimal places
    if (value === '' || /^\d*\.?\d{0,8}$/.test(value)) {
      setEthAmount(value);
    }
  };
  
  // Enhanced purchase handler using wagmi hooks
  const handleEnhancedPurchase = async () => {
    try {
      // Reset any previous errors
      setError(null);
      
      // Basic input validation
      if (!ethAmount || parseFloat(ethAmount) <= 0) {
        setError(`Please enter a valid ${selectedCurrency} amount`);
        return;
      }
      
      if (!xdcaiAmount || parseFloat(xdcaiAmount) <= 0) {
        setError('Please enter a valid XDCAI amount');
        return;
      }
      
      if (!address) {
        setError('No connected wallet account found');
        return;
      }
      
      // For native token transactions (ETH, BNB, etc.)
      if (selectedCurrency === 'ETH' || selectedCurrency === 'BNB' || selectedCurrency === 'SOL') {
        setIsProcessing(true);
        sendTransaction({ 
          to: PRESALE_CONTRACT_ADDRESS, 
          value: parseEther(ethAmount) 
        });
      } else {
        // For ERC20 tokens like USDT, USDC
        // This would require a different approach with contract interaction
        // For this demo, we'll show a message
        setError("Token payments will be implemented in the next version");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setError(`Purchase failed: ${error.message}`);
      setIsProcessing(false);
    }
  };
  
  // Get logo URL for a currency - using more reliable URLs
  const getCurrencyLogo = (symbol) => {
    switch(symbol) {
      case 'ETH':
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzYyN0VFQSIvPjxnIGZpbGw9IiNGRkYiIGZpbGwtcnVsZT0ibm9uemVybyI+PHBhdGggZmlsbC1vcGFjaXR5PSIuNjAyIiBkPSJNMTYuNDk4IDR2OS4xMDNMOCA1VjE2LjQ5OHoiLz48cGF0aCBkPSJNMTYuNDk4IDRMMjUgMTYuNDk4TDE2LjQ5OCAxMy4xMDNWNHoiLz48cGF0aCBmaWxsLW9wYWNpdHk9Ii42MDIiIGQ9Ik0xNi40OTggMjEuOTc2djYuMDIxTDggMTZsMTYuNDk4IDguMjV2LTIuMjc0TDE2LjQ5OCAyMS45NzZ6Ii8+PHBhdGggZD0iTTE2LjQ5OCAyNy45OTVWMjEuOTc2TDI1IDE2TDE2LjQ5OCAyNy45OTV6Ii8+PHBhdGggZmlsbC1vcGFjaXR5PSIuMiIgZD0iTTE2LjQ5OCAyMC41NzNMMjQuODk1IDE2LjE5TDE2LjQ5OCAxMy4xMDR2Ny40N3oiLz48cGF0aCBmaWxsLW9wYWNpdHk9Ii42MDIiIGQ9Ik04IDEhNi4xOWw4LjQ5OCA3LjQ3VjEzLjFMOCAxNi4xOTB6Ii8+PC9nPjwvZz48L3N2Zz4=';
      case 'BNB':
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0JBMkYiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTIuMTE2IDE0LjQwNEwxNiAxMC41MmwzLjg4NiAzLjg4NiAyLjI2IDIuMjZMMTYgMjIuNzg0bC02LjE0NC02LjE0NCAxLjE0NC0xLjE0NCAxLjExNi0xLjA5MnpNOS4wNzYgMTYuNDY0bDEuMTQ0LTEuMTQgNS43OCA1Ljc3OC01Ljc4IDUuNzgtMS4xNDQtMS4xNDRMMTMuNzA4IDIxbC00LjYzMi00LjUzNnptMTMuODQ4IDBsLTEuMTQ0IDEuMTQ0TDE3LjE0OCAyMWw0LjYzMiA0LjYzNiAxLjE0NC0xLjE0NC01Ljc4LTUuNzggNS43OC01Ljc3OHpNMTYgOEw4IDE2bDEuMTQ0IDEuMTQ0TDE2IDEwLjI4OGw2Ljg1NiA2Ljg1NkwyNCAuNnoiLz48L2c+PC9zdmc+';
      case 'SOL':
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2ODBBNCI+PC9jaXJjbGU+PHBhdGggZD0iTTkuOTQgMjAuMTg4YzEuMjM1IDAgNC40MSAwIDUuNTI5IDBhLjQxLjQxIDAgMSAwIDAtLjgyMWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIxaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTAuNzZhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNWMxLjIzNSAwIDIuODc2LTEuMjMzIDMuNjk0LTIuMDVsLjIwNy0uMjA4Yy4yMjktLjIyOC42LTYuNDEyLjYtOC4wMzhNMjIuMDU4IDEyLjYzNWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIyaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTYuMjlhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNGMxLjIzNiAwIDIuODc3LTEuMjMyIDMuNjk1LTIuMDUiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNMjIuMDU4IDE5LjM2NmEuNDEuNDEgMCAwIDEgMCAuODIyaC01LjUzYS40MS40MSAwIDAgMCAwIC44MjFoNi4zNTJhLjQxLjQxIDAgMSAxIDAgLjgyMkgxNi4yOWEuNDEuNDEgMCAwIDAgMCAuODIxaDQuNzA0YzEuMjM2IDAgMi44NzcgMS4yMzMgMy42OTUgMi4wNWwuMjA3LjIwN2MuMjI5LjIyOS42IDYuNDEzLjYgOC4wMzgiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNOS45NCAyMy41MTFoNS41MjlhLjQxLjQxIDAgMSAxIDAgLjgyMmgtNi4zNTJhLjQxLjQxIDAgMCAwIDAgLjgyMWg1LjU4OWEuNDEuNDEgMCAwIDEgMCAuODIxSDkuOTRjLTEuMjM2IDAtMi44NzcgMS4yMzMtMy42OTQgMi4wNSIgZmlsbD0iI0ZGRiI+PC9wYXRoPjwvZz48L3N2Zz4=';
      case 'USDT':
      case 'USDT-BNB':
      case 'USDT-SOL':
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzI2QTE3QiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0xNy45MjIgMTcuMzgzdi0uMDAyYy0uMTEuMDA4LS42NzcuMDQyLTEuOTQyLjA0Mi0xLjAxIDAtMS43MjEtLjAzLTEuOTcxLS4wNDJ2LjAwM2MtMy44ODgtLjE3MS02Ljc5LS44NDgtNi43OS0xLjY1OCAwLS44MDkgMi45MDItMS40ODYgNi43OS0xLjY2di0yLjEyYzEuMjYuMDEzIDEuOTcuMDQ0IDEuOTguMDQ0bC4wMDMtLjAwMmMuMDEgMCAuNzE3LS4wMzEgMS45NjEtLjA0NHYyLjEyMmMzLjg4OC4xNzMgNi43OS44NSA2Ljc5IDEuNjU5IDAgLjgxLTIuOTAyIDEuNDg2LTYuNzkgMS42NTdtMC0zLjk2NnYtLjAwMWMtLjEyOS4wMS0uNzI0LjA0NC0xLjk0Mi4wNDQtMS4wMTggMC0xLjc2NS0uMDMtMS45NzEtLjA0M3YuMDAxYy00LjkxNC0uMTcxLTguNTgtLjk4LTguNTgtMS44NTVzMy42NjYtMS42ODQgOC41OC0xLjg1NnYuMDAxYzEuMjQ1LjAyIDEuOTg4LjA0NyAxLjk4OC4wNDcuMDExIDAgLjcxNy0uMDMgMS45NDQtLjA0OHYtLjAwMWM0LjkxNS4xNzIgOC41OC45OCA4LjU4IDEuODU2cy0zLjY2NSAxLjY4NC04LjU4IDEuODU1bS0xLjk1MSA1LjI3NHYzLjU3MmMtLjAwMSAwLS43MS4wMzctMS45NjMuMDM3LTEuMDI1IDAtMS43MzQtLjAzLTEuOTg4LS4wMzd2LTMuNTcyYy4yNTQuMDA4Ljk2Mi4wMzcgMS45ODguMDM3IDEuMjUxIDAgMS45Ni0uMDM3IDEuOTYzLS4wMzciLz48L2c+PC9zdmc+';
      case 'USDC':
      case 'USDC-BNB':
      case 'USDC-SOL':
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzJDNzVDQSIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0xNS45OTEgMjZDMTEuMDMgMjYgNi45OTggMjEuOTcgNi45OTggMTcuMDExYzAtNC45NTggNC4wMzMtOC45OSA4Ljk5My04Ljk5IDQuOTU4IDAgOC45OTEgNC4wMzMgOC45OTEgOC45OSAwIDQuOTU5LTQuMDMzIDguOTg5LTguOTkgOC45ODl6bTQuNDQ1LTUuMzAzYS43MTMuNzEzIDAgMCAwLS43MTIuNzEuNzEzLjcxMyAwIDAgMCAxLjQyNC4wMDEuNzEuNzEgMCAwIDAtLjcxMi0uNzExem0wLTIuODVhLjc5NC43OTQgMCAwIDAgLjc5MS0uNzkxLjc5Ni43OTYgMCAwIDAtLjc5MS0uNzkzLjc5NS43OTUgMCAwIDAtLjc5Mi43OTMuNzk0Ljc5NCAwIDAgMCAuNzkyLjc5em0tOC44MjEgMi44NWEuNzExLjcxMSAwIDEgMC0uMDAxIDEuNDIyLjcxMi43MTIgMCAwIDAgLjcxMi0uNzEuNzEzLjcxMyAwIDAgMC0uNzExLS43MTJ6bTAtMi44NWEuNzkyLjc5MiAwIDEgMCAwIDEuNTgzLjc5Mi43OTIgMCAwIDAgMC0xLjU4MnptOC44MTUtMi4wNjJjLS40NzMgMC0uNzQyLS41MDYtLjQyOS0uODQyYTYuMjI1IDYuMjI1IDAgMCAwIDEuNzcyLTQuMzM1IDYuMjMgNi4yMyAwIDAgMC0xLjc1NS00LjMxM2MtLjMyNS0uMzQ0LS4wNTEtLjg5NS40NTQtLjg5NS41MDYgMCAuNzA3LjU1NC4zODkuODk0YTYuMjMxIDYuMjMxIDAgMCAwLTEuNzcxIDQuMzE0IDYuMjI3IDYuMjI3IDAgMCAwIDEuNzU0IDQuMzM2Yy4zMjMuMzQzLjA0Ni44NDEtLjQxNC44NDF6bS0xLjk0NS4wMDRjLS40NyAwLS43MjctLjQ3Ni0uNDE0LTguMzQuMDcyLS4wNzguMTU2LS4xNTcuMjQyLS4yMzkuMzQ3LS4zMjUuODU2LS4wNDguODU2LjQ0NHYuMDAyYzAgLjUwNy0uNTU2LjcwNS0uODg5LjM4Ni0uMDY5LS4wNjYtLjE0Mi0uMTM1LS4yMTktLjIwNmEzLjcxIDMuNzEgMCAwIDAtMS4wMzEtMi41NzFjLS43ODMtLjc4NC0xLjgxNC0xLjIxNi0yLjkxNi0xLjIxNmgtLjAxNWMtMS4xMDYuMDAzLTIuMTM5LjQzOC0yLjkyMSAxLjIyM2EzLjcxNiAzLjcxNiAwIDAgMC0xLjAyNSAyLjU3MnYuMDAzYTMuNzEzIDMuNzEzIDAgMCAwIDEuMDI0IDIuNTcxIDMuNzMgMy43MyAwIDAgMCAyLjkyMiAxLjIyM2guM3YtLjAwNGMwLS41MDYuNTU2LS43MDQuODktLjM4NS4wNjguMDY1LjE0Mi4xMzQuMjE4LjIwNS4zNDcuMzI0LjA0OS44My0uNDEuODNINy41OWMtLjQ3IDAtLjczLS40NS0uNDEyLS44MTkuMDg2LS4xLjE4MS0uMjA3LjI4NS0uMzE4LjMyLS4zMzcuODk2LS4wNjEuOS4zODcuMDUxLS4wNC4xMDMtLjA4LjE1Ni0uMTJhNi4xMzggNi4xMzggMCAwIDAgMS43MTUtNC4yMjcgNi4xNDQgNi4xNDQgMCAwIDAtMS43MDEtNC4yMDZ2LS4wMDJhNi4xNjYgNi4xNjYgMCAwIDAtNC4zNDItMS44MDNoLS4wMmE2LjE2NyA2LjE2NyAwIDAgMC00LjM1MyAxLjgwM2gtLjAwMUE2LjE0ODYuMTQ4IDAgMCAwIC4wODMgMTdoLjAwMWE2LjE0MiA2LjE0MiAwIDAgMCAxLjcxNCA0LjIzYy4wNTUuMDQ1LjExLjA4NC4xNjMuMTI0LjAxLjQzOC41OC42OTQuODg2LjM3OC4xLS4xMDQuMTk2LS4yMTEuMjg2LS4zMjMuMzEzLS4zNjQuMDQ5LS44MDktLjQxOS0uODA5LS40NzQgMC0uNzQuNTA3LS40MzEuODQuNjI0LjY3MiAxLjI5IDEuMjM4IDIuMTEgMS42MzlhNy4zMDUgNy4zMDUgMCAwIDAgMi45MS43MjdjMS4wMyAwIDEuOTgtLjI1MSAyLjkxLS43MjdhNy4zMDcgNy4zMDcgMCAwIDAgMi4xMS0xLjY0Yy4zMS0uMzMxLjA0NC0uODM4LS40My0uODM4eiIvPjwvZz48L3N2Zz4=';
      default:
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNDNEM0QzQiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTYgN2E5IDkgMCAxIDAgMCAxOCA5IDkgMCAwIDAgMC0xOHptMS40OTggMTMuMDc4aC0zdi0zLjA1OWgzdjMuMDZ6bTAtNC4zNzVoLTN2LTQuNzAzaDN2NC43MDN6Ii8+PC9nPjwvc3ZnPg==';
    }
  };

  // Determine if user has enough balance
  const hasEnoughBalance = () => {
    const coin = coinData.find(c => c.symbol === selectedCurrency);
    return coin && parseFloat(ethAmount) <= coin.balance;
  };

  return (
    <div className="purchase-screen" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {showCurrencySelection ? (
        <div className="currency-selection">
          <h2>Select a currency</h2>
          
          <div className="currency-tabs">
            <button 
              className={`currency-tab ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              ALL
            </button>
            <button 
              className={`currency-tab ${activeTab === 'ETH' ? 'active' : ''}`}
              onClick={() => setActiveTab('ETH')}
            >
              <img 
                src={getCurrencyLogo('ETH')} 
                alt="ETH" 
                style={{width: '16px', height: '16px', marginRight: '4px'}}
              /> ETH
            </button>
            <button 
              className={`currency-tab ${activeTab === 'BSC' ? 'active' : ''}`}
              onClick={() => setActiveTab('BSC')}
            >
              <img 
                src={getCurrencyLogo('BNB')} 
                alt="BSC" 
                style={{width: '16px', height: '16px', marginRight: '4px'}}
              /> BSC
            </button>
            <button 
              className={`currency-tab ${activeTab === 'SOL' ? 'active' : ''}`}
              onClick={() => setActiveTab('SOL')}
            >
              <img 
                src={getCurrencyLogo('SOL')} 
                alt="SOL" 
                style={{width: '16px', height: '16px', marginRight: '4px'}}
              /> SOL
            </button>
          </div>
          
          <div className="currency-list">
            {filteredCoins.map((coin) => (
              <div 
                key={coin.symbol} 
                className="currency-item" 
                onClick={() => handleNetworkCurrencySelect(coin.symbol)}
              >
                <div className="currency-icon-wrapper">
                  <img 
                    src={getCurrencyLogo(coin.symbol)} 
                    alt={coin.symbol} 
                    style={{width: '32px', height: '32px'}}
                  />
                </div>
                <div className="currency-info">
                  <div className="currency-name">{coin.name}</div>
                  <div className="currency-symbol">{coin.symbol}</div>
                </div>
                <div className="currency-balance">
                  <div className="currency-value">~${coin.value.toFixed(3)}</div>
                  <div className="currency-amount">{coin.balance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Account Information Section */}
          <div style={{
            marginBottom: '20px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '10px',
            padding: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#90EE90',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                fontSize: '16px',
                color: '#1a1a1a',
                fontWeight: 'bold'
              }}>
                {displayAddress.charAt(0)}
              </div>
              <div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {displayAddress}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#90EE90'
                }}>
                  Connected
                </div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #ff4c4c',
                borderRadius: '6px',
                color: '#ff4c4c',
                padding: '6px 10px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </div>
          
          {/* Header section */}
          <div className="presale-header">
            <p style={{ 
              textAlign: 'right', 
              margin: '10px 0', 
              fontSize: '16px', 
              color: '#ccc'
            }}>
              Can't find tokens in your wallet?
            </p>
            <h2 style={{ 
              textAlign: 'center', 
              margin: '15px 0', 
              fontSize: '24px', 
              lineHeight: '1.3'
            }}>
              Take advantage of Huge Early Staking Rewards by becoming an early adopter!
            </h2>
            <div style={{ 
              textAlign: 'center', 
              color: '#90EE90', 
              fontSize: '38px', 
              fontWeight: 'bold', 
              margin: '25px 0',
              lineHeight: '1.2'
            }}>
              BUY $XDCAI PRESALE NOW!
            </div>
          </div>
          
          {/* Token display area */}
          <div style={{ 
            width: '100%', 
            height: '110px', 
            backgroundColor: '#3a4a4a', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}></div>
          
          {/* Payment section */}
          <div style={{ padding: '0 5px' }}>
            {/* Pay with crypto field */}
            <div style={{ marginBottom: '25px' }}>
              <p style={{ 
                textAlign: 'left', 
                margin: '5px 0', 
                fontSize: '16px', 
                color: '#ccc' 
              }}>
                Pay with {selectedCurrency}
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                gap: '10px'
              }}>
                <input
                  type="text"
                  value={ethAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  style={{
                    flex: '1',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '15px',
                    fontSize: '20px',
                    color: 'white',
                    height: '55px',
                    boxSizing: 'border-box'
                  }}
                />
                <button 
                  onClick={() => setShowCurrencySelection(true)}
                  style={{
                    width: '120px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '0 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    height: '55px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#627EEA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px'
                  }}>
                    <img 
                      src={getCurrencyLogo(selectedCurrency)} 
                      alt={selectedCurrency} 
                      style={{
                        width: '16px', 
                        height: '16px'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedCurrency}</span>
                  <span style={{ marginLeft: '8px' }}>▼</span>
                </button>
              </div>
            </div>
            
            {/* Receive XDCAI field */}
            <div style={{ marginBottom: '5px' }}>
              <p style={{ 
                textAlign: 'left', 
                margin: '5px 0', 
                fontSize: '16px', 
                color: '#ccc' 
              }}>
                Receive $XDCAI
              </p>
              <input
                type="text"
                value={xdcaiAmount}
                readOnly
                placeholder="0"
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '15px',
                  fontSize: '20px',
                  color: 'white',
                  height: '55px',
                  boxSizing: 'border-box',
                  marginBottom: '5px'
                }}
              />
              <p style={{ 
                textAlign: 'right', 
                margin: '5px 0 20px 0', 
                fontSize: '14px', 
                color: '#aaa' 
              }}>
                1 $XDCAI = ${xdcPrice.toFixed(7)}
              </p>
            </div>
            
            {/* Network info display */}
            <div style={{ 
              textAlign: 'center', 
              color: '#aaa',
              backgroundColor: 'rgba(30, 30, 30, 0.7)',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {currentChainId && `Connected to ${
                currentChainId === mainnet.id ? 'Ethereum' : 
                currentChainId === bsc.id ? 'Binance Smart Chain' : 
                currentChainId === optimism.id ? 'Optimism' : 
                `Chain ID: ${currentChainId}`
              }`}
            </div>
            
            {/* Error message - displayed only if there's an error */}
            {error && (
              <div style={{ 
                textAlign: 'center', 
                color: '#ff6b6b', 
                backgroundColor: 'rgba(100, 0, 0, 0.2)',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '25px'
              }}>
                {error}
              </div>
            )}
            
            {/* Transaction status indicators */}
            {isPending && (
              <div style={{ 
                textAlign: 'center', 
                color: '#90EE90', 
                backgroundColor: 'rgba(0, 100, 0, 0.2)',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '25px'
              }}>
                Transaction submitted, waiting for confirmation...
              </div>
            )}
            
            {isConfirming && (
              <div style={{ 
                textAlign: 'center', 
                color: '#90EE90', 
                backgroundColor: 'rgba(0, 100, 0, 0.2)',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '25px'
              }}>
                Transaction confirmation in progress...
              </div>
            )}
            
            {/* Transaction hash display */}
            {hash && (
              <div style={{ 
                textAlign: 'center', 
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                padding: '15px',
                borderRadius: '5px',
                marginBottom: '25px',
                wordBreak: 'break-all'
              }}>
                <p style={{ color: 'white', marginBottom: '5px' }}>Transaction Hash:</p>
                <p style={{ color: '#90EE90', fontSize: '14px' }}>{hash}</p>
              </div>
            )}
            
            {/* Buy button */}
            <button 
              onClick={handleEnhancedPurchase}
              disabled={isPending || isConfirming}
              style={{
                width: '100%',
                backgroundColor: isPending || isConfirming ? '#5a8f5a' : '#90EE90',
                border: 'none',
                borderRadius: '8px',
                padding: '17px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'black',
                cursor: isPending || isConfirming ? 'not-allowed' : 'pointer',
                marginBottom: '15px',
                height: '60px'
              }}
            >
              {isPending || isConfirming ? 'PROCESSING...' : 'BUY $XDCAI'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PurchaseScreen;