import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './XDCAIPurchaseFlow.css';

// Import config and components
import { config } from './config';
import { InitialScreen } from './InitialScreen';
import { ConnectWallet } from './ConnectWallet';
import { PurchaseScreen } from './PurchaseScreen';
import { ThankYouScreen } from './ThankYouScreen';
import { ClaimScreen } from './ClaimScreen';

// Import utility functions
import {
  connectToXdcNetwork,
  handleCurrencySelect as currencySelectUtil,
  handlePurchase as purchaseUtil,
  handleClaim as claimUtil
} from '../utils';

// Create a React Query client
const queryClient = new QueryClient();

const XDCAIPurchaseFlow = () => {
  // Screen state (0: initial, 1: wallet connect, 2: purchase form, 3: thank you, 4: claim)
  const [currentScreen, setCurrentScreen] = useState(0);

  // Account state
  const [account, setAccount] = useState(null);

  // XDC connection state
  const [isXdcConnected, setIsXdcConnected] = useState(false);
  const [error, setError] = useState(null);

  // Token purchase states
  const [ethAmount, setEthAmount] = useState('0');
  const [xdcaiAmount, setXdcaiAmount] = useState('0');
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);

  // Wrapper functions to handle utility actions
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
      setCurrentScreen,
      setError
    });
  };

  const handleClaim = () => {
    claimUtil({
      account,
      setError
    });
  };

  const handleConnectToXdc = async () => {
    try {
      // Simplified XDC network connection
      setIsXdcConnected(true);

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
          <ConnectWallet 
            setCurrentScreen={setCurrentScreen}
            setAccount={setAccount}
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

  // Wrap the app with wagmi providers
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="xdcai-purchase-flow">
          {renderCurrentScreen()}
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default XDCAIPurchaseFlow;