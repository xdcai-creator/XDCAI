// src/App.jsx
import React, { useState } from "react";
import XDCAIPurchaseFlow from "./components/XDCAIPurchaseFlow";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";

function App() {
  const [showTest, setShowTest] = useState(false);

  return (
    <div className="app">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {showTest ? (
        <div>
          <button
            onClick={() => setShowTest(false)}
            style={{
              marginTop: "20px",
              padding: "10px 15px",
              backgroundColor: "#6B7280",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Back to Wallet Connector
          </button>
        </div>
      ) : (
        <div>
          <XDCAIPurchaseFlow />
        </div>
      )}
    </div>
  );
}

export default App;
