export const connectPhantom = async ({ 
  setError, 
  setSelectedWallet, 
  setAccount,
  isPhantomInstalled
}) => {
    try {
      setError(null);

      if (!isPhantomInstalled()) {
        window.open('https://phantom.app/', '_blank');
        setError('Please install Phantom to continue');
        return null;
      }

      const { publicKey } = await window.solana.connect();
      setSelectedWallet('phantom');
      setAccount(publicKey.toString());
      return publicKey.toString();
    } catch (error) {
      console.error("Phantom connection error:", error);
      setError(error.message);
      return null;
    }
  };