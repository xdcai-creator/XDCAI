import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WalletOptions } from './WalletOptions';

export function ConnectWallet({ setCurrentScreen, setAccount: setAppAccount }) {
  const { isConnected, address } = useAccount();
  const [selectedWallet, setSelectedWallet] = useState(null);
  
  // Update the app's account state when the wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setAppAccount(address);
      // Automatically proceed to purchase screen when connected
      setCurrentScreen(2);
    }
  }, [isConnected, address, setAppAccount, setCurrentScreen]);
  
  // Skip the Account screen and directly show the WalletOptions
  // The account info will now be shown in the PurchaseScreen
  return <WalletOptions setSelectedWallet={setSelectedWallet} />;
}