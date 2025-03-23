// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { config } from "./components/config";
import { InitialScreen } from "./components/InitialScreen";
import { ConnectWallet } from "./components/ConnectWallet";
import { PurchaseScreen } from "./components/PurchaseScreen";
import { ThankYouScreen } from "./components/ThankYouScreen";
import { ClaimScreen } from "./components/ClaimScreen";
import ProtectedRoute from "./components/ProtectedRoute"; // We'll create this component
import "./App.css";
import XDCAIPurchaseFlow from "./components/XDCAIPurchaseFlow";

// Create a React Query client
const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
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
          <Router>
            <XDCAIPurchaseFlow />
          </Router>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
