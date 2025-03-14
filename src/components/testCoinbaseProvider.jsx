// Test a specific Coinbase provider
export const testCoinbaseProvider = async (provider, providerName, setProviderInfo) => {
  try {
    console.log(`Testing ${providerName}...`);
    
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

    // We'll return these details to handle in the calling function
    return {
      provider,
      providerName,
      providerDetails
    };
  } catch (err) {
    console.error(`Error with provider ${providerName}:`, err);
    return false;
  }
}