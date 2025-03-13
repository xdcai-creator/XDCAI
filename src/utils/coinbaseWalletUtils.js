// src/utils/coinbaseWalletUtils.js
import { ethers } from 'ethers';

// Significantly improved Coinbase Wallet detection
export const isCoinbaseInstalled = () => {
  if (typeof window === 'undefined') return false;
  
  // Log all available properties to help diagnose the problem
  console.log("Coinbase Wallet detection environment:", {
    ethereum: typeof window.ethereum !== 'undefined',
    isCoinbaseWallet: window.ethereum?.isCoinbaseWallet,
    hasProviders: !!window.ethereum?.providers,
    providerCount: window.ethereum?.providers?.length,
    coinbaseWalletExtension: !!window.coinbaseWalletExtension,
    isCoinbaseBrowser: !!window.ethereum?.isCoinbaseBrowser
  });
  
  // Method 1: Check if window.ethereum is directly Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet) {
    console.log("Found Coinbase Wallet as primary provider");
    return true;
  }
  
  // Method 2: Check in providers array
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    const hasCoinbaseProvider = window.ethereum.providers.some(p => p.isCoinbaseWallet);
    console.log("Coinbase Wallet provider in providers array:", hasCoinbaseProvider);
    if (hasCoinbaseProvider) return true;
  }
  
  // Method 3: Check for coinbaseWalletExtension
  if (window.coinbaseWalletExtension) {
    console.log("Found coinbaseWalletExtension");
    return true;
  }
  
  // Method 4: Check for Coinbase Browser environment
  if (window.ethereum?.isCoinbaseBrowser) {
    console.log("Found Coinbase Browser environment");
    return true;
  }
  
  // Method 5: Check for __COINBASE_WALLET_API_RESPONSE
  if (window.__COINBASE_WALLET_API_RESPONSE) {
    console.log("Found Coinbase Wallet API response");
    return true;
  }

  console.log("Coinbase Wallet not detected");
  return false;
};

// Enhanced Coinbase Wallet connection
export const connectCoinbase = async (setAccount, setProvider, setConnectionError) => {
  console.log("Starting Coinbase Wallet connection attempt...");
  
  try {
    // Detect Coinbase Wallet using our improved function
    if (!isCoinbaseInstalled()) {
      const errorMsg = 'Please install Coinbase Wallet extension to connect or use the Coinbase Wallet app with WalletConnect';
      console.error(errorMsg);
      setConnectionError(errorMsg);
      return { success: false, error: 'Coinbase Wallet not installed' };
    }
    
    // Clear any previous error messages
    setConnectionError('');
    
    // Find the Coinbase provider with multiple detection methods
    let coinbaseProvider = null;
    
    // Method 1: Direct Coinbase Provider
    if (window.ethereum?.isCoinbaseWallet) {
      console.log("Using Coinbase Wallet as primary provider");
      coinbaseProvider = window.ethereum;
    }
    // Method 2: Find in providers array
    else if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      console.log("Searching for Coinbase Wallet in providers array");
      const cbProvider = window.ethereum.providers.find(p => p.isCoinbaseWallet);
      if (cbProvider) {
        console.log("Found Coinbase Wallet in providers array");
        coinbaseProvider = cbProvider;
      }
    }
    // Method 3: Coinbase Wallet Extension
    else if (window.coinbaseWalletExtension) {
      console.log("Using coinbaseWalletExtension");
      coinbaseProvider = window.coinbaseWalletExtension;
    }
    // Method 4: Use Coinbase Browser
    else if (window.ethereum?.isCoinbaseBrowser) {
      console.log("Using Coinbase Browser provider");
      coinbaseProvider = window.ethereum;
    }
    
    if (!coinbaseProvider) {
      console.error("Cannot find Coinbase Wallet provider even though detection passed");
      throw new Error('Coinbase Wallet provider not found');
    }
    
    console.log("Requesting accounts from Coinbase Wallet...");
    
    // Use timeout protection to prevent hanging
    try {
      const accountsPromise = coinbaseProvider.request({ method: 'eth_requestAccounts' });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
      });
      
      const accounts = await Promise.race([accountsPromise, timeoutPromise]);
      
      console.log("Coinbase accounts received:", accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Coinbase Wallet');
      }
      
      const account = accounts[0];
      console.log("Selected account:", account);
      setAccount(account);
      
      // Create ethers provider
      console.log("Creating ethers provider...");
      const ethersProvider = new ethers.providers.Web3Provider(coinbaseProvider, 'any');
      setProvider(ethersProvider);
      
      console.log("Coinbase Wallet connection successful");
      return { 
        success: true, 
        provider: ethersProvider,
        account: account
      };
    } catch (requestError) {
      // Handle user rejection specifically
      if (requestError.code === 4001) {
        console.log("User rejected the connection request");
        setConnectionError('Connection rejected. Please approve the connection in Coinbase Wallet.');
      } else {
        console.error("Error in account request:", requestError);
        setConnectionError('Failed to connect to Coinbase Wallet: ' + (requestError.message || 'Unknown error'));
      }
      return { success: false, error: requestError.message || 'Unknown error' };
    }
  } catch (error) {
    console.error("Coinbase Wallet connection error:", error);
    
    // Provide specific error messages for common failure cases
    if (error.message && error.message.includes('already pending')) {
      setConnectionError('Connection request already pending in Coinbase Wallet. Please check your Coinbase Wallet extension.');
    } else if (error.message && error.message.includes('timed out')) {
      setConnectionError('Connection timed out. Please check if Coinbase Wallet is responding and try again.');
    } else if (error.message && error.message.includes('not found')) {
      setConnectionError('Coinbase Wallet provider not found. Please make sure Coinbase Wallet extension is installed and active.');
    } else {
      setConnectionError('Failed to connect to Coinbase Wallet: ' + (error.message || 'Unknown error'));
    }
    
    return { success: false, error: error.message || 'Unknown error' };
  }
};