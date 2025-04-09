import React, { useEffect, useState } from "react";
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
    // icon: "❗",
    // bgColor: "bg-accent-red/20",
    borderColor: "border-accent-red",
    textColor: "text-accent-red",
  },
  "Bridge Failed": {
    message:
      "We're having trouble delivering your tokens to the XDC network. Our team has been notified and is working on it. Please contact support if this persists.",
    // icon: "❗",
    // bgColor: "bg-accent-red/20",
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
  const { contribution, connected, loading } = useContributionSocket({
    walletAddress,
    txHash,
    senderAddress,
  });

  // Track previous status for toast notifications
  const prevStatusRef = React.useRef(null);

  // Add state for estimated time
  const [estimatedTotal, setEstimatedTotal] = useState(null);

  // Commented out time remaining implementation for future use
  // const [timeRemaining, setTimeRemaining] = useState(null);

  // Notify parent component when contribution is found
  useEffect(() => {
    if (contribution && onContributionFound) {
      onContributionFound(contribution);
    }

    // Set estimated total time if available in contribution data
    if (contribution && contribution.estimatedTimeMinutes) {
      setEstimatedTotal(contribution.estimatedTimeMinutes);
    }

    // Commented out time remaining calculation for future use
    /*
    if (contribution && contribution.estimatedTimeMinutes) {
      const totalMinutes = contribution.estimatedTimeMinutes;
      const elapsedMinutes = contribution.elapsedMinutes || 0;
      const remaining = Math.max(0, totalMinutes - elapsedMinutes);
      setTimeRemaining(remaining);
    }
    */
  }, [contribution, onContributionFound]);

  // Show toast notifications when status changes
  useEffect(() => {
    if (!contribution || !showToasts || !contribution.status) return;

    // Only show toast if status has changed and is a valid status
    if (prevStatusRef.current !== contribution.status) {
      // Get appropriate message based on status
      const config = statusConfig[contribution.status] || {
        message: "Your purchase is being processed.",
        icon: "📝",
      };

      // Show notification with appropriate style based on status
      if (["Claimable", "Claimed"].includes(contribution.status)) {
        toast.success(`${config.icon} ${config.message}`, { autoClose: 10000 });
      } else if (
        ["Failed", "Bridge Failed", "Swap Failed"].includes(contribution.status)
      ) {
        toast.error(`${config.icon} ${config.message}`, { autoClose: false });
      } else {
        toast.info(`${config.icon} ${config.message}`);
      }

      // Update previous status ref
      prevStatusRef.current = contribution.status;
    }

    // Special notification for contract registration
    if (
      contribution.contractRegistered &&
      contribution.contractTxHash &&
      !prevStatusRef.current?.contractRegistered
    ) {
      toast.success(
        "🎉 Your tokens are ready! You can now claim your $XDCAI tokens.",
        {
          autoClose: 10000,
        }
      );

      // Update previous status ref to include contract registration
      prevStatusRef.current = {
        ...prevStatusRef.current,
        contractRegistered: true,
      };
    }
  }, [contribution, showToasts]);

  // Format time helper function
  const formatTime = (minutes) => {
    if (!minutes) return "Processing...";
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  };

  // Don't render anything if loading or no contribution
  if (loading) {
    return (
      <div className="mb-6 p-4 bg-dark-light border border-[#425152] rounded-lg text-center">
        <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
        <h3 className="text-white font-medium mb-2">
          Checking your purchase status...
        </h3>
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="mb-6 p-4 bg-dark-light border border-[#425152] rounded-lg text-center">
        <h3 className="text-white font-medium mb-2">
          Processing your purchase...
        </h3>
        <p className="text-sm text-gray-light">
          We're confirming your transaction. This may take a few minutes.
        </p>
        <div className="mt-3 w-full bg-dark-darker rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full animate-pulse"
            style={{ width: "60%" }}
          ></div>
        </div>
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

      {/* Commented out time remaining implementation for future use */}
      {/*
      {contribution.status === "Bridging" && timeRemaining && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-light">
            Time remaining: {formatTime(timeRemaining)}
          </p>
          <div className="mt-2 w-full bg-dark-darker rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{
                width: `${Math.min(100, ((estimatedTotal - timeRemaining) / estimatedTotal) * 100)}%`
              }}
            ></div>
          </div>
        </div>
      )}
      */}

      {contribution.contractRegistered && (
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
    </div>
  );
}

export default ContributionStatus;
