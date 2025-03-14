export const connectWalletConnect = async ({ 
  setDisabled, 
  setError, 
  connect 
}) => {
    try {
      setDisabled(true);
      setError(null);
      
      const session = await connect();
      
     
    } catch (err) {
      console.error("WalletConnect error:", err);
      setError(err.message || 'Failed to connect with WalletConnect');
      return null;
    } finally {
      setDisabled(false);
    }
  };
