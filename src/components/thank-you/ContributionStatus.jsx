import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import useContributionSocket from "../../hooks/useContributionSocket";

// Map status to user-friendly messages and styles
const statusConfig = {
  Detected: {
    message:
      "Your purchase has been detected! We're processing your tokens now.",
    icon: "✅",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500",
    textColor: "text-blue-500",
  },
  "Pending Bridge": {
    message: "Your tokens are being prepared for delivery to the XDC network.",
    icon: "⏳",
    bgColor: "bg-blue-700/20",
    borderColor: "border-blue-700",
    textColor: "text-blue-400",
  },
  Bridging: {
    message:
      "Your tokens are on their way to the XDC network. This may take a few minutes.",
    icon: "🔄",
    bgColor: "bg-blue-700/20",
    borderColor: "border-blue-700",
    textColor: "text-blue-400",
  },
  Bridged: {
    message:
      "Almost there! Your tokens have been delivered to the XDC network.",
    icon: "✅",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500",
    textColor: "text-green-500",
  },
  "Registration Pending": {
    message:
      "Your tokens have been delivered and are being prepared for claiming.",
    icon: "⏳",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500",
    textColor: "text-orange-500",
  },
  Claimable: {
    message: "Great news! Your $XDCAI tokens are ready to claim.",
    icon: "🎁",
    bgColor: "bg-primary/20",
    borderColor: "border-primary",
    textColor: "text-primary",
  },
  Claimed: {
    message:
      "Congratulations! Your $XDCAI tokens have been claimed successfully.",
    icon: "💰",
    bgColor: "bg-primary/20",
    borderColor: "border-primary",
    textColor: "text-primary",
  },
  Failed: {
    message:
      "We encountered an issue with your purchase. Please contact our support team for assistance.",
    icon: "❗",
    bgColor: "bg-accent-red/20",
    borderColor: "border-accent-red",
    textColor: "text-accent-red",
  },
  "Bridge Failed": {
    message:
      "We're having trouble delivering your tokens to the XDC network. Our team has been notified and is working on it. Please contact support if this persists.",
    icon: "❗",
    bgColor: "bg-accent-red/20",
    borderColor: "border-accent-red",
    textColor: "text-accent-red",
  },
  "Swap Failed": {
    message:
      "There was an issue processing your purchase. Please contact our support team for assistance.",
    icon: "❗",
    bgColor: "bg-accent-red/20",
    borderColor: "border-accent-red",
    textColor: "text-accent-red",
  },
};

/**
 * ContributionStatus component
 * Shows the current status of a contribution from WebSocket connection
 * @param {string} txHash - Transaction hash
 * @param {string} walletAddress - Current wallet address
 * @param {string} senderAddress - Original sender wallet address
 * @param {boolean} showToasts - Whether to show toast notifications
 * @param {function} onContributionFound - Callback when contribution is found
 */
