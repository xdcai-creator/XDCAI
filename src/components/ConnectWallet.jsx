import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WalletOptions } from './WalletOptions';
import { SolanaWalletProvider } from './SolanaWalletProvider';
import { SolanaConnectButton } from './SolanaWalletProvider';
import { SolanaSendToken } from './SolanaSendToken';

export function ConnectWallet({ setCurrentScreen, setAccount: setAppAccount }) {
  const { isConnected, address } = useAccount();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showTest, setShowTest] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if MetaMask is installed
  const checkMetaMaskInstalled = () => {
    if (typeof window !== 'undefined') {
      return Boolean(window.ethereum?.isMetaMask);
    }
    return false;
  };

  // Initialize MetaMask provider
  const initializeMetaMask = async () => {
    try {
      if (!checkMetaMaskInstalled()) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      await window.ethereum.request({ 
        method: 'eth_requestAccounts',
        params: []
      });

      // Add network change listener
      window.ethereum.on('chainChanged', (chainId) => {
        // Handle chain change - refresh page
        window.location.reload();
      });

      // Add account change listener  
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAppAccount(accounts[0]);
        } else {
          setAppAccount(null);
          setCurrentScreen(1);
        }
      });

    } catch (error) {
      console.error('MetaMask initialization error:', error);
      setError(error.message);
      return false;
    }
    return true;
  };
  
  // Update the app's account state when the wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setAppAccount(address);
      // Initialize MetaMask if it's the selected wallet
      if (selectedWallet === 'metaMask') {
        initializeMetaMask();
      }
      // Automatically proceed to purchase screen when connected
      setCurrentScreen(2);
    }
  }, [isConnected, address, setAppAccount, setCurrentScreen, selectedWallet]);

  // Handle test Solana wallet connection
  const handleTestSolanaConnect = async () => {
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAppAccount('test-solana-address');
      setCurrentScreen(2);
    } catch (error) {
      console.error('Test Solana connection error:', error);
      setError(error.message);
    }
  };

  // Handle test interface toggle
  const handleTestInterfaceToggle = () => {
    if (showTest) {
      // When going back to wallet options, reset the test state
      setSelectedWallet(null);
      setAppAccount(null);
      setError(null);
    }
    setShowTest(!showTest);
  };
  
  return showTest ? (
    <SolanaWalletProvider>
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <SolanaConnectButton />
          <button 
            onClick={handleTestInterfaceToggle}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Back to Wallet Connector
          </button>
        </div>
        <SolanaSendToken />
        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            color: 'red',
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            {error}
          </div>
        )}
      </div>
    </SolanaWalletProvider>
  ) : (
    <div>
      <WalletOptions 
        setSelectedWallet={setSelectedWallet} 
        onTestSolanaConnect={handleTestSolanaConnect}
        onError={setError}
      />
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          color: 'red',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          {error}
        </div>
      )}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '2px',
        padding: '0 20px'
      }}>
        <button 
          onClick={handleTestInterfaceToggle}
          style={{
            width: '100%',
            maxWidth: '520px',
            padding: '15px 20px',
            backgroundColor: '#112211',
            border: '1px solid #303030',
            borderRadius: '10px',
            color: 'white',
            fontSize: '18px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s, border-color 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}
        >
          <span>Phantom Wallet </span>
          <div style={{ width: '30px', height: '30px' }}>
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2ODBBNCI+PC9jaXJjbGU+PHBhdGggZD0iTTkuOTQgMjAuMTg4YzEuMjM1IDAgNC40MSAwIDUuNTI5IDBhLjQxLjQxIDAgMSAwIDAtLjgyMWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIxaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTAuNzZhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNWMxLjIzNSAwIDIuODc2LTEuMjMzIDMuNjk0LTIuMDVsLjIwNy0uMjA4Yy4yMjktLjIyOC42LTYuNDEyLjYtOC4wMzhNMjIuMDU4IDEyLjYzNWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIyaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTYuMjlhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNGMxLjIzNiAwIDIuODc3LTEuMjMyIDMuNjk1LTIuMDUiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNMjIuMDU4IDE5LjM2NmEuNDEuNDEgMCAwIDEgMCAuODIyaC01LjUzYS40MS40MSAwIDAgMCAwIC44MjFoNi4zNTJhLjQxLjQxIDAgMSAxIDAgLjgyMkgxNi4yOWEuNDEuNDEgMCAwIDAgMCAuODIxaDQuNzA0YzEuMjM2IDAgMi44NzcgMS4yMzMgMy42OTUgMi4wNWwuMjA3LjIwN2MuMjI5LjIyOS42IDYuNDEzLjYgOC4wMzgiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNOS45NCAyMy41MTFoNS41MjlhLjQxLjQxIDAgMSAxIDAgLjgyMmgtNi4zNTJhLjQxLjQxIDAgMCAwIDAgLjgyMWg1LjU4OWEuNDEuNDEgMCAwIDEgMCAuODIxSDkuOTRjLTEuMjM2IDAtMi44NzcgMS4yMzMtMy42OTQgMi4wNSIgZmlsbD0iI0ZGRiI+PC9wYXRoPjwvZz48L3N2Zz4=" 
              alt="Solana" 
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}