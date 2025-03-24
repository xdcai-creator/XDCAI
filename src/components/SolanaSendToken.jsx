//src/components/SolanaSendToken.jsx

import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { PhantomIcon } from "./icons";
window.Buffer = Buffer;

export function SolanaSendToken() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);
  const [xdcaiAmount, setXdcaiAmount] = useState("0");
  const solPrice = 100; // SOL price in USD
  const xdcPrice = 0.0033722; // XDCAI price in USD

  // Receiver wallet address
  const RECEIVER_ADDRESS = "5qx3TWES2aM92PWhLhTwhiZmBZQcRQHTAhXfVakWVfnz";

  // Simplified coin data for SOL only
  const solanaData = {
    symbol: "SOL",
    name: "Solana",
    balance: 0.001, // Match the balance format from PurchaseScreen
    value: 100,
    network: "SOL",
  };

  // Format wallet address
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Get Solana logo
  const getSolanaLogo = () => {
    return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGcgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2ODBBNCI+PC9jaXJjbGU+PHBhdGggZD0iTTkuOTQgMjAuMTg4YzEuMjM1IDAgNC40MSAwIDUuNTI5IDBhLjQxLjQxIDAgMSAwIDAtLjgyMWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIxaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTAuNzZhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNWMxLjIzNSAwIDIuODc2LTEuMjMzIDMuNjk0LTIuMDVsLjIwNy0uMjA4Yy4yMjktLjIyOC42LTYuNDEyLjYtOC4wMzhNMjIuMDU4IDEyLjYzNWgtNS41M2EuNDEuNDEgMCAwIDEgMC0uODIyaDYuMzUyYS40MS40MSAwIDEgMCAwLS44MjJIMTYuMjlhLjQxLjQxIDAgMCAxIDAtLjgyMWg0LjcwNGMxLjIzNiAwIDIuODc3LTEuMjMyIDMuNjk1LTIuMDUiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNMjIuMDU4IDE5LjM2NmEuNDEuNDEgMCAwIDEgMCAuODIyaC01LjUzYS40MS40MSAwIDAgMCAwIC44MjFoNi4zNTJhLjQxLjQxIDAgMSAxIDAgLjgyMkgxNi4yOWEuNDEuNDEgMCAwIDAgMCAuODIxaDQuNzA0YzEuMjM2IDAgMi44NzcgMS4yMzMgMy42OTUgMi4wNWwuMjA3LjIwN2MuMjI5LjIyOS42IDYuNDEzLjYgOC4wMzgiIGZpbGw9IiNGRkYiPjwvcGF0aD48cGF0aCBkPSJNOS45NCAyMy41MTFoNS41MjlhLjQxLjQxIDAgMSAxIDAgLjgyMmgtNi4zNTJhLjQxLjQxIDAgMCAwIDAgLjgyMWg1LjU4OWEuNDEuNDEgMCAwIDEgMCAuODIxSDkuOTRjLTEuMjM2IDAtMi44NzcgMS4yMzMtMy42OTQgMi4wNSIgZmlsbD0iI0ZGRiI+PC9wYXRoPjwvZz48L3N2Zz4=";
  };

  // Update XDCAI amount when SOL amount changes
  useEffect(() => {
    if (amount && !isNaN(amount)) {
      const solValue = parseFloat(amount) * solPrice; // Convert SOL to USD
      const xdcaiValue = solValue / xdcPrice; // Convert USD to XDCAI
      setXdcaiAmount(xdcaiValue.toFixed(8));
    } else {
      setXdcaiAmount("0");
    }
  }, [amount]);

  async function handleSendToken() {
    try {
      setError(null);
      setIsProcessing(true);

      if (!amount || parseFloat(amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      if (!wallet.publicKey) {
        setError("Wallet not connected");
        return;
      }

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(RECEIVER_ADDRESS),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      alert(`Successfully sent ${amount} SOL to ${RECEIVER_ADDRESS}`);
      setAmount("");
    } catch (error) {
      console.error("Send token error:", error);
      setError(error.message || "Failed to send tokens");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="purchase-screen"
      style={{ maxWidth: "600px", margin: "0 auto" }}
    >
      {showCurrencySelection ? (
        <div className="currency-selection">
          <h2>Select a currency</h2>

          <div className="currency-tabs">
            <button
              className={`currency-tab ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              ALL
            </button>
            <button
              className={`currency-tab ${activeTab === "SOL" ? "active" : ""}`}
              onClick={() => setActiveTab("SOL")}
            >
              <img
                src={getSolanaLogo()}
                alt="SOL"
                style={{ width: "16px", height: "16px", marginRight: "4px" }}
              />{" "}
              SOL
            </button>
          </div>

          <div className="currency-list">
            <div
              className="currency-item"
              onClick={() => setShowCurrencySelection(false)}
            >
              <div className="currency-icon-wrapper">
                <img
                  src={getSolanaLogo()}
                  alt="SOL"
                  style={{ width: "32px", height: "32px" }}
                />
              </div>
              <div className="currency-info">
                <div className="currency-name">{solanaData.name}</div>
                <div className="currency-symbol">{solanaData.symbol}</div>
              </div>
              <div className="currency-balance">
                <div className="currency-value">
                  ~${solanaData.value.toFixed(3)}
                </div>
                <div className="currency-amount">{solanaData.balance}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Account Information Section */}
          <div
            style={{
              marginBottom: "20px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "10px",
              padding: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#00FA73",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "10px",
                  fontSize: "16px",
                  color: "#1a1a1a",
                  fontWeight: "bold",
                }}
              >
                {wallet.publicKey
                  ? formatAddress(wallet.publicKey.toString()).charAt(0)
                  : "N"}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    color: "white",
                  }}
                >
                  {wallet.publicKey
                    ? formatAddress(wallet.publicKey.toString())
                    : "Not Connected"}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: wallet.publicKey ? "#00FA73" : "#ff4c4c",
                  }}
                >
                  {wallet.publicKey ? "Connected" : "Not Connected"}
                </div>
              </div>
            </div>
          </div>

          {/* Header section */}
          <div className="presale-header">
            <p
              style={{
                textAlign: "right",
                margin: "10px 0",
                fontSize: "16px",
                color: "#ccc",
              }}
            >
              Can't find tokens in your wallet?
            </p>
            <h2
              style={{
                textAlign: "center",
                margin: "15px 0",
                fontSize: "24px",
                lineHeight: "1.3",
              }}
            >
              Take advantage of Huge Early Staking Rewards by becoming an early
              adopter!
            </h2>
            <div
              style={{
                textAlign: "center",
                color: "#00FA73",
                fontSize: "38px",
                fontWeight: "bold",
                margin: "25px 0",
                lineHeight: "1.2",
              }}
            >
              BUY $XDCAI PRESALE NOW!
            </div>
          </div>

          {/* Token display area */}
          <div
            style={{
              width: "100%",
              height: "110px",
              backgroundColor: "#3a4a4a",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          ></div>

          {/* Payment section */}
          <div style={{ padding: "0 5px" }}>
            {/* Amount input field */}
            <div style={{ marginBottom: "25px" }}>
              <p
                style={{
                  textAlign: "left",
                  margin: "5px 0",
                  fontSize: "16px",
                  color: "#ccc",
                }}
              >
                Pay with SOL
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    flex: "1",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    padding: "15px",
                    fontSize: "20px",
                    color: "white",
                    height: "55px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={() => setShowCurrencySelection(true)}
                  style={{
                    width: "120px",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    padding: "0 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    cursor: "pointer",
                    height: "55px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "#627EEA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "8px",
                    }}
                  >
                    <img
                      src={getSolanaLogo()}
                      alt="SOL"
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                    SOL
                  </span>
                  <span style={{ marginLeft: "8px" }}>▼</span>
                </button>
              </div>
            </div>

            {/* Receive XDCAI field */}
            <div style={{ marginBottom: "5px" }}>
              <p
                style={{
                  textAlign: "left",
                  margin: "5px 0",
                  fontSize: "16px",
                  color: "#ccc",
                }}
              >
                Receive $XDCAI
              </p>
              <input
                type="text"
                value={xdcaiAmount}
                readOnly
                placeholder="0"
                style={{
                  width: "100%",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "15px",
                  fontSize: "20px",
                  color: "white",
                  height: "55px",
                  boxSizing: "border-box",
                  marginBottom: "5px",
                }}
              />
              <p
                style={{
                  textAlign: "right",
                  margin: "5px 0 20px 0",
                  fontSize: "14px",
                  color: "#aaa",
                }}
              >
                1 $XDCAI = ${xdcPrice.toFixed(7)}
              </p>
            </div>

            {/* Network info display */}
            <div
              style={{
                textAlign: "center",
                color: "#aaa",
                backgroundColor: "rgba(30, 30, 30, 0.7)",
                padding: "10px",
                borderRadius: "5px",
                marginBottom: "15px",
                fontSize: "14px",
              }}
            >
              Connected to Solana Network
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  textAlign: "center",
                  color: "#ff6b6b",
                  backgroundColor: "rgba(100, 0, 0, 0.2)",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "25px",
                }}
              >
                {error}
              </div>
            )}

            {/* Processing status */}
            {isProcessing && (
              <div
                style={{
                  textAlign: "center",
                  color: "#00FA73",
                  backgroundColor: "rgba(0, 100, 0, 0.2)",
                  padding: "15px",
                  borderRadius: "5px",
                  marginBottom: "25px",
                }}
              >
                Transaction submitted, waiting for confirmation...
              </div>
            )}

            {/* Buy/Send button */}
            <button
              onClick={handleSendToken}
              disabled={isProcessing || !wallet.publicKey}
              style={{
                width: "100%",
                backgroundColor: isProcessing ? "#5a8f5a" : "#00FA73",
                border: "none",
                borderRadius: "8px",
                padding: "17px",
                fontSize: "20px",
                fontWeight: "bold",
                color: "black",
                cursor: isProcessing ? "not-allowed" : "pointer",
                marginBottom: "15px",
                height: "60px",
              }}
            >
              {isProcessing ? "PROCESSING..." : "BUY $XDCAI"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