function ContributionStatus({
  txHash,
  walletAddress,
  senderAddress,
  showToasts = true,
  onContributionFound,
}) {
  const { contribution, connected, loading, refetch, meta } =
    useContributionSocket({
      walletAddress,
      txHash,
      senderAddress,
    });

  console.log("txHash in Cintrib status ", txHash);
  console.log("tcontribution ", contribution);

  // Track previous status for toast notifications
  const prevStatusRef = useRef(null);
  // Track toast notifications to prevent duplicates
  const toastIdsRef = useRef({});
  // Track shown contract registration notification
  const contractRegShownRef = useRef(false);

  // Add state for estimated time
  const [estimatedTotal, setEstimatedTotal] = useState(null);
  // Add state for tracking initial loading experience
  const [initialLoadingTime, setInitialLoadingTime] = useState(0);
  const [lastRefetchTime, setLastRefetchTime] = useState(Date.now());
  const [waitingPhase, setWaitingPhase] = useState("initial"); // "initial" -> "waiting" -> "extended"
  // Add debug state
  const [debugVisible, setDebugVisible] = useState(false);

  // Reset contract registration flag when component mounts or txHash changes
  useEffect(() => {
    contractRegShownRef.current = false;
    toastIdsRef.current = {};
    prevStatusRef.current = null;
  }, [txHash]);

  // Update waiting phases based on time elapsed
  useEffect(() => {
    if (contribution) return; // Skip if contribution is already found

    const timer = setInterval(() => {
      const currentTime = Date.now();
      const secondsElapsed = Math.floor((currentTime - lastRefetchTime) / 1000);

      // Increment loading time counter
      setInitialLoadingTime((prev) => prev + 1);

      // Auto-refetch on intervals
      if (secondsElapsed >= 15) {
        // Refetch every 15 seconds
        refetch();
        setLastRefetchTime(currentTime);
      }

      // Update waiting phase based on total time spent waiting
      if (initialLoadingTime > 30 && waitingPhase === "initial") {
        setWaitingPhase("waiting");
      } else if (initialLoadingTime > 120 && waitingPhase === "waiting") {
        setWaitingPhase("extended");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    contribution,
    initialLoadingTime,
    lastRefetchTime,
    waitingPhase,
    refetch,
  ]);

  useEffect(() => {
    // Clear all transaction-related toast notifications when the component mounts
    // or when txHash changes
    toast.dismiss();

    // Reset all refs and state
    contractRegShownRef.current = false;
    toastIdsRef.current = {};
    prevStatusRef.current = null;
    setEstimatedTotal(null);
    setInitialLoadingTime(0);
    setLastRefetchTime(Date.now());
    setWaitingPhase("initial");

    return () => {
      // Also clear toasts when the component unmounts
      toast.dismiss();
    };
  }, [txHash]);

  // Notify parent component when contribution is found
  useEffect(() => {
    if (contribution && onContributionFound) {
      onContributionFound(contribution);
    }

    // Set estimated total time if available in contribution data
    if (contribution && contribution.estimatedTimeMinutes) {
      setEstimatedTotal(contribution.estimatedTimeMinutes);
    }
  }, [contribution, onContributionFound]);

  // Show toast notifications when status changes
  useEffect(() => {
    if (!contribution || !showToasts || !contribution.status) return;

    // Only show toast if status has changed
    if (prevStatusRef.current !== contribution.status) {
      // Get appropriate message based on status
      const config = statusConfig[contribution.status] || {
        message: "Your purchase is being processed.",
        icon: "📝",
      };

      // Clear any existing toast for this status type
      if (toastIdsRef.current[contribution.status]) {
        toast.dismiss(toastIdsRef.current[contribution.status]);
      }

      // Show notification with appropriate style based on status
      let toastId;
      if (["Claimable", "Claimed"].includes(contribution.status)) {
        toastId = toast.success(`${config.icon} ${config.message}`, {
          autoClose: 10000,
          toastId: `status-${contribution.status}-${Date.now()}`, // Ensure uniqueness
        });
      } else if (
        ["Failed", "Bridge Failed", "Swap Failed"].includes(contribution.status)
      ) {
        toastId = toast.error(`${config.message}`, {
          autoClose: false,
          toastId: `status-${contribution.status}-${Date.now()}`,
        });
      } else {
        toastId = toast.info(`${config.icon} ${config.message}`, {
          toastId: `status-${contribution.status}-${Date.now()}`,
        });
      }

      // Store the toast ID for later reference
      toastIdsRef.current[contribution.status] = toastId;

      // Update previous status ref
      prevStatusRef.current = contribution.status;
    }

    // Separate notification for contract registration, only show once per component lifecycle
    if (
      contribution.contractRegistered &&
      contribution.contractTxHash &&
      !contractRegShownRef.current
    ) {
      toast.success(
        "🎉 Your tokens are ready! You can now claim your $XDCAI tokens.",
        {
          autoClose: 10000,
          toastId: `contract-registered-${Date.now()}`,
        }
      );

      // Mark contract registration as shown
      contractRegShownRef.current = true;
    }
  }, [contribution, showToasts]);

  // Format time helper function
  const formatTime = (minutes) => {
    if (!minutes) return "Processing...";
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  };

  // If still loading but we don't have a contribution yet, show a contextual waiting message
  if (!contribution) {
    const waitingMessages = {
      initial: {
        title: "Processing your purchase...",
        message:
          "We're confirming your transaction. This may take a few minutes.",
        width: "30%",
      },
      waiting: {
        title: "Still processing your purchase...",
        message:
          "Your transaction is in our processing queue. This can take 5-10 minutes as we verify and prepare your tokens.",
        width: "60%",
      },
      extended: {
        title: "Transaction in processing queue",
        message:
          "Your transaction is in our processing queue. Because of high volume, it's taking longer than usual to process. Please be patient - it has not failed.",
        width: "80%",
      },
    };

    const currentPhase = waitingMessages[waitingPhase];

    return (
      <div className="mb-6 p-4 bg-dark-light border border-[#425152] rounded-lg text-center">
        <h3 className="text-white font-medium mb-2">{currentPhase.title}</h3>
        <p className="text-sm text-gray-light mb-3">{currentPhase.message}</p>
        <div className="mt-3 w-full bg-dark-darker rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full animate-pulse"
            style={{ width: currentPhase.width }}
          ></div>
        </div>

        {waitingPhase === "extended" && (
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-primary/20 border border-primary rounded-md text-primary text-sm hover:bg-primary/30 transition-colors"
          >
            Check Again
          </button>
        )}
      </div>
    );
  }

  // Get styling config for current status
  const config = statusConfig[contribution.status] || {
    message: "Your purchase is being processed.",
    icon: "📝",
    bgColor: "bg-dark-light",
    borderColor: "border-[#425152]",
    textColor: "text-white",
  };

  return (
    <div
      className={`mb-6 p-4 ${config.bgColor} border ${config.borderColor} rounded-lg`}
    >
      <div className="flex items-center justify-center mb-2">
        <span className="text-2xl mr-2">{config.icon}</span>
        <h3 className={`${config.textColor} font-bold text-center`}>
          {["Failed", "Bridge Failed", "Swap Failed"].includes(
            contribution.status
          )
            ? "Action Required"
            : "Purchase Status"}
        </h3>
      </div>

      <p className="text-white text-center mb-3">{config.message}</p>

      {/* Display estimated time for Bridging status */}
      {contribution.status === "Bridging" && estimatedTotal && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-light">
            Estimated processing time: {formatTime(estimatedTotal)}
          </p>
          <div className="mt-2 w-full bg-dark-darker rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      )}

      {/* Only show the contract registered box if status is Claimable */}
      {contribution.contractRegistered && contribution.status === "Claimable" && (
        <div className="bg-primary/10 p-3 rounded-lg mt-3">
          <p className="text-primary text-center text-sm">
            🎉 Your tokens are now ready to claim!
          </p>
        </div>
      )}

      {/* Show shortened transaction reference if available */}
      {contribution.sourceTxHash && contribution.status !== "Failed" && (
        <div className="mt-3 text-xs text-gray-light text-center">
          Reference ID: {contribution.sourceTxHash.slice(0, 6)}...
          {contribution.sourceTxHash.slice(-4)}
        </div>
      )}

      {/* Add contact support button for failed transactions */}
      {["Failed", "Bridge Failed", "Swap Failed"].includes(
        contribution.status
      ) && (
        <button
          onClick={() =>
            window.open(
              "mailto:support@xdcai.com?subject=Transaction%20Support%20Request",
              "_blank"
            )
          }
          className="mt-3 w-full py-2 bg-accent-red/30 border border-accent-red rounded-lg text-white hover:bg-accent-red/40 transition-colors"
        >
          Contact Support
        </button>
      )}

      {/* Debug information (toggle visibility) */}
      <div className="mt-4 text-xs text-gray-400">
        <button
          onClick={() => setDebugVisible(!debugVisible)}
          className="text-xs underline"
        >
          {debugVisible ? "Hide Debug Info" : "Show Debug Info"}
        </button>

        {debugVisible && (
          <div className="mt-1 p-2 bg-dark-darker rounded text-left">
            <div>Status: {contribution.status || "None"}</div>
            <div>
              Contract Registered:{" "}
              {contribution.contractRegistered ? "Yes" : "No"}
            </div>
            <div>Update Source: {contribution._updateSource || "Unknown"}</div>
            <div>
              Last Update:{" "}
              {new Date(contribution.lastUpdated).toLocaleTimeString()}
            </div>
            <div>Bridge Task: {contribution.bridgeTaskId || "None"}</div>
            <div>Source Chain: {contribution.sourceChain || "Unknown"}</div>
            <div>Source Token: {contribution.sourceToken || "Unknown"}</div>
            <div>
              Transaction Hash: {contribution.sourceTxHash?.slice(0, 10)}...
            </div>
            {meta && (
              <>
                <div>Last Update Type: {meta.lastUpdateType || "Unknown"}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContributionStatus;
