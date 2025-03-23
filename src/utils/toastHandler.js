// src/utils/toastHandler.js
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Toast configuration
const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark",
};

// Error message mapping - maps internal errors to user-friendly messages
const errorMessageMap = {
  "Insufficient XDCAI tokens":
    "Purchase amount exceeds available tokens. Please try a smaller amount or contact support.",
  "execution reverted":
    "Transaction failed. Please try again or contact support if the issue persists.",
  "user rejected": "Transaction was cancelled.",
  "transaction may fail":
    "Unable to process transaction. Please contact support for assistance.",
  "gas required exceeds":
    "Network is congested. Please try again later with higher gas limits.",
  "insufficient funds":
    "Insufficient funds in your wallet to complete this transaction.",
  "MetaMask - RPC Error":
    "Network connection issue. Please check your wallet connection and try again.",
};

/**
 * Function to handle purchase errors and display appropriate toast notifications
 * @param {Error} error - The error object from the transaction
 * @returns {string} - The processed error message that was displayed to the user
 */
export const handlePurchaseError = (error) => {
  // Get error message string
  const errorMsg = error?.message || "An unknown error occurred";

  // For logging only - truncate long error messages
  const shortError =
    errorMsg.length > 150 ? `${errorMsg.substring(0, 150)}...` : errorMsg;

  console.error("Purchase error (shortened):", shortError);

  // Find matching error pattern
  let userMessage =
    "Transaction failed. Please try again later or contact support.";

  // Check for specific error messages
  for (const [errorPattern, message] of Object.entries(errorMessageMap)) {
    if (errorMsg.includes(errorPattern)) {
      userMessage = message;
      break;
    }
  }

  // Show toast with user-friendly message
  toast.error(userMessage, toastConfig);

  return userMessage;
};

/**
 * Function to show success toast for purchase
 * @param {string} txHash - Transaction hash
 */
export const showPurchaseSuccess = (txHash) => {
  const shortenedHash = txHash
    ? `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`
    : "";

  toast.success(
    `Purchase successful! Transaction: ${shortenedHash}`,
    toastConfig
  );
};

/**
 * Function to show processing toast for purchase
 */
export const showProcessingTransaction = () => {
  return toast.info("Processing transaction. Please wait...", {
    ...toastConfig,
    autoClose: false,
    closeButton: true,
  });
};

/**
 * Function to update a toast
 * @param {string} toastId - ID of the toast to update
 * @param {string} message - New message
 * @param {string} type - Type of toast (success, error, info)
 */
export const updateToast = (toastId, message, type = "info") => {
  if (!toast.isActive(toastId)) return;

  toast.update(toastId, {
    render: message,
    type: toast[type] ? type : "info",
    autoClose: 5000,
    closeButton: true,
  });
};
