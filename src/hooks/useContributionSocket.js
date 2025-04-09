import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";

// Define separate URLs for API and WebSocket
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3500";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

/**
 * Custom hook for receiving real-time contribution status updates
 * @param {Object} options Configuration options
 * @param {string} options.walletAddress User's wallet address to subscribe to
 * @param {string} options.txHash Transaction hash to track
 * @param {string} options.senderAddress Original source wallet that sent the transaction
 * @returns {Object} Status and contribution data
 */
function useContributionSocket({ walletAddress, txHash, senderAddress }) {
  // Store the latest contribution data
  const [contribution, setContribution] = useState(null);
  // Track connection status
  const [connected, setConnected] = useState(false);
  // Track loading state
  const [loading, setLoading] = useState(true);
  // Reference to socket.io instance
  const socketRef = useRef(null);

  // Handler for wallet-specific updates
  const handleWalletUpdate = useCallback((data) => {
    console.log("Wallet update received:", data);
    if (data.event === "contribution-update") {
      setContribution((prevState) => ({
        ...prevState,
        ...data, // Use data directly as per backend implementation
        lastUpdated: new Date(),
      }));
    }
  }, []);

  // Handler for transaction-specific updates
  const handleTxUpdate = useCallback((data) => {
    console.log("Transaction update received:", data);
    if (data.event === "status-update") {
      setContribution((prevState) => ({
        ...prevState,
        ...data, // Use data directly as per backend implementation
        lastUpdated: new Date(),
      }));
    }
  }, []);

  // Handler for bridge-specific updates
  const handleBridgeUpdate = useCallback((data) => {
    console.log("Bridge update received:", data);
    // if (data.event === "bridge-update") {
    setContribution((prevState) => ({
      ...prevState,
      // ...data,

      estimatedTimeMinutes: data.estimatedTimeSeconds?.avg
        ? Math.ceil(data.estimatedTimeSeconds.avg / 60)
        : data.estimatedTotal || null,
      elapsedMinutes: data.elapsedMinutes || null,
      lastUpdated: new Date(),
    }));
    // }
  }, []);

  // Setup socket connection
  useEffect(() => {
    // Skip if no wallet address or transaction hash
    if (!walletAddress && !txHash && !senderAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Setup event handlers
    socket.on("connect", () => {
      console.log("WebSocket connected");
      setConnected(true);

      // Subscribe to wallet updates if wallet address provided
      if (walletAddress) {
        socket.emit("subscribe-wallet", walletAddress);
      }

      // Subscribe to sender wallet updates if different from current wallet
      if (senderAddress && senderAddress !== walletAddress) {
        socket.emit("subscribe-wallet", senderAddress);
      }

      // Subscribe to transaction updates if txHash provided
      if (txHash) {
        socket.emit("subscribe-tx", txHash);

        // Also subscribe to bridge updates if available
        socket.emit("subscribe-bridge-task", txHash);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setConnected(false);
    });

    // Listen for wallet-specific updates
    socket.on("wallet-update", handleWalletUpdate);

    // Listen for transaction-specific updates
    socket.on("tx-update", handleTxUpdate);

    // Listen for bridge-specific updates
    socket.on("bridge-update", handleBridgeUpdate);

    setLoading(false);

    // Cleanup on unmount
    return () => {
      socket.off("wallet-update", handleWalletUpdate);
      socket.off("tx-update", handleTxUpdate);
      socket.off("bridge-update", handleBridgeUpdate);
      socket.disconnect();
    };
  }, [
    walletAddress,
    txHash,
    senderAddress,
    handleWalletUpdate,
    handleTxUpdate,
    handleBridgeUpdate,
  ]);

  // Function to manually check initial status via API
  const fetchInitialStatus = useCallback(async () => {
    if (!txHash) return;

    try {
      setLoading(true);

      // First try to get status by transaction hash
      const response = await fetch(
        `${API_URL}/api/transactions/contribution/status-by-hash/${txHash}`
      );
      const data = await response.json();

      if (data.found) {
        setContribution(data);
        return;
      }

      // If not found by hash, try to look up via sender address
      if (senderAddress) {
        const senderResponse = await fetch(
          `${SOCKET_URL}/api/transactions/contributions?walletAddress=${senderAddress}`
        );
        const senderData = await senderResponse.json();

        if (senderData.contributions && senderData.contributions.length > 0) {
          // Find the most recent contribution
          const sorted = [...senderData.contributions].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          setContribution(sorted[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching initial contribution status:", error);
    } finally {
      setLoading(false);
    }
  }, [txHash, senderAddress]);

  // Fetch initial status when component mounts
  useEffect(() => {
    fetchInitialStatus();
  }, [fetchInitialStatus]);

  return {
    contribution,
    connected,
    loading,
    refetch: fetchInitialStatus,
  };
}

export default useContributionSocket;
