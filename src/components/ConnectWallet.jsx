import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WalletOptions } from './WalletOptions';
import { Account } from './Account';

export function ConnectWallet({ setCurrentScreen, setAccount: setAppAccount }) {
  const { isConnected, address } = useAccount();
  const [selectedWallet, setSelectedWallet] = useState(null);
  
  // Update the app's account state when the wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setAppAccount(address);
    }
  }, [isConnected, address, setAppAccount]);
  
  if (isConnected) {
    return <Account setCurrentScreen={setCurrentScreen} />;
  }
  
  return <WalletOptions setSelectedWallet={setSelectedWallet} />;
}