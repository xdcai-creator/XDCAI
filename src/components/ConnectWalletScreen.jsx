import React from 'react';
import { WalletConnectModalSign } from '@walletconnect/modal-sign-react';
import {
  MetamaskIcon,
  CoinbaseWalletIcon,
  PhantomIcon,
  WalletConnectIcon
} from './icons';

const projectId = '1a4ff99bcd6e78be055075d2c24026b9';

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

export const ConnectWalletScreen = ({ 
  selectedWallet, 
  handleWalletSelection, 
  disabled, 
  error, 
  coinbaseStatus, 
  providerInfo 
}) => (
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

    {error && <p className="error-message">{error}</p>}

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
        name: 'XDCAI Presale',
        description: 'Buy XDCAI tokens in presale',
        url: 'https://xdcai.com',
        icons: ['https://xdcai.com/logo.png']
      }}
    />
  </div>
);

export default ConnectWalletScreen;