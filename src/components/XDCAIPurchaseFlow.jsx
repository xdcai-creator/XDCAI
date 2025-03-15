import React, { useState, useEffect } from 'react';
import { useConnect, useRequest } from '@walletconnect/modal-sign-react';
import './XDCAIPurchaseFlow.css';

// Import screen components
import { InitialScreen } from './InitialScreen';
import { ConnectWalletScreen } from './ConnectWalletScreen';
import { PurchaseScreen } from './PurchaseScreen';
import { ThankYouScreen } from './ThankYouScreen';
import { ClaimScreen } from './ClaimScreen';

// Import utility functions
import {
  connectToXdcNetwork,
  handleWalletSelection as walletSelectionUtil,
  handleCurrencySelect as currencySelectUtil,
  handlePurchase as purchaseUtil,
  handleClaim as claimUtil
} from '../utils';

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

const XDCAIPurchaseFlow = () => {
  // Screen state (0: initial, 1: wallet connect, 2: purchase form, 3: thank you, 4: claim)
  const [currentScreen, setCurrentScreen] = useState(0);

  // Wallet connection states
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [isXdcConnected, setIsXdcConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [coinbaseStatus, setCoinbaseStatus] = useState('Not connected');
  const [providerInfo, setProviderInfo] = useState(null);

  // Token purchase states
  const [ethAmount, setEthAmount] = useState('0');
  const [xdcaiAmount, setXdcaiAmount] = useState('0');
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);

  // WalletConnect hooks
  const { connect } = useConnect({
    requiredNamespaces: {
      eip155: {
        methods: ['eth_sendTransaction', 'personal_sign'],
        chains: ['eip155:1'],
        events: ['chainChanged', 'accountsChanged']
      }
    }
  });

  const { request } = useRequest();

  // Wallet detection functions
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  };

  const isWalletConnectAvailable = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isWalletConnect;
  };

  const isPhantomInstalled = () => {
    return typeof window.solana !== 'undefined' && window.solana.isPhantom;
  };

  const isCoinbaseInstalled = () => {
    if (typeof window === 'undefined') return false;

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

  // Check Coinbase environment on component mount
  useEffect(() => {
    checkCoinbaseEnvironment();
  }, []);

  // Check Coinbase environment
  const checkCoinbaseEnvironment = () => {
    try {
      // Collect information about the environment
      const info = {
        hasEthereum: typeof window.ethereum !== 'undefined',
        ethereumIsMetaMask: window.ethereum?.isMetaMask,
        ethereumIsCoinbaseWallet: window.ethereum?.isCoinbaseWallet,
        ethereumHasProviders: !!window.ethereum?.providers,
        coinbaseWalletExtension: !!window.coinbaseWalletExtension,
        isCoinbaseBrowser: !!window.ethereum?.isCoinbaseBrowser,
      };

      // If providers array exists, log details about each provider
      if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
        info.providersCount = window.ethereum.providers.length;
        info.providers = window.ethereum.providers.map((p, i) => ({
          index: i,
          isMetaMask: !!p.isMetaMask,
          isCoinbaseWallet: !!p.isCoinbaseWallet,
          hasRequest: typeof p.request === 'function',
          hasSend: typeof p.send === 'function',
          hasSendAsync: typeof p.sendAsync === 'function',
        }));
      }

      setDebugInfo(info);
      console.log("Environment info:", info);
    } catch (err) {
      console.error("Error checking environment:", err);
      setError(`Error checking environment: ${err.message}`);
    }
  };

  // Wrapper functions to handle component actions with appropriate state
  const handleWalletSelection = (wallet) => {
    // Store detection functions in an object to pass to utils
    const walletDetectors = {
      isMetaMaskInstalled,
      isWalletConnectAvailable,
      isPhantomInstalled,
      isCoinbaseInstalled
    };

    walletSelectionUtil({
      wallet,
      setSelectedWallet,
      setAccount,
      setProvider,
      setError,
      setCurrentScreen,
      setDisabled,
      setCoinbaseStatus,
      setProviderInfo,
      connect,
      walletDetectors,
      setIsXdcConnected,
      XDC_NETWORK
    });
  };

  const handleCurrencySelect = (currency) => {
    currencySelectUtil({
      currency,
      setSelectedCurrency,
      setShowCurrencySelection
    });
  };

  const handlePurchase = () => {
    purchaseUtil({
      ethAmount,
      xdcaiAmount,
      selectedCurrency,
      account,
      provider,
      setCurrentScreen,
      setError
    });
  };

  const handleClaim = () => {
    claimUtil({
      account,
      provider,
      setError
    });
  };

  const handleConnectToXdc = async () => {
    try {
      const success = await connectToXdcNetwork({
        provider,
        setIsXdcConnected,
        setError,
        XDC_NETWORK
      });
      
      if (success) {
        setIsXdcConnected(true);
      }
    } catch (error) {
      console.error("Error connecting to XDC:", error);
      setError("Failed to connect to XDC Network: " + error.message);
    }
  };

  // Render the current screen based on state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 0:
        return <InitialScreen setCurrentScreen={setCurrentScreen} />;
      case 1:
        return (
          <ConnectWalletScreen 
            selectedWallet={selectedWallet}
            handleWalletSelection={handleWalletSelection}
            disabled={disabled}
            error={error}
            coinbaseStatus={coinbaseStatus}
            providerInfo={providerInfo}
          />
        );
      case 2:
        return (
          <PurchaseScreen 
            handleCurrencySelect={handleCurrencySelect}
            handlePurchase={handlePurchase}
            showCurrencySelection={showCurrencySelection}
            setShowCurrencySelection={setShowCurrencySelection}
            selectedCurrency={selectedCurrency}
            ethAmount={ethAmount}
            setEthAmount={setEthAmount}
            xdcaiAmount={xdcaiAmount}
            setXdcaiAmount={setXdcaiAmount}
          />
        );
      case 3:
        return (
          <ThankYouScreen 
            connectToXdcNetwork={handleConnectToXdc}
            setCurrentScreen={setCurrentScreen}
            isXdcConnected={isXdcConnected}
          />
        );
      case 4:
        return (
          <ClaimScreen 
            connectToXdcNetwork={handleConnectToXdc}
            handleClaim={handleClaim}
            isXdcConnected={isXdcConnected}
          />
        );
      default:
        return <div>Invalid screen</div>;
    }
  };

  return (
    <div className="xdcai-purchase-flow">
      {renderCurrentScreen()}
      {account && currentScreen > 1 && (
        <div className="account-info">
          <p>Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
          {isXdcConnected && <p className="xdc-connected">✓ Connected to XDC Network</p>}
        </div>
      )}
    </div>
  );
};

export default XDCAIPurchaseFlow;