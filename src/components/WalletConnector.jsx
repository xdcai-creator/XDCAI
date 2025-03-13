// src/components/WalletConnector.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './WalletConnector.css';

// SVG Icons for wallets
const MetamaskIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24.5172 3.40039L15.4312 9.85039L16.9052 5.88839L24.5172 3.40039Z" fill="#E17726"/>
    <path d="M3.48242 3.40039L12.4784 9.91639L11.0944 5.88839L3.48242 3.40039Z" fill="#E27625"/>
    <path d="M21.2344 19.2064L18.8344 23.0304L24.0504 24.5044L25.5244 19.2864L21.2344 19.2064Z" fill="#E27625"/>
    <path d="M2.49609 19.2864L3.95209 24.5044L9.16809 23.0304L6.76809 19.2064L2.49609 19.2864Z" fill="#E27625"/>
    <path d="M8.92888 12.3864L7.67188 14.6464L12.8079 14.8864L12.6479 9.19238L8.92888 12.3864Z" fill="#E27625"/>
    <path d="M19.0713 12.3864L15.2913 9.12638L15.1953 14.8864L20.3313 14.6464L19.0713 12.3864Z" fill="#E27625"/>
    <path d="M9.16797 23.0304L12.4879 21.4624L9.65597 19.3184L9.16797 23.0304Z" fill="#E27625"/>
    <path d="M15.5127 21.4624L18.8327 23.0304L18.3447 19.3184L15.5127 21.4624Z" fill="#E27625"/>
    <path d="M18.8327 23.0304L15.5127 21.4624L15.7527 23.5104L15.7207 24.4384L18.8327 23.0304Z" fill="#D5BFB2"/>
    <path d="M9.16797 23.0304L12.2799 24.4384L12.2639 23.5104L12.4879 21.4624L9.16797 23.0304Z" fill="#D5BFB2"/>
    <path d="M12.3279 17.8704L9.59991 17.0384L11.5119 16.1744L12.3279 17.8704Z" fill="#233447"/>
    <path d="M15.6719 17.8704L16.4879 16.1744L18.4159 17.0384L15.6719 17.8704Z" fill="#233447"/>
    <path d="M9.16809 23.0304L9.67209 19.2064L6.76809 19.2864L9.16809 23.0304Z" fill="#CC6228"/>
    <path d="M18.3281 19.2064L18.8321 23.0304L21.2321 19.2864L18.3281 19.2064Z" fill="#CC6228"/>
    <path d="M20.3281 14.6464L15.1921 14.8864L15.6721 17.8704L16.4881 16.1744L18.4161 17.0384L20.3281 14.6464Z" fill="#CC6228"/>
    <path d="M9.59987 17.0384L11.5119 16.1744L12.3279 17.8704L12.8079 14.8864L7.67188 14.6464L9.59987 17.0384Z" fill="#CC6228"/>
    <path d="M7.67188 14.6464L9.65588 19.3184L9.59988 17.0384L7.67188 14.6464Z" fill="#E27525"/>
    <path d="M18.4161 17.0384L18.3441 19.3184L20.3281 14.6464L18.4161 17.0384Z" fill="#E27525"/>
    <path d="M12.8079 14.8864L12.3279 17.8704L12.9359 21.0624L13.0479 16.7504L12.8079 14.8864Z" fill="#E27525"/>
    <path d="M15.1919 14.8864L14.9679 16.7344L15.0639 21.0624L15.6719 17.8704L15.1919 14.8864Z" fill="#E27525"/>
    <path d="M15.6719 17.8704L15.0639 21.0624L15.5119 21.4624L18.3439 19.3184L18.4159 17.0384L15.6719 17.8704Z" fill="#F5841F"/>
    <path d="M9.59991 17.0384L9.65591 19.3184L12.4879 21.4624L12.9359 21.0624L12.3279 17.8704L9.59991 17.0384Z" fill="#F5841F"/>
    <path d="M15.7201 24.4384L15.7521 23.5104L15.5281 23.3184H12.4721L12.2641 23.5104L12.2801 24.4384L9.16809 23.0304L10.1921 23.8624L12.4401 25.3844H15.5441L17.8081 23.8624L18.8321 23.0304L15.7201 24.4384Z" fill="#C0AC9D"/>
    <path d="M15.5127 21.4624L15.0647 21.0624H12.9358L12.4878 21.4624L12.2637 23.5104L12.4717 23.3184H15.5278L15.7518 23.5104L15.5127 21.4624Z" fill="#161616"/>
    <path d="M24.9004 10.1424L25.6684 6.16839L24.5164 3.40039L15.5124 9.53639L19.0684 12.3864L23.9044 13.7944L24.9644 12.5344L24.5004 12.2144L25.2364 11.5744L24.6764 11.1584L25.4124 10.6224L24.9004 10.1424Z" fill="#763E1A"/>
    <path d="M2.33203 6.16839L3.10003 10.1424L2.57203 10.6224L3.32403 11.1584L2.76403 11.5744L3.50003 12.2144L3.03603 12.5344L4.09603 13.7944L8.93203 12.3864L12.4881 9.53639L3.48403 3.40039L2.33203 6.16839Z" fill="#763E1A"/>
    <path d="M23.9044 13.7944L19.0684 12.3864L20.3284 14.6464L18.3444 19.3184L21.2324 19.2864H25.5244L23.9044 13.7944Z" fill="#F5841F"/>
    <path d="M8.93209 12.3864L4.09609 13.7944L2.49609 19.2864H6.76809L9.65609 19.3184L7.67209 14.6464L8.93209 12.3864Z" fill="#F5841F"/>
    <path d="M15.1919 14.8864L15.5119 9.53639L16.9059 5.88839H11.0938L12.4878 9.53639L12.8078 14.8864L12.9358 16.7664L12.9518 21.0624H15.0807L15.0967 16.7664L15.1919 14.8864Z" fill="#F5841F"/>
  </svg>
);

const WalletConnectIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="14" fill="#3B99FC"/>
    <path d="M9.10918 10.3739C12.0498 7.53044 16.7864 7.53044 19.7271 10.3739L20.1177 10.7493C20.2872 10.912 20.2872 11.1758 20.1177 11.3385L18.9036 12.5079C18.8188 12.5892 18.6806 12.5892 18.5958 12.5079L18.0504 11.9854C16.0213 10.0313 12.8149 10.0313 10.7858 11.9854L10.2028 12.5473C10.118 12.6286 9.97986 12.6286 9.89502 12.5473L8.68096 11.3779C8.51141 11.2152 8.51141 10.9514 8.68096 10.7887L9.10918 10.3739ZM22.2543 12.819L23.3273 13.8493C23.4968 14.012 23.4968 14.2758 23.3273 14.4385L17.8127 19.7518C17.643 19.9145 17.3703 19.9145 17.2006 19.7518L13.4254 16.1117C13.383 16.0711 13.3123 16.0711 13.2699 16.1117L9.49472 19.7518C9.32509 19.9145 9.05242 19.9145 8.88272 19.7518C8.88264 19.7517 8.88256 19.7517 8.88248 19.7516L3.37123 14.4389C3.20168 14.2762 3.20168 14.0124 3.37123 13.8497L4.44424 12.819C4.61387 12.6563 4.88654 12.6563 5.05625 12.819L8.83278 16.4591C8.87523 16.4997 8.94594 16.4997 8.98839 16.4591L12.7636 12.819C12.9332 12.6563 13.2059 12.6563 13.3756 12.819H13.3757L17.1513 16.4591C17.1938 16.4997 17.2645 16.4997 17.3069 16.4591L21.0823 12.819C21.252 12.6563 21.5246 12.6563 21.6943 12.819L22.2543 12.819Z" fill="white"/>
  </svg>
);

const PhantomIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="14" fill="#AB9FF2"/>
    <path d="M19.6003 8.4H16.8729C16.4956 8.4 16.1918 8.70367 16.1918 9.08107V11.9188C16.1918 12.2962 15.8881 12.5999 15.5107 12.5999H12.0001C11.6227 12.5999 11.319 12.9036 11.319 13.281V16.1187C11.319 16.4961 11.0153 16.7998 10.6379 16.7998H8.4C8.17909 16.7998 8 16.9789 8 17.1998V19.6002C8 19.8211 8.17909 20.0002 8.4 20.0002H17.7027C18.0801 20.0002 18.3838 19.6965 18.3838 19.3191V17.1998C18.3838 16.9789 18.5629 16.7998 18.7838 16.7998H19.6003C19.8212 16.7998 20.0003 16.6207 20.0003 16.3998V8.8C20.0003 8.57909 19.8212 8.4 19.6003 8.4Z" fill="white"/>
  </svg>
);

const CoinbaseWalletIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="14" fill="white"/>
    <path d="M14 5C8.92487 5 5 8.92487 5 14C5 19.0751 8.92487 23 14 23C19.0751 23 23 19.0751 23 14C23 8.92487 19.0751 5 14 5ZM11.1428 10.4285C11.1428 10.0357 11.4642 9.71428 11.8571 9.71428H16.1428C16.5357 9.71428 16.8571 10.0357 16.8571 10.4285V16.1428C16.8571 16.5357 16.5357 16.8571 16.1428 16.8571H11.8571C11.4642 16.8571 11.1428 16.5357 11.1428 16.1428V10.4285Z" fill="#0052FF"/>
  </svg>
);

// XDC network configuration
const XDC_NETWORK = {
  chainId: '0x32',
  chainName: 'XDC Network',
  nativeCurrency: {
    name: 'XDC',
    symbol: 'XDC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.xinfin.network'],
  blockExplorerUrls: ['https://explorer.xinfin.network/'],
};

const WalletConnector = () => {
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [isXdcConnected, setIsXdcConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // WalletConnect state
  const [wcUri, setWcUri] = useState("");
  const [wcConnecting, setWcConnecting] = useState(false);
  const [wcConnected, setWcConnected] = useState(false);
  const [wcAccount, setWcAccount] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  };

  // Check if Phantom is installed
  const isPhantomInstalled = () => {
    return typeof window.solana !== 'undefined' && window.solana.isPhantom;
  };

  // Advanced Coinbase Wallet detection
  const isCoinbaseInstalled = () => {
    if (typeof window === 'undefined') return false;
    
    // Log all available properties for debugging
    const debugData = {
      ethereum: typeof window.ethereum !== 'undefined',
      isCoinbaseWallet: window.ethereum?.isCoinbaseWallet,
      hasProviders: !!window.ethereum?.providers,
      providerCount: window.ethereum?.providers?.length,
      coinbaseWalletExtension: !!window.coinbaseWalletExtension,
      isCoinbaseBrowser: !!window.ethereum?.isCoinbaseBrowser,
    };
    
    setDebugInfo(debugData);
    console.log("Coinbase Wallet detection data:", debugData);
    
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

  // Connect to MetaMask
  const connectMetaMask = async () => {
    try {
      setError(null);
      
      if (!isMetaMaskInstalled()) {
        window.open('https://metamask.io/download.html', '_blank');
        setError('Please install MetaMask to continue');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setSelectedWallet('metamask');

      // Create ethers provider
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      setProvider(ethersProvider);

      // Add event listener for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
      });

      // Check if connected to XDC Network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setIsXdcConnected(chainId === XDC_NETWORK.chainId);

      return accounts[0];
    } catch (error) {
      console.error("MetaMask connection error:", error);
      setError(error.message);
      return null;
    }
  };

  // Connect to XDC Network
  const connectToXdcNetwork = async () => {
    try {
      setError(null);
      
      if (!isMetaMaskInstalled()) {
        setError('Please install MetaMask to connect to XDC Network');
        return false;
      }

      try {
        // Try to switch to XDC Network if it's already added
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: XDC_NETWORK.chainId }],
        });
      } catch (switchError) {
        // This error code means the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: XDC_NETWORK.chainId,
                  chainName: XDC_NETWORK.chainName,
                  nativeCurrency: XDC_NETWORK.nativeCurrency,
                  rpcUrls: XDC_NETWORK.rpcUrls,
                  blockExplorerUrls: XDC_NETWORK.blockExplorerUrls,
                },
              ],
            });
          } catch (addError) {
            setError(addError.message);
            return false;
          }
        } else {
          setError(switchError.message);
          return false;
        }
      }

      setIsXdcConnected(true);
      return true;
    } catch (error) {
      console.error("XDC connection error:", error);
      setError(error.message);
      return false;
    }
  };

  // Connect to WalletConnect
  const connectWalletConnect = async () => {
    try {
      setError(null);
      setWcConnecting(true);

      // Use standard WalletConnect protocol (for v1 compatibility)
      // For WalletConnect v2 you'd need to use the full WalletConnect library
      // with proper setup in the main app
      
      // In this simplified version, we'll create a popup that shows a QR code
      // Use the WalletConnect library in script version
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js";
      script.async = true;
      
      script.onload = async () => {
        try {
          // Create WalletConnect Provider
          const WalletConnectProvider = window.WalletConnectProvider.default;
          
          const wcProvider = new WalletConnectProvider({
            rpc: {
              1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Infura public endpoint
              50: "https://rpc.xinfin.network", // XDC
            },
            chainId: 1, // Default to Ethereum Mainnet
          });
          
          // Open QR Code modal
          const accounts = await wcProvider.enable();
          
          if (accounts && accounts.length > 0) {
            // Successfully connected
            setWcConnected(true);
            setWcAccount(accounts[0]);
            setAccount(accounts[0]);
            setSelectedWallet('walletconnect');
            
            // Create provider for later use
            try {
              const ethersProvider = new ethers.providers.Web3Provider(wcProvider);
              setProvider(ethersProvider);
            } catch (err) {
              console.error("Error creating ethers provider from WalletConnect:", err);
            }
            
            // Subscribe to events
            wcProvider.on("accountsChanged", (accounts) => {
              if (accounts && accounts.length > 0) {
                setAccount(accounts[0]);
                setWcAccount(accounts[0]);
              } else {
                handleDisconnect();
              }
            });
            
            wcProvider.on("chainChanged", (chainId) => {
              console.log("WalletConnect chain changed:", chainId);
              // Check if XDC network
              setIsXdcConnected(chainId === 50); // XDC chainId
            });
            
            wcProvider.on("disconnect", () => {
              handleDisconnect();
            });
          }
        } catch (err) {
          console.error("WalletConnect error:", err);
          setError(err.message || "Failed to connect with WalletConnect");
        } finally {
          setWcConnecting(false);
        }
      };
      
      script.onerror = () => {
        setError("Failed to load WalletConnect library");
        setWcConnecting(false);
      };
      
      document.head.appendChild(script);
      
      return true;
    } catch (error) {
      console.error("WalletConnect error:", error);
      setError(error.message || "Error connecting to WalletConnect");
      setWcConnecting(false);
      return null;
    }
  };

  // Connect to Phantom
  const connectPhantom = async () => {
    try {
      setError(null);
      
      if (!isPhantomInstalled()) {
        window.open('https://phantom.app/', '_blank');
        setError('Please install Phantom to continue');
        return null;
      }

      const { publicKey } = await window.solana.connect();
      setSelectedWallet('phantom');
      setAccount(publicKey.toString());
      return publicKey.toString();
    } catch (error) {
      console.error("Phantom connection error:", error);
      setError(error.message);
      return null;
    }
  };

  // Enhanced Coinbase Wallet connection
  const connectCoinbaseWallet = async () => {
    try {
      setError(null);
      
      // Check if Coinbase Wallet is installed
      if (!isCoinbaseInstalled()) {
        window.open('https://www.coinbase.com/wallet', '_blank');
        setError('Please install Coinbase Wallet to continue');
        return null;
      }
      
      console.log("Attempting to connect to Coinbase Wallet...");
      
      // Find the Coinbase provider
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
      // Fallback: Just try ethereum
      else if (window.ethereum) {
        console.log("Using general ethereum object as fallback");
        coinbaseProvider = window.ethereum;
      }
      
      if (!coinbaseProvider) {
        console.error("Cannot find Coinbase Wallet provider");
        throw new Error('Coinbase Wallet provider not found');
      }
      
      // Use timeout to prevent hanging
      const accountsPromise = coinbaseProvider.request({ method: 'eth_requestAccounts' });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 20 seconds')), 20000);
      });
      
      const accounts = await Promise.race([accountsPromise, timeoutPromise]);
      
      console.log("Accounts received from Coinbase:", accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Coinbase Wallet');
      }
      
      const account = accounts[0];
      setSelectedWallet('coinbase');
      setAccount(account);
      
      try {
        const ethersProvider = new ethers.providers.Web3Provider(coinbaseProvider);
        setProvider(ethersProvider);
        console.log("Ethers provider created successfully");
      } catch (providerError) {
        console.error("Error creating ethers provider:", providerError);
        // We'll still proceed with the connection even if we can't create an ethers provider
      }
      
      return account;
    } catch (error) {
      console.error("Coinbase Wallet connection error:", error);
      
      // Provide specific error messages for common failure cases
      if (error.message && error.message.includes('already pending')) {
        setError('Connection request already pending in Coinbase Wallet. Please check your Coinbase Wallet extension.');
      } else if (error.message && error.message.includes('timed out')) {
        setError('Connection timed out. Please check if Coinbase Wallet is responding and try again.');
      } else if (error.message && error.message.includes('not found')) {
        setError('Coinbase Wallet provider not found. Please make sure Coinbase Wallet extension is installed and active.');
      } else {
        setError(error.message || 'Unknown error connecting to Coinbase Wallet');
      }
      
      return null;
    }
  };

  // Handle wallet selection
  const handleWalletSelection = async (walletType) => {
    setError(null);
    let connectedAccount;

    switch (walletType) {
      case 'metamask':
        connectedAccount = await connectMetaMask();
        break;
      case 'walletconnect':
        connectedAccount = await connectWalletConnect();
        break;
      case 'phantom':
        connectedAccount = await connectPhantom();
        break;
      case 'coinbase':
        connectedAccount = await connectCoinbaseWallet();
        break;
      default:
        setError('Unsupported wallet type');
    }

    // If we connected to a wallet other than MetaMask, prompt to install MetaMask
    // for XDC network connection (this would typically happen in the next step of the flow)
    if (connectedAccount && walletType !== 'metamask') {
      console.log('Connected to wallet. Next step will be to connect to MetaMask for XDC network.');
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      if (selectedWallet === 'walletconnect' && provider && provider.provider && provider.provider.disconnect) {
        // For WalletConnect, call disconnect on provider
        await provider.provider.disconnect();
      } else if (selectedWallet === 'phantom' && window.solana) {
        // For Phantom
        await window.solana.disconnect();
      }
      
      // Reset all state
      setAccount(null);
      setSelectedWallet(null);
      setProvider(null);
      setWcConnected(false);
      setWcAccount(null);
      setIsXdcConnected(false);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setError("Error disconnecting: " + error.message);
    }
  };

  return (
    <div className="wallet-connector">
      <h2>Connect Wallet</h2>
      <p className="wallet-text">If you already have a wallet, select it from the options below.</p>
      <p className="wallet-text">
        If you don't have a wallet, install <a href="https://metamask.io/download.html" target="_blank" rel="noreferrer" className="metamask-link">Metamask</a> to get started.
      </p>

      <div className="wallet-options">
        <button 
          className={`wallet-option ${selectedWallet === 'metamask' ? 'selected' : ''}`}
          onClick={() => handleWalletSelection('metamask')}
          disabled={!!account}
        >
          <span>Metamask</span>
          <MetamaskIcon />
        </button>

        <button 
          className={`wallet-option ${selectedWallet === 'walletconnect' ? 'selected' : ''}`}
          onClick={() => handleWalletSelection('walletconnect')}
          disabled={!!account || wcConnecting}
        >
          <span>WalletConnect</span>
          {wcConnecting ? <span>Connecting...</span> : <WalletConnectIcon />}
        </button>

        <button 
          className={`wallet-option ${selectedWallet === 'phantom' ? 'selected' : ''}`}
          onClick={() => handleWalletSelection('phantom')}
          disabled={!!account}
        >
          <span>Phantom</span>
          <PhantomIcon />
        </button>

        <button 
          className={`wallet-option ${selectedWallet === 'coinbase' ? 'selected' : ''}`}
          onClick={() => handleWalletSelection('coinbase')}
          disabled={!!account}
        >
          <span>Coinbase Wallet</span>
          <CoinbaseWalletIcon />
        </button>
      </div>

      {selectedWallet && !isXdcConnected && selectedWallet === 'metamask' && (
        <div className="xdc-connection">
          <p>To claim tokens, you need to connect to the XDC Network.</p>
          <button className="connect-xdc-btn" onClick={connectToXdcNetwork}>
            Connect to XDC Network
          </button>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      {account && (
        <div className="account-info">
          <p>Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
          {isXdcConnected && <p className="xdc-connected">✓ Connected to XDC Network</p>}
          <button className="disconnect-btn" onClick={handleDisconnect}>
            Disconnect Wallet
          </button>
        </div>
      )}

      {selectedWallet === 'coinbase' && debugInfo && (
        <div className="debug-info">
          <details>
            <summary>Debug Info</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;