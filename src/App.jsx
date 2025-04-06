// src/App.jsx
import "./buffer-polyfill";

import React, { useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Solana wallet imports
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// Custom Solana context
import { SolanaWalletProvider } from "./components/wallet/SolanaWalletContext";

import { config } from "./components/config";
import XDCAIPurchaseFlow from "./components/XDCAIPurchaseFlow";
import AdminLogin from "./components/admin/AdminLogin";
import ContributionsDashboard from "./components/admin/ContributionsDashboard";
import { authService } from "./services/api";
import "./App.css";

// Create a React Query client
const queryClient = new QueryClient();

// Admin route component
const AdminRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <AdminLogin />;
};

function App() {
  // Setup Solana wallets
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // Get Solana network endpoint from environment or default to devnet
  const endpoint = useMemo(() => {
    return import.meta.env.VITE_SOLANA_PROVIDER_URL || clusterApiUrl("devnet");
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* Solana wallet providers */}
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {/* Custom Solana wallet provider with additional utilities */}
              <SolanaWalletProvider>
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
                    <Routes>
                      {/* Admin routes */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route
                        path="/admin/*"
                        element={
                          <AdminRoute>
                            <ContributionsDashboard />
                          </AdminRoute>
                        }
                      />

                      {/* Public routes - handled by XDCAIPurchaseFlow */}
                      <Route path="/*" element={<XDCAIPurchaseFlow />} />
                    </Routes>
                  </Router>
                </div>
              </SolanaWalletProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
