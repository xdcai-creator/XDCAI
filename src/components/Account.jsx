import React from 'react';
import { useAccount, useDisconnect, useEnsName } from 'wagmi';

export function Account({ setCurrentScreen }) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  
  // Format the address to show as 0x123...abc
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const displayAddress = ensName || formatAddress(address);

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
        Wallet Connected
      </h2>
      
      <div style={{
        padding: '15px 20px',
        backgroundColor: '#112211',
        border: '1px solid #90EE90',
        borderRadius: '10px',
        color: 'white',
        fontSize: '16px',
        marginBottom: '20px',
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span style={{ marginBottom: '5px', color: '#b0b0b0' }}>Connected Address:</span>
        <span style={{ fontWeight: 'bold' }}>{displayAddress}</span>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '15px',
        width: '100%',
        maxWidth: '520px',
        justifyContent: 'center'
      }}>
        <button
          style={{
            padding: '15px 20px',
            backgroundColor: '#90EE90',
            border: 'none',
            borderRadius: '10px',
            color: 'black',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%'
          }}
          onClick={() => setCurrentScreen(2)}
        >
          Continue to Purchase
        </button>
        
        <button
          style={{
            padding: '15px 20px',
            backgroundColor: 'transparent',
            border: '1px solid #ff4c4c',
            borderRadius: '10px',
            color: '#ff4c4c',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}