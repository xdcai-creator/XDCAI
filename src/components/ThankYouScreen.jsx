// src/components/ThankYouScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { switchToXdcNetwork, isTestnet } from "./config";

export const ThankYouScreen = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isXdcConnected, setIsXdcConnected] = useState(false);
  const [showXdcNetworkDetails, setShowXdcNetworkDetails] = useState(false);
  const { address, isConnected } = useAccount();
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [emailInput, setEmailInput] = useState("");

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Check for transaction details in localStorage
    const txDetails = localStorage.getItem("xdcai_tx_details");
    if (txDetails) {
      try {
        setTransactionDetails(JSON.parse(txDetails));

        // Clear the localStorage after setting the details
        // localStorage.removeItem("xdcai_tx_details");
      } catch (err) {
        console.error("Error parsing transaction details:", err);

        navigate("-1");
      }
    }
  }, []);

  useEffect(() => {
    const checkUserEmail = async () => {
      if (!address) return;

      try {
        setIsCheckingEmail(true);

        // Call the API to check if user has email
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/api/users/walletAddress?walletAddress=${address}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.email) {
            setUserEmail(data.email);
            setEmailSubmitted(true);

            //to trigger purchase notification email on backend if user email already stored previously
            //
            // await storeEmailApi(data.email);
          } else {
            setEmailSubmitted(false);
          }
        } else {
          // If user not found or other error, we need to collect email
          setEmailSubmitted(false);
        }
      } catch (err) {
        console.error("Error checking user email:", err);
        setEmailSubmitted(false);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    checkUserEmail();
  }, [address]);

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

    storeEmailApi(emailInput);
  };

  const storeEmailApi = async (_emailInput) => {
    try {
      setIsSubmittingEmail(true);
      setError(null);

      if (!address) {
        setError("Wallet not connected");
        return;
      }

      const txDetails =
        transactionDetails ||
        JSON.parse(localStorage.getItem("xdcai_tx_details") || "{}");
      console.log("txDetails ", txDetails);

      const transformedTransactionData = {
        amount: txDetails.amount || "0",
        tokenType: txDetails.currency || "ETH",
        tokenDecimals:
          txDetails.currency === "USDT" || txDetails.currency === "USDC"
            ? 6
            : 18,
        tokensReceived: txDetails.tokens || "0",
        // Any additional data you want to send
        bonusTokens: txDetails.bonusTokens || "0",
        hash: txDetails.hash || "",
        usdValue: txDetails.usdValue || 0,
      };

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
            email: _emailInput,
            walletAddress: address,
            transactionData: transformedTransactionData,
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

  if (!userEmail) {
    if (!emailSubmitted) {
      return (
        <div
          style={{
            // backgroundColor: "#1a1a1a",
            // border: "1px solid #333",
            // borderRadius: "10px",
            padding: "20px",
            // marginBottom: "20px",
          }}
        >
          <h3
            className="text-white "
            style={{ textAlign: "center", margin: "0 0 15px 0" }}
          >
            Stay Updated on Your Investment
          </h3>
          <p
            className="text-center"
            style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#aaa" }}
          >
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
                // width: "100%",
                // padding: "12px",
                boxSizing: "border-box",
                // backgroundColor: "#2a2a2a",
                // border: "1px solid #444",
                // borderRadius: "6px",
                color: "white",
                marginBottom: "15px",
              }}
              className="w-full bg-[#1A1A1A] rounded-md border border-[#333333] rounded-md p-3 text-white text-lg"
            />

            <button
              type="submit"
              disabled={isSubmittingEmail || !emailInput}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: isSubmittingEmail ? "#5a8f5a" : "#00FA73",
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
      );
    }

    return (
      <div
        style={{
          backgroundColor: "rgba(0, 100, 0, 0.1)",
          border: "1px solid #00FA73",
          borderRadius: "10px",
          padding: "15px",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#00FA73", fontWeight: "bold" }}>
          Email submitted successfully!
        </p>
        <p style={{ fontSize: "14px", color: "#aaa", margin: "10px 0 0 0" }}>
          You'll receive updates about your tokens and project developments.
        </p>
      </div>
    );
  }

  return (
    <div className="thank-you-screen">
      <div className="text-[#707070] text-[20px] text-center mb-[20px]">
        Thanks for purchasing XDCAI tokens!
      </div>

      <p className="text-[15px] text-center text-[#707070]">
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
                : "1px solid #00FA73",
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
              style={{ color: "#00FA73", fontWeight: "bold" }}
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
              color: "#00FA73",
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
        onClick={() => navigate("/claim")}
        disabled={!isXdcConnected}
        style={{
          width: "100%",
          padding: "15px",
          backgroundColor: isXdcConnected ? "#00FA73" : "#5a8f5a",
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
