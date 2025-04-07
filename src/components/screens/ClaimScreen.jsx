import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useWallet } from "../../hooks/useWallet";
import { useNetwork } from "../../context/NetworkContext";
import { useContract } from "../../hooks/useContract";
import {
  formatTokenAmount,
  calculateTimeRemaining,
} from "../../utils/formatters";
import NetworkSwitch from "../claim/NetworkSwitch";

/**
 * Claim screen for checking vesting status and claiming tokens
 */
const ClaimScreen = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const { isXdcConnected, connectToXdcNetwork, isConnecting } = useNetwork();

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
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  // Fetch vesting information when contracts are loaded and address is connected
  useEffect(() => {
    const fetchVestingInfo = async () => {
      try {
        if (!presaleContract || !address || presaleLoading || !isXdcConnected)
          return;

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

    if (isConnected && isXdcConnected && address && presaleContract) {
      fetchVestingInfo();
    }
  }, [
    presaleContract,
    presaleLoading,
    tokenContract,
    tokenLoading,
    address,
    isConnected,
    isXdcConnected,
  ]);

  // Update timer for next vesting release
  useEffect(() => {
    if (!vestingInfo.nextUnlockTime || vestingInfo.nextUnlockTime === "0")
      return;

    const intervalId = setInterval(() => {
      const timeLeft = calculateTimeRemaining(vestingInfo.nextUnlockTime);
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

  // Calculate percentage of tokens released
  const calculateReleasePercentage = () => {
    if (!vestingInfo.totalAmount || vestingInfo.totalAmount === "0") return 0;

    const total = BigInt(vestingInfo.totalAmount);
    const released = BigInt(vestingInfo.releasedAmount);

    return Number((released * BigInt(100)) / total);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center text-white mb-6">
        Claim Your ${tokenSymbol} Tokens
      </h2>

      {/* XDC Network Connection Section */}
      {!isXdcConnected && (
        <div className="mb-6">
          <div className="bg-accent-red/10 border border-accent-red rounded-md p-4 mb-4 text-center">
            <p className="text-accent-red">
              Please connect to the XDC Network to claim your tokens
            </p>
          </div>

          <button
            onClick={() => {
              connectToXdcNetwork();
              setShowNetworkDetails(true);
            }}
            disabled={isConnecting}
            className={`w-full py-3 px-4 bg-dark-light border border-primary rounded-md text-white flex justify-between items-center
              ${
                isConnecting
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer hover:border-primary-light"
              }`}
          >
            <span>Connect to XDC Network</span>
            <span className="font-bold text-primary">XDC</span>
          </button>
        </div>
      )}

      {/* Show network details if trying to connect */}
      {showNetworkDetails && !isXdcConnected && <NetworkSwitch />}

      {/* Vesting Information */}
      <div className="bg-dark-light border border-[#425152] rounded-md p-5 mb-6">
        <h3 className="text-lg font-semibold text-primary text-center mb-4">
          Your Vesting Summary
        </h3>

        {BigInt(vestingInfo.totalAmount) > BigInt(0) ? (
          <>
            <div className="flex justify-between border-b border-[#425152] py-2 mb-2">
              <span className="text-white">Total Purchased:</span>
              <span className="font-semibold text-white">
                {formatTokenAmount(vestingInfo.totalAmount, tokenDecimals)} $
                {tokenSymbol}
              </span>
            </div>

            <div className="flex justify-between border-b border-[#425152] py-2 mb-2">
              <span className="text-white">Released So Far:</span>
              <span className="font-semibold text-white">
                {formatTokenAmount(vestingInfo.releasedAmount, tokenDecimals)} $
                {tokenSymbol}
              </span>
            </div>

            <div className="flex justify-between border-b border-[#425152] py-2 mb-2">
              <span className="text-white">Currently Available:</span>
              <span className="font-semibold text-primary">
                {formatTokenAmount(claimableAmount, tokenDecimals)} $
                {tokenSymbol}
              </span>
            </div>

            <div className="flex justify-between py-2 mb-4">
              <span className="text-white">Next Release:</span>
              <span className="font-semibold text-white">
                {vestingInfo.nextUnlockTime &&
                vestingInfo.nextUnlockTime !== "0"
                  ? `${timeUntilNextRelease.days}d ${timeUntilNextRelease.hours}h ${timeUntilNextRelease.minutes}m`
                  : "All tokens released"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-6 bg-[#425152] rounded-full overflow-hidden relative mt-4">
              <div
                className="h-full bg-primary rounded-l-full transition-all duration-500"
                style={{ width: `${calculateReleasePercentage()}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                {calculateReleasePercentage()}% Released
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-light py-4">
            You don't have any ${tokenSymbol} tokens to claim. Purchase tokens
            first.
          </p>
        )}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-accent-red/20 border border-accent-red rounded-md p-4 mb-4 text-center text-accent-red">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-primary/20 border border-primary rounded-md p-4 mb-4 text-center text-primary">
          Tokens claimed successfully!
        </div>
      )}

      {/* Transaction Hash Display */}
      {transactionHash && (
        <div className="bg-dark-light border border-[#425152] rounded-md p-4 mb-4 text-center">
          <p className="text-white mb-2">Transaction Hash:</p>
          <p className="text-primary text-sm break-all">{transactionHash}</p>
        </div>
      )}

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={
          !isXdcConnected ||
          BigInt(claimableAmount) <= BigInt(0) ||
          isProcessing
        }
        className={`w-full py-4 text-lg font-bold text-dark rounded-md
          ${
            !isXdcConnected ||
            BigInt(claimableAmount) <= BigInt(0) ||
            isProcessing
              ? "bg-primary-dark cursor-not-allowed"
              : "bg-primary cursor-pointer hover:bg-primary-light"
          }`}
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
