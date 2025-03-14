export const connectCoinbaseWallet = async ({
  setError,
  setCoinbaseStatus,
  setSelectedWallet,
  setAccount,
  setProviderInfo,
  testCoinbaseProvider,
  isCoinbaseInstalled
}) => {
  try {
    setError(null);
    setCoinbaseStatus('Testing Coinbase connection...');
    
    // Check if Coinbase Wallet is installed
    if (!isCoinbaseInstalled()) {
      window.open('https://www.coinbase.com/wallet', '_blank');
      setError('Please install Coinbase Wallet to continue');
      setCoinbaseStatus('Not installed');
      return null;
    }
    
    console.log("Attempting to connect to Coinbase Wallet...");
    
    // Try direct ethereum object first
    if (window.ethereum?.isCoinbaseWallet) {
      setCoinbaseStatus('Found Coinbase as primary provider, connecting...');
      const result = await testCoinbaseProvider(window.ethereum, 'Primary Ethereum', setProviderInfo);
      if (result) {
        return await finalizeConnection(result.provider, result.providerName, setAccount, setCoinbaseStatus, setSelectedWallet, setError);
      }
    }
    
    // Try providers array next
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      for (let i = 0; i < window.ethereum.providers.length; i++) {
        const provider = window.ethereum.providers[i];
        if (provider.isCoinbaseWallet) {
          setCoinbaseStatus(`Found Coinbase in providers[${i}], connecting...`);
          const result = await testCoinbaseProvider(provider, `Providers[${i}]`, setProviderInfo);
          if (result) {
            return await finalizeConnection(result.provider, result.providerName, setAccount, setCoinbaseStatus, setSelectedWallet, setError);
          }
        }
      }
    }
    
    // Try coinbaseWalletExtension
    if (window.coinbaseWalletExtension) {
      setCoinbaseStatus('Found coinbaseWalletExtension, connecting...');
      const result = await testCoinbaseProvider(window.coinbaseWalletExtension, 'CoinbaseWalletExtension', setProviderInfo);
      if (result) {
        return await finalizeConnection(result.provider, result.providerName, setAccount, setCoinbaseStatus, setSelectedWallet, setError);
      }
    }
    
    // Try alternate detection
    if (window.ethereum?.isCoinbaseBrowser) {
      setCoinbaseStatus('Found Coinbase Browser, connecting...');
      const result = await testCoinbaseProvider(window.ethereum, 'CoinbaseBrowser', setProviderInfo);
      if (result) {
        return await finalizeConnection(result.provider, result.providerName, setAccount, setCoinbaseStatus, setSelectedWallet, setError);
      }
    }
    
    // If none of the above worked, try a more aggressive approach
    // Sometimes Coinbase Wallet doesn't set the isCoinbaseWallet flag correctly
    if (window.ethereum) {
      setCoinbaseStatus('Trying ethereum directly (last resort)...');
      const result = await testCoinbaseProvider(window.ethereum, 'FallbackEthereum', setProviderInfo);
      if (result) {
        return await finalizeConnection(result.provider, result.providerName, setAccount, setCoinbaseStatus, setSelectedWallet, setError);
      }
    }
    
    setCoinbaseStatus('No Coinbase Wallet provider found');
    setError('Coinbase Wallet not detected or connection failed.');
    return null;
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
    
    setCoinbaseStatus('Connection failed');
    return null;
  }
};

// Helper function to finalize connection after a provider is found
const finalizeConnection = async (provider, providerName, setAccount, setCoinbaseStatus, setSelectedWallet, setError) => {
  try {
    setCoinbaseStatus(`Requesting accounts from ${providerName}...`);
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
    setCoinbaseStatus(`Connected with ${providerName}: ${account}`);
    setSelectedWallet('coinbase');

    // Create ethers provider
    try {
      const ethers = await import('ethers');
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      
      // Get network information
      const network = await ethersProvider.getNetwork();
      setCoinbaseStatus(`Connected to ${providerName} on network ${network.name} (${network.chainId})`);
      
      return account;
    } catch (e) {
      console.error("Error creating ethers provider:", e);
      setError(`Could connect but ethers provider failed: ${e.message}`);
      return account; // Still return the account even if creating the ethers provider failed
    }
  } catch (err) {
    console.error(`Error connecting with ${providerName}:`, err);
    setError(`${providerName} error: ${err.message}`);
    return null;
  }
};