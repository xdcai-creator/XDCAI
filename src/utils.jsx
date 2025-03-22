//src/utils.jsx

// Connect to XDC Network
export const connectToXdcNetwork = async ({
  provider,
  setIsXdcConnected,
  setError,
  XDC_NETWORK,
}) => {
  try {
    setError(null);

    if (!window.ethereum) {
      setError("Please install MetaMask to connect to XDC Network");
      return false;
    }

    try {
      // Try to switch to XDC Network if it's already added
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: XDC_NETWORK.chainId }],
      });
      setIsXdcConnected(true);
      return true;
    } catch (switchError) {
      // This error code means the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
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

          // After adding the network, try to switch to it
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: XDC_NETWORK.chainId }],
          });

          setIsXdcConnected(true);
          return true;
        } catch (addError) {
          console.error("Error adding XDC network:", addError);
          setError(addError.message || "Failed to add XDC network");
          return false;
        }
      } else {
        console.error("Error switching to XDC network:", switchError);
        setError(switchError.message || "Failed to switch to XDC network");
        return false;
      }
    }
  } catch (error) {
    console.error("XDC connection error:", error);
    setError(error.message || "Unknown error connecting to XDC network");
    return false;
  }
};

// Handle wallet selection
export const handleWalletSelection = async ({
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
  XDC_NETWORK,
}) => {
  setError(null);
  setCoinbaseStatus("Not connected");
  setProviderInfo(null);
  let connectedAccount = null;

  try {
    // Extract wallet detector functions from the passed object
    const {
      isMetaMaskInstalled,
      isPhantomInstalled,
      isCoinbaseInstalled,
      isWalletConnectAvailable,
    } = walletDetectors;

    switch (wallet) {
      case "metamask":
        connectedAccount = await connectMetaMask({
          setError,
          setAccount,
          setSelectedWallet,
          setProvider,
          setIsXdcConnected,
          XDC_NETWORK,
          isMetaMaskInstalled,
        });
        break;
      case "walletconnect":
        connectedAccount = await connectWalletConnect({
          setDisabled,
          setError,
          connect,
          setAccount,
          setSelectedWallet,
        });
        break;
      case "phantom":
        connectedAccount = await connectPhantom({
          setError,
          setSelectedWallet,
          setAccount,
          isPhantomInstalled,
        });
        break;
      case "coinbase":
        connectedAccount = await connectCoinbaseWallet({
          setError,
          setCoinbaseStatus,
          setSelectedWallet,
          setAccount,
          setProviderInfo,
          testCoinbaseProvider,
          isCoinbaseInstalled,
        });
        break;
      default:
        setError("Unsupported wallet type");
    }
  } catch (error) {
    console.error(`Error connecting ${wallet} wallet:`, error);
    setError(`Failed to connect ${wallet} wallet: ${error.message}`);
    return null;
  }

  // If we connected successfully, move to the next screen
  if (connectedAccount) {
    setSelectedWallet(wallet);
    setCurrentScreen(2); // Move to purchase screen
    return connectedAccount;
  }

  return null;
};

// Handle currency selection
export const handleCurrencySelect = ({
  currency,
  setSelectedCurrency,
  setShowCurrencySelection,
}) => {
  setSelectedCurrency(currency);
  setShowCurrencySelection(false); // Hide the currency selection screen
};

// Handle purchase
export const handlePurchase = ({
  ethAmount,
  xdcaiAmount,
  selectedCurrency,
  account,
  provider,
  setCurrentScreen,
  setError,
}) => {
  try {
    // Basic input validation
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setError(`Please enter a valid ${selectedCurrency} amount`);
      return;
    }

    if (!xdcaiAmount || parseFloat(xdcaiAmount) <= 0) {
      setError("Please enter a valid XDCAI amount");
      return;
    }

    if (!account) {
      setError("No connected wallet account found");
      return;
    }

    // In a real app, this would perform the purchase transaction
    console.log(
      `Purchasing ${xdcaiAmount} XDCAI with ${ethAmount} ${selectedCurrency} from account ${account}`
    );

    // Here you would typically:
    // 1. Validate inputs
    // 2. Convert amounts
    // 3. Send the transaction through the provider
    // 4. Handle transaction response

    setCurrentScreen(3); // Move to thank you screen
  } catch (error) {
    console.error("Purchase error:", error);
    setError(`Purchase failed: ${error.message}`);
  }
};

// Handle claim
export const handleClaim = ({ account, provider, setError }) => {
  try {
    // Validate we have an account
    if (!account) {
      setError("No connected wallet account found");
      return;
    }

    // In a real app, this would perform the token claiming transaction
    console.log(`Claiming tokens for account ${account}`);

    // Here you would typically:
    // 1. Create a claim transaction
    // 2. Send through the provider
    // 3. Handle transaction response

    // For this demo, we'll just show an alert
    alert("Tokens claimed successfully!");
  } catch (error) {
    console.error("Claim error:", error);
    setError(`Claim failed: ${error.message}`);
  }
};
