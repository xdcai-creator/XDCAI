import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";

// Define separate URLs for API and WebSocket
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3500";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

/**
 * Custom hook for receiving real-time contribution status updates
 * with REST API fallback polling
 * @param {Object} options Configuration options
 * @param {string} options.walletAddress User's wallet address to subscribe to
 * @param {string} options.txHash Transaction hash to track
 * @param {string} options.senderAddress Original source wallet that sent the transaction
 * @param {number} options.pollingInterval Interval in ms to poll REST API (default: 15000)
 * @returns {Object} Status and contribution data
 */
function useContributionSocket({
  walletAddress,
  txHash,
  senderAddress,
  pollingInterval = 15000,
}) {
  // Store the latest contribution data
  const [contribution, setContribution] = useState(null);
  // Track connection status
  const [connected, setConnected] = useState(false);
  // Track loading state
  const [loading, setLoading] = useState(true);
  // Reference to socket.io instance
  const socketRef = useRef(null);
  // Reference to track last update time
  const lastUpdateRef = useRef(new Date());
  // Reference to track polling interval
  const pollingIntervalRef = useRef(null);
  // Track if we've subscribed to a bridge task
  const bridgeSubscribedRef = useRef(false);
  // Store current txHash for comparisons
  const currentTxHashRef = useRef(txHash);
  // Store metadata about the contribution for debugging
  const contributionMetaRef = useRef({
    sourceTxHash: null,
    lastUpdateType: null,
    createdAt: null,
  });

  // Reset state when txHash changes
  useEffect(() => {
    // If txHash changes, reset everything
    if (txHash !== currentTxHashRef.current) {
      console.log("Transaction hash changed, resetting state");
      // Reset contribution state
      setContribution(null);
      // Reset bridge subscription
      bridgeSubscribedRef.current = false;
      // Reset meta info
      contributionMetaRef.current = {
        sourceTxHash: null,
        lastUpdateType: null,
        createdAt: null,
      };
      // Update current txHash ref
      currentTxHashRef.current = txHash;

      // Clear any active socket connections
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [txHash]);

  // Define status priority for determining which updates to apply
  const getStatusPriority = useCallback((status) => {
    const priorities = {
      Detected: 1,
      "Pending Bridge": 2,
      Bridging: 3,
      Bridged: 4,
      "Registration Pending": 5,
      Claimable: 6,
      Claimed: 7,
      Failed: 100,
      "Bridge Failed": 100,
      "Swap Failed": 100,
    };
    return priorities[status] || 0;
  }, []);

  // Helper to determine if an update should replace current state
  const shouldUpdateContribution = useCallback(
    (currentData, newData) => {
      // If we don't have current data, always accept new data
      if (!currentData) return true;

      // If this is the same transaction, always accept updates
      if (
        currentData.sourceTxHash &&
        newData.sourceTxHash &&
        currentData.sourceTxHash === newData.sourceTxHash
      ) {
        return true;
      }

      // If new data has a status and current doesn't, accept it
      if (!currentData.status && newData.status) return true;

      // If both have status, compare priorities
      if (currentData.status && newData.status) {
        return (
          getStatusPriority(newData.status) >=
          getStatusPriority(currentData.status)
        );
      }

      // For updates without status, accept if it's for the same transaction
      if (newData._id && currentData._id && newData._id === currentData._id) {
        return true;
      }

      // Default to reject if we can't determine
      return false;
    },
    [getStatusPriority]
  );

  // Handler for wallet-specific updates
  const handleWalletUpdate = useCallback(
    (data) => {
      console.log("Wallet update received:", data);
      if (data.event === "contribution-update") {
        setContribution((prevState) => {
          // Skip if this is an update for a different transaction than we're tracking
          if (txHash && data.sourceTxHash && txHash !== data.sourceTxHash) {
            console.log("Ignoring update for different transaction");
            return prevState;
          }

          if (shouldUpdateContribution(prevState, data)) {
            contributionMetaRef.current.lastUpdateType = "wallet";
            contributionMetaRef.current.sourceTxHash =
              data.sourceTxHash || contributionMetaRef.current.sourceTxHash;

            return {
              ...data,
              lastUpdated: new Date(),
              _updateSource: "wallet",
            };
          }
          return prevState;
        });

        lastUpdateRef.current = new Date();

        // Check if this update includes a bridgeTaskId that we need to subscribe to
        if (
          data.bridgeTaskId &&
          socketRef.current &&
          !bridgeSubscribedRef.current
        ) {
          console.log("Subscribing to bridge task:", data.bridgeTaskId);
          socketRef.current.emit("subscribe-bridge-task", data.bridgeTaskId);
          bridgeSubscribedRef.current = true;
        }
      }
    },
    [txHash, shouldUpdateContribution]
  );

  // Handler for transaction-specific updates
  const handleTxUpdate = useCallback(
    (data) => {
      console.log("Transaction update received:", data);
      if (data.event === "status-update") {
        setContribution((prevState) => {
          if (shouldUpdateContribution(prevState, data)) {
            contributionMetaRef.current.lastUpdateType = "tx";
            contributionMetaRef.current.sourceTxHash =
              data.sourceTxHash || contributionMetaRef.current.sourceTxHash;

            return {
              ...data,
              lastUpdated: new Date(),
              _updateSource: "tx",
            };
          }
          return prevState;
        });

        lastUpdateRef.current = new Date();

        // Check if this update includes a bridgeTaskId that we need to subscribe to
        if (
          data.bridgeTaskId &&
          socketRef.current &&
          !bridgeSubscribedRef.current
        ) {
          console.log("Subscribing to bridge task:", data.bridgeTaskId);
          socketRef.current.emit("subscribe-bridge-task", data.bridgeTaskId);
          bridgeSubscribedRef.current = true;
        }
      }
    },
    [shouldUpdateContribution]
  );

  // Handler for bridge-specific updates
  const handleBridgeUpdate = useCallback(
    (data) => {
      console.log("Bridge update received:", data);

      // Only perform update if the data actually has meaningful content
      if (
        !data ||
        (!data.status && !data.estimatedTimeSeconds && !data.estimatedTotal)
      ) {
        console.log("Ignoring empty bridge update");
        return;
      }

      setContribution((prevState) => {
        // Don't update if we don't have previous state
        if (!prevState) return prevState;

        // Only apply bridge updates to the correct transaction
        if (
          contributionMetaRef.current.sourceTxHash &&
          data.txHash &&
          contributionMetaRef.current.sourceTxHash !== data.txHash
        ) {
          console.log("Ignoring bridge update for different transaction");
          return prevState;
        }

        // Create new state with only meaningful updates
        const newState = {
          ...prevState,
          _updateSource: "bridge",
          lastUpdated: new Date(),
        };

        // Only update these fields if they exist in the data
        if (data.estimatedTimeSeconds?.avg) {
          newState.estimatedTimeMinutes = Math.ceil(
            data.estimatedTimeSeconds.avg / 60
          );
        } else if (data.estimatedTotal) {
          newState.estimatedTimeMinutes = data.estimatedTotal;
        }

        if (data.elapsedMinutes) {
          newState.elapsedMinutes = data.elapsedMinutes;
        }

        // Only update status if it's provided and it's a valid transition
        if (data.status && data.status !== "") {
          const currentPriority = getStatusPriority(prevState.status);
          const newPriority = getStatusPriority(data.status);

          // Only update if new status has higher or equal priority
          if (!prevState.status || newPriority >= currentPriority) {
            newState.status = data.status;
          }
        }

        return newState;
      });

      lastUpdateRef.current = new Date();
    },
    [getStatusPriority]
  );

  // Function to manually check status via REST API
  const fetchContributionStatus = useCallback(async () => {
    if (!txHash && !walletAddress && !senderAddress) return;

    try {
      setLoading(true);

      // First try to get status by transaction hash
      if (txHash) {
        const response = await fetch(
          `${API_URL}/api/transactions/contribution/status-by-hash/${txHash}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.found) {
          console.log("REST API update:", data);

          // Store creation date for this transaction
          if (data.createdAt && !contributionMetaRef.current.createdAt) {
            contributionMetaRef.current.createdAt = data.createdAt;
          }

          // Update the contribution state if this is the right transaction
          setContribution((prevState) => {
            if (shouldUpdateContribution(prevState, data)) {
              contributionMetaRef.current.lastUpdateType = "api";
              contributionMetaRef.current.sourceTxHash =
                data.sourceTxHash || contributionMetaRef.current.sourceTxHash;

              return {
                ...data,
                lastUpdated: new Date(),
                _updateSource: "api",
              };
            }
            return prevState;
          });

          lastUpdateRef.current = new Date();

          // Check if we need to subscribe to bridge updates
          if (
            data.bridgeTaskId &&
            socketRef.current &&
            !bridgeSubscribedRef.current
          ) {
            console.log(
              "Subscribing to bridge task from API response:",
              data.bridgeTaskId
            );
            socketRef.current.emit("subscribe-bridge-task", data.bridgeTaskId);
            bridgeSubscribedRef.current = true;
          }

          return;
        }
      }

      // If not found by hash, try to look up via sender address
      if (senderAddress) {
        const senderResponse = await fetch(
          `${API_URL}/api/transactions/contributions?walletAddress=${senderAddress}`
        );

        if (!senderResponse.ok) {
          throw new Error(`API error: ${senderResponse.status}`);
        }

        const senderData = await senderResponse.json();

        if (senderData.contributions && senderData.contributions.length > 0) {
          // Find the most recent contribution
          const sorted = [...senderData.contributions].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          // Find the contribution that matches our txHash if provided
          const matchingContribution = txHash
            ? sorted.find((c) => c.sourceTxHash === txHash)
            : sorted[0];

          // Use the matching contribution or fallback to most recent
          const targetContribution = matchingContribution || sorted[0];

          console.log("REST API update (sender):", targetContribution);

          // Store creation date for this transaction
          if (
            targetContribution.createdAt &&
            !contributionMetaRef.current.createdAt
          ) {
            contributionMetaRef.current.createdAt =
              targetContribution.createdAt;
          }

          // Only update if this is a newer contribution than what we're tracking
          setContribution((prevState) => {
            if (shouldUpdateContribution(prevState, targetContribution)) {
              contributionMetaRef.current.lastUpdateType = "sender";
              contributionMetaRef.current.sourceTxHash =
                targetContribution.sourceTxHash ||
                contributionMetaRef.current.sourceTxHash;

              return {
                ...targetContribution,
                lastUpdated: new Date(),
                _updateSource: "sender",
              };
            }
            return prevState;
          });

          lastUpdateRef.current = new Date();

          // Check if we need to subscribe to bridge updates
          if (
            targetContribution.bridgeTaskId &&
            socketRef.current &&
            !bridgeSubscribedRef.current
          ) {
            console.log(
              "Subscribing to bridge task from sender lookup:",
              targetContribution.bridgeTaskId
            );
            socketRef.current.emit(
              "subscribe-bridge-task",
              targetContribution.bridgeTaskId
            );
            bridgeSubscribedRef.current = true;
          }

          return;
        }
      }

      // As a last resort, try the wallet address
      if (walletAddress && walletAddress !== senderAddress) {
        const walletResponse = await fetch(
          `${API_URL}/api/transactions/contributions?walletAddress=${walletAddress}`
        );

        if (!walletResponse.ok) {
          throw new Error(`API error: ${walletResponse.status}`);
        }

        const walletData = await walletResponse.json();

        if (walletData.contributions && walletData.contributions.length > 0) {
          // Find the most recent contribution
          const sorted = [...walletData.contributions].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          // Find the contribution that matches our txHash if provided
          const matchingContribution = txHash
            ? sorted.find((c) => c.sourceTxHash === txHash)
            : sorted[0];

          // Use the matching contribution or fallback to most recent
          const targetContribution = matchingContribution || sorted[0];

          console.log("REST API update (wallet):", targetContribution);

          // Store creation date for this transaction
          if (
            targetContribution.createdAt &&
            !contributionMetaRef.current.createdAt
          ) {
            contributionMetaRef.current.createdAt =
              targetContribution.createdAt;
          }

          // Only update if this is a newer contribution than what we're tracking
          setContribution((prevState) => {
            if (shouldUpdateContribution(prevState, targetContribution)) {
              contributionMetaRef.current.lastUpdateType = "wallet";
              contributionMetaRef.current.sourceTxHash =
                targetContribution.sourceTxHash ||
                contributionMetaRef.current.sourceTxHash;

              return {
                ...targetContribution,
                lastUpdated: new Date(),
                _updateSource: "wallet",
              };
            }
            return prevState;
          });

          lastUpdateRef.current = new Date();

          // Check if we need to subscribe to bridge updates
          if (
            targetContribution.bridgeTaskId &&
            socketRef.current &&
            !bridgeSubscribedRef.current
          ) {
            console.log(
              "Subscribing to bridge task from wallet lookup:",
              targetContribution.bridgeTaskId
            );
            socketRef.current.emit(
              "subscribe-bridge-task",
              targetContribution.bridgeTaskId
            );
            bridgeSubscribedRef.current = true;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching contribution status via REST API:", error);
    } finally {
      setLoading(false);
    }
  }, [txHash, senderAddress, walletAddress, shouldUpdateContribution]);

  // Setup socket connection
  useEffect(() => {
    // Skip if no wallet address or transaction hash
    if (!walletAddress && !txHash && !senderAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Reset state
    setContribution(null);
    bridgeSubscribedRef.current = false;

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
        // DO NOT subscribe to bridge updates here - wait until we have a bridgeTaskId
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

    // Fetch initial status
    fetchContributionStatus();

    setLoading(false);

    // Cleanup on unmount
    return () => {
      socket.off("wallet-update", handleWalletUpdate);
      socket.off("tx-update", handleTxUpdate);
      socket.off("bridge-update", handleBridgeUpdate);
      socket.disconnect();

      // Reset state
      setContribution(null);
      contributionMetaRef.current = {
        sourceTxHash: null,
        lastUpdateType: null,
        createdAt: null,
      };

      // Clear any active toast notifications related to transactions
      if (typeof toast !== "undefined" && toast.dismiss) {
        toast.dismiss();
      }

      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [
    walletAddress,
    txHash,
    senderAddress,
    handleWalletUpdate,
    handleTxUpdate,
    handleBridgeUpdate,
    fetchContributionStatus,
  ]);

  // Set up REST API polling as a fallback
  useEffect(() => {
    // Start polling
    pollingIntervalRef.current = setInterval(() => {
      // Calculate time since last update
      const now = new Date();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      // Only poll if no updates received in the past polling interval
      // This prevents unnecessary API calls if websocket is working
      if (timeSinceLastUpdate >= pollingInterval) {
        console.log(
          `No updates received in ${pollingInterval}ms, polling REST API...`
        );
        fetchContributionStatus();
      }
    }, pollingInterval);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchContributionStatus, pollingInterval]);

  return {
    contribution,
    connected,
    loading,
    // Expose manual refetch function
    refetch: fetchContributionStatus,
    // Expose debug metadata
    meta: contributionMetaRef.current,
  };
}

export default useContributionSocket;
