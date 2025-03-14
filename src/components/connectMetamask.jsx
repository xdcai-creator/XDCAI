export  const connectMetaMask = async ({ 
  setError, 
  setAccount,
  setSelectedWallet,
  setProvider,
  setIsXdcConnected,
  XDC_NETWORK,
  isMetaMaskInstalled
}) => {
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