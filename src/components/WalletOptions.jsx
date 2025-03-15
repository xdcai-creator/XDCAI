import React, { useEffect } from 'react';
import { useConnect } from 'wagmi';
import { WalletOption } from './WalletOption';

export function WalletOptions({ setSelectedWallet }) {
  const { connectors, connect, isPending, error } = useConnect();
  const [pendingConnector, setPendingConnector] = React.useState(null);
  const [availableConnectors, setAvailableConnectors] = React.useState([]);

  // Define our specific wallets we want to show
  const desiredWallets = [
    { id: 'metaMask', name: 'Metamask' },
    { id: 'walletConnect', name: 'WalletConnect' },
    { id: 'phantom', name: 'Phantom' },
    { id: 'coinbaseWallet', name: 'Coinbase Wallet' }
  ];

  // Manually create our wallet list based on available connectors
  useEffect(() => {
    // Debug log to see what connectors are available
    console.log("All available connectors:", connectors.map(c => ({ id: c.id, name: c.name })));

    // Show exactly the wallets we want, in our specific order
    const manuallyOrderedConnectors = [];
    
    // First add MetaMask
    const metaMaskConnector = connectors.find(c => 
      c.id === 'metaMask' || 
      c.name?.toLowerCase().includes('metamask')
    );
    if (metaMaskConnector) manuallyOrderedConnectors.push(metaMaskConnector);
    
    // Then WalletConnect
    const walletConnectConnector = connectors.find(c => 
      c.id === 'walletConnect' || 
      c.name?.toLowerCase().includes('walletconnect')
    );
    if (walletConnectConnector) manuallyOrderedConnectors.push(walletConnectConnector);
    
    // Then Phantom (often an injected wallet)
    const phantomConnector = connectors.find(c => 
      c.id === 'phantom' || 
      (c.id === 'injected' && !c.name?.toLowerCase().includes('metamask'))
    );
    if (phantomConnector) manuallyOrderedConnectors.push(phantomConnector);
    
    // Then Coinbase Wallet
    const coinbaseConnector = connectors.find(c => 
      c.id === 'coinbaseWallet' || 
      c.name?.toLowerCase().includes('coinbase')
    );
    if (coinbaseConnector) manuallyOrderedConnectors.push(coinbaseConnector);
    
    // Also include any injected connectors that might be browser wallets
    const injectedConnectors = connectors.filter(c => 
      c.id === 'injected' && 
      !manuallyOrderedConnectors.includes(c)
    );
    manuallyOrderedConnectors.push(...injectedConnectors);
    
    // Log our final list for debugging
    console.log("Manually ordered connectors:", manuallyOrderedConnectors.map(c => ({ id: c.id, name: c.name })));
    
    setAvailableConnectors(manuallyOrderedConnectors);
  }, [connectors]);

  // Handle wallet connection
  const handleConnectWallet = (connector) => {
    setSelectedWallet(connector.id);
    setPendingConnector(connector.id);
    connect({ connector });
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '30px 20px',
      backgroundColor: '#0c0c0c',
      color: 'white',
      borderRadius: '12px',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '600',
        textAlign: 'center',
        margin: '10px 0 20px 0'
      }}>
        Connect Wallet
      </h2>
      
      <p style={{
        textAlign: 'center',
        margin: '10px 0',
        color: '#b0b0b0',
        fontSize: '16px',
        maxWidth: '450px'
      }}>
        If you already have a wallet, select it from the options below.
      </p>
      
      <p style={{
        textAlign: 'center',
        margin: '10px 0 30px 0',
        color: '#b0b0b0',
        fontSize: '16px'
      }}>
        If you don't have a wallet, install <a href="https://metamask.io/download.html" target="_blank" rel="noreferrer" style={{ color: '#90EE90', textDecoration: 'none', fontWeight: '500' }}>Metamask</a> to get started.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '520px'
      }}>
        {availableConnectors.length > 0 ? (
          availableConnectors.map((connector) => (
            <WalletOption
              key={connector.uid}
              connector={connector}
              onClick={() => handleConnectWallet(connector)}
              selectedWallet={pendingConnector}
              isPending={isPending && pendingConnector === connector.id}
            />
          ))
        ) : (
          <p style={{ color: '#b0b0b0', textAlign: 'center' }}>
            No wallet connectors available. Please make sure you have a wallet installed.
          </p>
        )}
      </div>

      {/* Show error if any */}
      {error && (
        <p style={{
          marginTop: '20px',
          padding: '10px 15px',
          backgroundColor: 'rgba(255, 76, 76, 0.1)',
          color: '#ff4c4c',
          borderRadius: '5px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '520px'
        }}>
          {error.message}
        </p>
      )}
      
      {/* Show connecting status */}
      {isPending && (
        <p style={{
          marginTop: '20px',
          padding: '10px 15px',
          backgroundColor: 'rgba(144, 238, 144, 0.1)',
          color: '#90EE90',
          borderRadius: '5px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '520px'
        }}>
          Connecting to wallet...
        </p>
      )}
    </div>
  );
}