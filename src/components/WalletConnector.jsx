// src/components/WalletConnector.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './WalletConnector.css';
import {MetamaskIcon,CoinbaseWalletIcon,PhantomIcon,WalletConnectIcon} from './icons';
import {WalletConnectModalSign, useConnect, useRequest} from '@walletconnect/modal-sign-react';
import { connectMetaMask } from './connectMetamask';
import { connectWalletConnect } from './connectWalletConnect';
import { connectPhantom } from './connectPhantom';
import { connectCoinbaseWallet } from './connectCoinbase';
import { testCoinbaseProvider } from './testCoinbaseProvider';

const projectId = '1a4ff99bcd6e78be055075d2c24026b9'

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
  // Move all hook calls to the top level of the component
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [isXdcConnected, setIsXdcConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [coinbaseStatus, setCoinbaseStatus] = useState('Not connected');
  const [providerInfo, setProviderInfo] = useState(null);
  
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
  
  const { request, data, requesterror, loading } = useRequest();

  // Gather environment information on component mount
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

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  };

  // Check if WalletConnect is available
  const isWalletConnectAvailable = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isWalletConnect;
  };

  // Check if Phantom is installed
  const isPhantomInstalled = () => {
    return typeof window.solana !== 'undefined' && window.solana.isPhantom;
  };

  // Advanced Coinbase Wallet detection
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

  // Handle wallet selection
  const handleWalletSelection = async (walletType) => {
    setError(null);
    setCoinbaseStatus('Not connected');
    setProviderInfo(null);
    let connectedAccount;

    switch (walletType) {
      case 'metamask':
        connectedAccount = await connectMetaMask({
          setError,
          setAccount,
          setSelectedWallet,
          setProvider,
          setIsXdcConnected,
          XDC_NETWORK,
          isMetaMaskInstalled
        });
        break;
      case 'walletconnect':
        connectedAccount = await connectWalletConnect({
          setDisabled,
          setError,
          connect
        });
        break;
      case 'phantom':
        connectedAccount = await connectPhantom({
          setError,
          setSelectedWallet,
          setAccount,
          isPhantomInstalled
        });
        break;
      case 'coinbase':
        connectedAccount = await connectCoinbaseWallet({
          setError,
          setCoinbaseStatus,
          setSelectedWallet,
          setAccount,
          setProviderInfo,
          testCoinbaseProvider,
          isCoinbaseInstalled
        });
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
        >
          <span>Metamask</span>
          <MetamaskIcon />
        </button>

        <button
          className={`wallet-option ${selectedWallet === 'walletconnect' ? 'selected' : ''}`}
          onClick={() => handleWalletSelection('walletconnect')}
          disabled={disabled}
        >
          <span>WalletConnect</span>
          <WalletConnectIcon />
        </button>

        <button
          className={`wallet-option ${selectedWallet === 'phantom' ? 'selected' : ''}`}
          onClick={() => handleWalletSelection('phantom')}
        >
          <span>Phantom</span>
          <PhantomIcon />
        </button>

        <button
          className={`wallet-option ${selectedWallet === 'coinbase' ? 'selected' : ''}`}
          onClick={() => handleWalletSelection('coinbase')}
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
        </div>
      )}

      {selectedWallet === 'coinbase' && (
        <div className="coinbase-status">
          <p><strong>Status:</strong> {coinbaseStatus}</p>
          {providerInfo && (
            <div className="debug-info">
              <details>
                <summary>Provider Details</summary>
                <pre>{JSON.stringify(providerInfo, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      )}

      <WalletConnectModalSign
        projectId={projectId}
        metadata={{
          name: 'My Dapp',
          description: 'My Dapp description',
          url: 'https://my-dapp.com',
          icons: ['https://my-dapp.com/logo.png']
        }}
      />
    </div>
  );
};

export default WalletConnector;