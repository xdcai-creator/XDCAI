// src/App.jsx
import React, { useState } from "react";
import WalletConnector from "./components/WalletConnector";

import "./App.css";

function App() {
  const [showTest, setShowTest] = useState(false);

  return (
    <div className="app">
      {showTest ? (
        <div>
       
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
         
        </div>
      )}
    </div>
  );
}

export default App;