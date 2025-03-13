// src/components/CoinbaseTest.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CoinbaseTest = () => {
  const [status, setStatus] = useState('Not connected');
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [detectionInfo, setDetectionInfo] = useState({});
  const [providerInfo, setProviderInfo] = useState(null);

  // Gather detailed environment information
  useEffect(() => {
    const checkEnvironment = () => {
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

        setDetectionInfo(info);
        console.log("Environment info:", info);
      } catch (err) {
        console.error("Error checking environment:", err);
        setError(`Error checking environment: ${err.message}`);
      }
    };

    checkEnvironment();
  }, []);

  // Direct test for Coinbase Wallet
  const testCoinbaseDirectly = async () => {
    try {
      setStatus('Testing...');
      setError(null);

      // Try direct ethereum object first
      if (window.ethereum?.isCoinbaseWallet) {
        setStatus('Found Coinbase as primary provider, connecting...');
        const provider = window.ethereum;
        return await testProvider(provider, 'Primary Ethereum');
      }

      // Try providers array next
      if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
        for (let i = 0; i < window.ethereum.providers.length; i++) {
          const provider = window.ethereum.providers[i];
          if (provider.isCoinbaseWallet) {
            setStatus(`Found Coinbase in providers[${i}], connecting...`);
            return await testProvider(provider, `Providers[${i}]`);
          }
        }
      }

      // Try coinbaseWalletExtension
      if (window.coinbaseWalletExtension) {
        setStatus('Found coinbaseWalletExtension, connecting...');
        return await testProvider(window.coinbaseWalletExtension, 'CoinbaseWalletExtension');
      }

      // Try alternate detection
      if (window.ethereum?.isCoinbaseBrowser) {
        setStatus('Found Coinbase Browser, connecting...');
        return await testProvider(window.ethereum, 'CoinbaseBrowser');
      }

      // If none of the above worked, try a more aggressive approach
      // Sometimes Coinbase Wallet doesn't set the isCoinbaseWallet flag correctly
      if (window.ethereum) {
        setStatus('Trying ethereum directly (last resort)...');
        return await testProvider(window.ethereum, 'FallbackEthereum');
      }

      setStatus('No Coinbase Wallet provider found');
      setError('Coinbase Wallet not detected. Please install the extension or app.');
    } catch (err) {
      console.error("Error testing Coinbase directly:", err);
      setError(`Error testing Coinbase: ${err.message}`);
      setStatus('Connection failed');
    }
  };

  // Test a specific provider
  const testProvider = async (provider, providerName) => {
    try {
      setStatus(`Testing ${providerName}...`);
      
      // Log provider details for debugging
      const providerDetails = {
        name: providerName,
        isCoinbaseWallet: provider.isCoinbaseWallet,
        isMetaMask: provider.isMetaMask,
        hasRequest: typeof provider.request === 'function',
        chainId: null,
      };
      
      // Try to get chainId
      try {
        if (provider.request) {
          const chainId = await provider.request({ method: 'eth_chainId' });
          providerDetails.chainId = chainId;
        }
      } catch (e) {
        console.warn(`Could not get chainId from ${providerName}:`, e);
      }
      
      setProviderInfo(providerDetails);
      console.log(`Provider details for ${providerName}:`, providerDetails);

      // Request accounts
      setStatus(`Requesting accounts from ${providerName}...`);
      if (!provider.request) {
        throw new Error(`Provider ${providerName} does not have request method`);
      }

      // Use timeout for the request to prevent hanging
      const accounts = await Promise.race([
        provider.request({ method: 'eth_requestAccounts' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Request to ${providerName} timed out`)), 20000)
        )
      ]);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      const account = accounts[0];
      setAccount(account);
      setStatus(`Connected with ${providerName}: ${account}`);

      // Create ethers provider
      try {
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const network = await ethersProvider.getNetwork();
        setStatus(`Connected to ${providerName} on network ${network.name} (${network.chainId})`);
        return true;
      } catch (e) {
        console.error("Error creating ethers provider:", e);
        setError(`Could connect but ethers provider failed: ${e.message}`);
        return false;
      }
    } catch (err) {
      console.error(`Error with provider ${providerName}:`, err);
      setError(`${providerName} error: ${err.message}`);
      return false;
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', backgroundColor: '#1e1e1e', color: 'white', borderRadius: '10px' }}>
      <h2>Coinbase Wallet Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Environment Detection</h3>
        <pre style={{ backgroundColor: '#2d2d2d', padding: '10px', borderRadius: '5px', overflow: 'auto', maxHeight: '150px' }}>
          {JSON.stringify(detectionInfo, null, 2)}
        </pre>
      </div>

      {providerInfo && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Provider Details</h3>
          <pre style={{ backgroundColor: '#2d2d2d', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(providerInfo, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Connection Status</h3>
        <p><strong>Status:</strong> {status}</p>
        {account && <p><strong>Account:</strong> {account}</p>}
        {error && <p style={{ color: '#ff6b6b' }}><strong>Error:</strong> {error}</p>}
      </div>

      <button 
        onClick={testCoinbaseDirectly}
        style={{
          padding: '10px 15px',
          backgroundColor: '#2563EB',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Test Coinbase Connection
      </button>
    </div>
  );
};

export default CoinbaseTest;