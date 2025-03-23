// File: frontend/src/components/ClaimScreen.jsx
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContract } from "../hooks/useContract";
import {
  formatTokenAmount,
  formatTimestamp,
  calculateTimeUntilNextVesting,
} from "../utils/tokenUtils";

export const ClaimScreen = ({ connectToXdcNetwork, isXdcConnected }) => {
  const { address, isConnected } = useAccount();

  // Contract hooks
  const {
    contract: presaleContract,
    loading: presaleLoading,
    error: presaleError,
  } = useContract("XDCAIPresale2");

  const {
    contract: tokenContract,
    loading: tokenLoading,
    error: tokenError,
  } = useContract("XDCAIToken");

  // Component state
  const [vestingInfo, setVestingInfo] = useState({
    totalAmount: "0",
    releasedAmount: "0",
    vestedAmount: "0",
    nextUnlockTime: "0",
  });
  const [claimableAmount, setClaimableAmount] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState("XDCAI");
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [timeUntilNextRelease, setTimeUntilNextRelease] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [transactionHash, setTransactionHash] = useState(null);

  // Fetch vesting information when contracts are loaded and address is connected
  useEffect(() => {
    const fetchVestingInfo = async () => {
      try {
        if (!presaleContract || !address || presaleLoading) return;

        setError(null);

        // Get vesting information
        const vestingInfoResult = await presaleContract.getVestingInfo(address);
        setVestingInfo({
          totalAmount: vestingInfoResult[0].toString(),
          releasedAmount: vestingInfoResult[1].toString(),
          vestedAmount: vestingInfoResult[2].toString(),
          nextUnlockTime: vestingInfoResult[3].toString(),
        });

        // Get claimable amount
        const claimable = await presaleContract.getClaimableAmount(address);
        setClaimableAmount(claimable.toString());

        // Get token symbol and decimals if token contract is loaded
        if (tokenContract && !tokenLoading) {
          const symbol = await tokenContract.symbol();
          setTokenSymbol(symbol);

          const decimals = await tokenContract.decimals();
          setTokenDecimals(decimals);
        }
      } catch (err) {
        console.error("Error fetching vesting info:", err);
        setError("Error fetching vesting information. Please try again.");
      }
    };

    if (isConnected && address && presaleContract) {
      fetchVestingInfo();
    }
  }, [
    presaleContract,
    presaleLoading,
    tokenContract,
    tokenLoading,
    address,
    isConnected,
  ]);

  // Update timer for next vesting release
  useEffect(() => {
    if (!vestingInfo.nextUnlockTime || vestingInfo.nextUnlockTime === "0")
      return;

    const intervalId = setInterval(() => {
      const timeLeft = calculateTimeUntilNextVesting(
        vestingInfo.nextUnlockTime
      );
      setTimeUntilNextRelease(timeLeft);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [vestingInfo.nextUnlockTime]);

  // Handle token claiming
  const handleClaim = async () => {
    try {
      setError(null);
      setSuccess(false);
      setTransactionHash(null);

      // Validation checks
      if (!isXdcConnected) {
        setError("Please connect to XDC network first");
        return;
      }

      if (!presaleContract) {
        setError("Contract not loaded. Please try again.");
        return;
      }

      if (!isConnected || !address) {
        setError("Wallet not connected");
        return;
      }

      const claimableBigInt = BigInt(claimableAmount);
      if (claimableBigInt <= BigInt(0)) {
        setError("No tokens available to claim");
        return;
      }

      setIsProcessing(true);

      // Execute the claim transaction
      const tx = await presaleContract.claimTokens();
      setTransactionHash(tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setSuccess(true);

        // Refetch vesting information
        const vestingInfoResult = await presaleContract.getVestingInfo(address);
        setVestingInfo({
          totalAmount: vestingInfoResult[0].toString(),
          releasedAmount: vestingInfoResult[1].toString(),
          vestedAmount: vestingInfoResult[2].toString(),
          nextUnlockTime: vestingInfoResult[3].toString(),
        });

        // Update claimable amount (should be 0 after successful claim)
        const claimable = await presaleContract.getClaimableAmount(address);
        setClaimableAmount(claimable.toString());
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      console.error("Claim error:", err);
      setError(`Claim failed: ${err.message}`);
      setSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Calculate percentage of tokens released
  const calculateReleasePercentage = () => {
    if (!vestingInfo.totalAmount || vestingInfo.totalAmount === "0") return 0;

    const total = BigInt(vestingInfo.totalAmount);
    const released = BigInt(vestingInfo.releasedAmount);

    return Number((released * BigInt(100)) / total);
  };

  return (
    <div
      className="claim-screen"
      style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 0" }}
    >
      <h2
        style={{ textAlign: "center", fontSize: "28px", margin: "0 0 20px 0" }}
      >
        Claim Your ${tokenSymbol} Tokens
      </h2>

      {/* XDC Network Connection */}
      {!isXdcConnected && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              backgroundColor: "rgba(255, 200, 0, 0.1)",
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #FFB74D",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 10px 0", color: "#FFB74D" }}>
              Please connect to the XDC Network to claim your tokens
            </p>
          </div>

          <button
            className="xdc-connect-button"
            onClick={connectToXdcNetwork}
            style={{
              width: "100%",
              backgroundColor: "#112211",
              border: "1px solid #90EE90",
              borderRadius: "10px",
              color: "white",
              fontSize: "16px",
              padding: "15px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            <span>Connect to XDC Network</span>
            <span style={{ fontWeight: "bold", color: "#90EE90" }}>XDC</span>
          </button>
        </div>
      )}

      {/* Vesting Information */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            margin: "0 0 15px 0",
            color: "#90EE90",
            textAlign: "center",
          }}
        >
          Your Vesting Summary
        </h3>

        {BigInt(vestingInfo.totalAmount) > BigInt(0) ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #333",
                paddingBottom: "10px",
                marginBottom: "10px",
              }}
            >
              <span>Total Purchased:</span>
              <span style={{ fontWeight: "bold" }}>
                {formatTokenAmount(vestingInfo.totalAmount, tokenDecimals)} $
                {tokenSymbol}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #333",
                paddingBottom: "10px",
                marginBottom: "10px",
              }}
            >
              <span>Released So Far:</span>
              <span style={{ fontWeight: "bold" }}>
                {formatTokenAmount(vestingInfo.releasedAmount, tokenDecimals)} $
                {tokenSymbol}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #333",
                paddingBottom: "10px",
                marginBottom: "10px",
              }}
            >
              <span>Currently Available:</span>
              <span style={{ fontWeight: "bold", color: "#90EE90" }}>
                {formatTokenAmount(claimableAmount, tokenDecimals)} $
                {tokenSymbol}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <span>Next Release:</span>
              <span style={{ fontWeight: "bold" }}>
                {vestingInfo.nextUnlockTime &&
                vestingInfo.nextUnlockTime !== "0"
                  ? `${timeUntilNextRelease.days}d ${timeUntilNextRelease.hours}h ${timeUntilNextRelease.minutes}m`
                  : "All tokens released"}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: "24px",
                backgroundColor: "#333",
                borderRadius: "12px",
                overflow: "hidden",
                marginTop: "20px",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${calculateReleasePercentage()}%`,
                  height: "100%",
                  backgroundColor: "#90EE90",
                  borderRadius: "12px 0 0 12px",
                  transition: "width 0.5s ease-in-out",
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                {calculateReleasePercentage()}% Released
              </div>
            </div>
          </>
        ) : (
          <p style={{ textAlign: "center", color: "#aaa" }}>
            You don't have any ${tokenSymbol} tokens to claim. Purchase tokens
            first.
          </p>
        )}
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
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          style={{
            textAlign: "center",
            color: "#90EE90",
            backgroundColor: "rgba(0, 100, 0, 0.2)",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          Tokens claimed successfully!
        </div>
      )}

      {/* Transaction hash display */}
      {transactionHash && (
        <div
          style={{
            textAlign: "center",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
            wordBreak: "break-all",
          }}
        >
          <p style={{ color: "white", marginBottom: "5px" }}>
            Transaction Hash:
          </p>
          <p style={{ color: "#90EE90", fontSize: "14px" }}>
            {transactionHash}
          </p>
        </div>
      )}

      {/* Claim button */}
      <button
        onClick={handleClaim}
        disabled={
          !isXdcConnected ||
          BigInt(claimableAmount) <= BigInt(0) ||
          isProcessing
        }
        style={{
          width: "100%",
          backgroundColor:
            !isXdcConnected ||
            BigInt(claimableAmount) <= BigInt(0) ||
            isProcessing
              ? "#5a8f5a"
              : "#90EE90",
          border: "none",
          borderRadius: "8px",
          padding: "17px",
          fontSize: "20px",
          fontWeight: "bold",
          color: "black",
          cursor:
            !isXdcConnected ||
            BigInt(claimableAmount) <= BigInt(0) ||
            isProcessing
              ? "not-allowed"
              : "pointer",
          marginBottom: "15px",
          height: "60px",
        }}
      >
        {isProcessing
          ? "PROCESSING..."
          : !isXdcConnected
          ? "CONNECT TO XDC FIRST"
          : BigInt(claimableAmount) <= BigInt(0)
          ? "NO TOKENS TO CLAIM"
          : `CLAIM ${formatTokenAmount(
              claimableAmount,
              tokenDecimals
            )} ${tokenSymbol}`}
      </button>
    </div>
  );
};

export default ClaimScreen;
