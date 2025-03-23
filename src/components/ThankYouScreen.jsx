// File: frontend/src/components/ThankYouScreen.jsx
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { MetamaskIcon } from "./icons";
import { switchToXdcNetwork, isTestnet } from "./config";

export const ThankYouScreen = ({
  setCurrentScreen,
  isXdcConnected,
  setIsXdcConnected,
}) => {
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showXdcNetworkDetails, setShowXdcNetworkDetails] = useState(false);
  const { address, isConnected } = useAccount();
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  useEffect(() => {
    // Check for transaction details in localStorage
    const txDetails = localStorage.getItem("xdcai_tx_details");
    if (txDetails) {
      try {
        setTransactionDetails(JSON.parse(txDetails));
      } catch (err) {
        console.error("Error parsing transaction details:", err);
      }
    }
  }, []);

  const handleXdcNetworkConnect = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      setShowXdcNetworkDetails(true);

      // Use our utility function to switch to XDC network
      await switchToXdcNetwork(isTestnet);

      // If we get here, the network switch was successful
      setIsXdcConnected(true);
    } catch (error) {
      console.error("XDC network connection error:", error);
      setError("Failed to connect to XDC network. Please try again.");
      setIsXdcConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!emailInput || !emailInput.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!address) {
      setError("Wallet not connected");
      return;
    }

    try {
      setIsSubmittingEmail(true);
      setError(null);

      // Submit email to backend API
      // Submit email to backend API
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/api/users/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailInput,
            walletAddress: address,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit email");
      }

      setEmailSubmitted(true);
    } catch (err) {
      console.error("Email submission error:", err);
      setError(err.message || "Failed to submit email");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <div className="thank-you-screen">
      <h2
        style={{ fontSize: "26px", textAlign: "center", marginBottom: "20px" }}
      >
        Thanks for purchasing XDCAI tokens!
      </h2>

      {/* Transaction details */}
      {transactionDetails && (
        <div
          style={{
            backgroundColor: "rgba(0, 100, 0, 0.1)",
            border: "1px solid #90EE90",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              textAlign: "center",
              color: "#90EE90",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Purchase Successful!
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Amount:</strong> {transactionDetails.amount}{" "}
            {transactionDetails.currency}
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Tokens:</strong> {transactionDetails.tokens} XDCAI
          </p>
          <p style={{ margin: "5px 0", wordBreak: "break-all" }}>
            <strong>Transaction:</strong> {transactionDetails.hash.slice(0, 10)}
            ...{transactionDetails.hash.slice(-8)}
          </p>
        </div>
      )}

      {/* Email collection form */}
      {!emailSubmitted ? (
        <div
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ textAlign: "center", margin: "0 0 15px 0" }}>
            Stay Updated on Your Investment
          </h3>
          <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#aaa" }}>
            Provide your email to receive important updates about your tokens,
            vesting schedule, and XDCAI project news.
          </p>

          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email address"
              style={{
                width: "100%",
                padding: "12px",
                boxSizing: "border-box",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "white",
                marginBottom: "15px",
              }}
            />

            <button
              type="submit"
              disabled={isSubmittingEmail || !emailInput}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: isSubmittingEmail ? "#5a8f5a" : "#90EE90",
                border: "none",
                borderRadius: "6px",
                color: "black",
                fontWeight: "bold",
                cursor: isSubmittingEmail ? "not-allowed" : "pointer",
              }}
            >
              {isSubmittingEmail ? "Submitting..." : "Submit Email"}
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "rgba(0, 100, 0, 0.1)",
            border: "1px solid #90EE90",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#90EE90", fontWeight: "bold" }}>
            Email submitted successfully!
          </p>
          <p style={{ fontSize: "14px", color: "#aaa", margin: "10px 0 0 0" }}>
            You'll receive updates about your tokens and project developments.
          </p>
        </div>
      )}

      <p style={{ textAlign: "center", margin: "15px 0" }}>
        In order to claim your tokens, please connect to the XDC network.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            color: "#ff6b6b",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <div className="steps-container">
        <div className="step">
          <div className="step-number">Step 1</div>
          <button
            className="step-button"
            onClick={handleXdcNetworkConnect}
            disabled={isConnecting || isXdcConnected}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: "15px",
              backgroundColor: isXdcConnected ? "#5a8f5a" : "#112211",
              border: isXdcConnected
                ? "1px solid #5a8f5a"
                : "1px solid #90EE90",
              borderRadius: "10px",
              color: "white",
              fontSize: "16px",
              cursor: isXdcConnected ? "default" : "pointer",
              marginBottom: "15px",
            }}
          >
            <span>
              {isXdcConnected
                ? "Connected to XDC network"
                : "Connect to XDC network"}
            </span>
            <span
              className="xdc-icon"
              style={{ color: "#90EE90", fontWeight: "bold" }}
            >
              XDC
            </span>
          </button>
        </div>
      </div>

      {showXdcNetworkDetails && (
        <div
          className="xdc-network-details"
          style={{
            backgroundColor: "#112211",
            border: "1px solid #333",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              color: "#90EE90",
              margin: "0 0 10px 0",
              textAlign: "center",
            }}
          >
            XDC Network Details
          </h3>
          <div className="network-info">
            <p>
              <strong>Network Name:</strong>{" "}
              {isTestnet ? "XDC Apothem Testnet" : "XDC Network"}
            </p>
            <p>
              <strong>Chain ID:</strong> {isTestnet ? "51" : "50"}
            </p>
            <p>
              <strong>Currency Symbol:</strong> {isTestnet ? "TXDC" : "XDC"}
            </p>
            <p>
              <strong>RPC URL:</strong>{" "}
              {isTestnet
                ? "https://erpc.apothem.network"
                : "https://erpc.xinfin.network"}
            </p>
            <p>
              <strong>Block Explorer:</strong>{" "}
              {isTestnet
                ? "https://explorer.apothem.network"
                : "https://explorer.xinfin.network"}
            </p>
          </div>
          <p
            className="network-note"
            style={{
              marginTop: "10px",
              fontSize: "14px",
              color: "#aaa",
              fontStyle: "italic",
            }}
          >
            MetaMask will prompt you to add this network. Please approve the
            request to connect.
          </p>
        </div>
      )}

      <p style={{ textAlign: "center", margin: "15px 0" }}>
        Once connected to the XDC network, click on the Claim button below to
        claim your XDCAI tokens.
      </p>

      <button
        className="claim-button"
        onClick={() => setCurrentScreen(4)}
        disabled={!isXdcConnected}
        style={{
          width: "100%",
          padding: "15px",
          backgroundColor: isXdcConnected ? "#90EE90" : "#5a8f5a",
          color: "black",
          border: "none",
          borderRadius: "10px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: isXdcConnected ? "pointer" : "not-allowed",
          marginTop: "15px",
        }}
      >
        {isXdcConnected ? "Claim XDCAI tokens!" : "Connect to XDC first"}
      </button>
    </div>
  );
};

export default ThankYouScreen;
