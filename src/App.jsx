// src/App.jsx
import React, { useState } from "react";
import WalletConnector from "./components/WalletConnector";
import CoinbaseTest from "./components/CoinbaseTest";
import "./App.css";

function App() {
  const [showTest, setShowTest] = useState(false);

  return (
    <div className="app">
      {showTest ? (
        <div>
          <CoinbaseTest />
          <button 
            onClick={() => setShowTest(false)}
            style={{
              marginTop: '20px',
              padding: '10px 15px',
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Back to Wallet Connector
          </button>
        </div>
      ) : (
        <div>
          <WalletConnector />
          <button 
            onClick={() => setShowTest(true)}
            style={{
              marginTop: '20px',
              padding: '10px 15px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test Coinbase Only
          </button>
        </div>
      )}
    </div>
  );
}

export default App;