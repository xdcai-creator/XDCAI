import React, { useState } from 'react';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Buffer } from 'buffer';
window.Buffer = Buffer;

export function SolanaSendToken() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Receiver wallet address
  const RECEIVER_ADDRESS = "5qx3TWES2aM92PWhLhTwhiZmBZQcRQHTAhXfVakWVfnz";

  async function handleSendToken() {
    try {
      setError(null);
      setIsProcessing(true);

      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (!wallet.publicKey) {
        setError('Wallet not connected');
        return;
      }

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(RECEIVER_ADDRESS),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);
      
      alert(`Successfully sent ${amount} SOL to ${RECEIVER_ADDRESS}`);
      setAmount('');
    } catch (error) {
      console.error('Send token error:', error);
      setError(error.message || 'Failed to send tokens');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1a1a1a',
      borderRadius: '10px',
      marginTop: '20px'
    }}>
      <h3 style={{ color: 'white', marginBottom: '15px' }}>Send SOL</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in SOL"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #333',
            borderRadius: '5px',
            color: 'white',
            marginBottom: '10px'
          }}
        />
      </div>

      {error && (
        <div style={{
          color: '#ff4c4c',
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: 'rgba(255, 76, 76, 0.1)',
          borderRadius: '5px'
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSendToken}
        disabled={isProcessing || !wallet.publicKey}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isProcessing ? '#5a8f5a' : '#90EE90',
          border: 'none',
          borderRadius: '5px',
          color: 'black',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isProcessing ? 'Processing...' : 'Send SOL'}
      </button>

      {!wallet.publicKey && (
        <p style={{ color: '#ff4c4c', marginTop: '10px', textAlign: 'center' }}>
          Please connect your wallet first
        </p>
      )}
    </div>
  );
} 