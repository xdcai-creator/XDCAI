import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { useWallet } from "../../hooks/useWallet";
import { useNetwork } from "../../context/NetworkContext";
import { useContract } from "../../hooks/useContract";
import { contributionsApi } from "../../services/api";
import { CONTRACT_ADDRESSES } from "../../contracts/contractAddresses";
import XDCAIPresale2_ABI from "../../contracts/abis/XDCAIPresale";
import { isValidEmail } from "../../utils/validators";
import { MetamaskIcon, XDCIcon } from "../icons/CryptoIcons";
import ConnectXdcPopup from "../thank-you/ConnectXdcPopup";
import ContributionStatus from "../thank-you/ContributionStatus";

/**
 * Thank you screen shown after successful purchase
 * Uses connected XDC address for token claiming
 */
const ThankYouScreen = () => {
  const navigate = useNavigate();
  const { address, isConnected, displayAddress } = useWallet();
  const { isXdcConnected, connectToXdcNetwork, isConnecting } = useNetwork();

  // State variables
  const [hasInitialized, setHasInitialized] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState(null);

  // Contribution tracking - keep some of these for backward compatibility
  const [foundContribution, setFoundContribution] = useState(null);
  const [contributionId, setContributionId] = useState(null);

  // Claiming state
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [claimableTokens, setClaimableTokens] = useState("0");

  // Popup states
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);
  const [showConnectXdcPopup, setShowConnectXdcPopup] = useState(false);

  // Add this effect to handle the persistence of the thank you page state
  useEffect(() => {
    // Check if user has completed the transaction but not yet claimed tokens
    const checkTxStatus = async () => {
      const txDetails = localStorage.getItem("xdcai_tx_details");

      const storedContributionId = localStorage.getItem(
        "xdcai_contribution_id"
      );
      if (storedContributionId) {
        setContributionId(storedContributionId);
      }

      if (!txDetails) {
        // If there are no transaction details at all, redirect to purchase
        navigate("/purchase");
        return;
      }

      try {
        const details = JSON.parse(txDetails);
        setTransactionDetails(details);

        // Check if there's a flag indicating the user has already seen the thank you page
        // but hasn't claimed tokens yet
        const hasSeenThankYou = localStorage.getItem("xdcai_seen_thank_you");

        if (!hasSeenThankYou) {
          // First time on the thank you page, set the flag
          localStorage.setItem("xdcai_seen_thank_you", "true");
        }

        // Check if the user has an email already
        if (details.userEmail) {
          setUserEmail(details.userEmail);
          setEmailSubmitted(true);
        }

        setHasInitialized(true);
      } catch (err) {
        console.error("Error parsing transaction details:", err);
        navigate("/purchase");
      }
    };

    checkTxStatus();
  }, [navigate]);

  // Check if user already has email registered
  useEffect(() => {
    const checkUserInfo = async () => {
      if (!address) return;

      try {
        setIsCheckingEmail(true);

        // Call the API to check if user has email
        const response = await contributionsApi.checkUserEmail(address);

        if (response) {
          if (response.email) {
            setUserEmail(response.email);
            setEmailSubmitted(true);
          } else {
            setEmailSubmitted(false);
          }
        } else {
          // If user not found, we need to collect email
          setEmailSubmitted(false);
        }
      } catch (err) {
        console.error("Error checking user info:", err);
        setEmailSubmitted(false);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    if (isConnected && address) {
      checkUserInfo();
    }
  }, [address, isConnected]);

  // Load transaction details from localStorage
  useEffect(() => {
    const txDetails = localStorage.getItem("xdcai_tx_details");
    if (txDetails) {
      try {
        const details = JSON.parse(txDetails);
        setTransactionDetails(details);
      } catch (err) {
        console.error("Error parsing transaction details:", err);
        navigate("/purchase");
      }
    } else {
      // No transaction details found, redirect to purchase
      navigate("/purchase");
    }
  }, [navigate, address]);

  // Handle successful claim cleanup
  const handleSuccessfulClaim = () => {
    // Only clear these after successful claim
    localStorage.removeItem("xdcai_tx_details");
    localStorage.removeItem("xdcai_seen_thank_you");

    setTimeout(() => {
      navigate("/purchase");
    }, 3000);
  };

  // Submit email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!emailInput || !isValidEmail(emailInput)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!address) {
      setError("Wallet not connected");
      return;
    }

    try {
      await storeEmailApi(emailInput);
      setUserEmail(emailInput);
      setEmailSubmitted(true);

      // Also update the transaction details with the email
      const txDetails = localStorage.getItem("xdcai_tx_details");
      if (txDetails) {
        const details = JSON.parse(txDetails);
        details.userEmail = emailInput;
        localStorage.setItem("xdcai_tx_details", JSON.stringify(details));
      }

      setShowThankYouPopup(true);
    } catch (error) {
      setError(error.message || "Failed to submit email");
    }
  };

  // Store email API call
  const storeEmailApi = async (_emailInput, showEmailToast = true) => {
    try {
      setIsSubmittingEmail(true);
      setError(null);

      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Submit email and transaction data to backend API
      await contributionsApi.storeUserEmail(
        _emailInput,
        address,
        transactionDetails || {}
      );

      if (showEmailToast) {
        toast.success("Email submitted successfully!");
      }

      setEmailSubmitted(true);
    } catch (err) {
      console.error("Email submission error:", err);
      if (showEmailToast) {
        toast.error(err.message || "Failed to submit email");
      }
      throw err;
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // Update contribution ID when found via websocket
  const handleContributionFound = (contribution) => {
    if (contribution && contribution._id) {
      setFoundContribution(contribution);
      setContributionId(contribution._id);

      // Store contribution ID in localStorage for persistence
      localStorage.setItem("xdcai_contribution_id", contribution._id);

      // Show the connect XDC popup if contribution is found and we're not connected to XDC
      if (!isXdcConnected) {
        setShowConnectXdcPopup(true);
      }
    }
  };

  // Handle claim tokens
  const handleClaimTokens = async () => {
    if (!isXdcConnected || !isConnected || !address) {
      toast.error("Please connect to XDC Network first");
      setShowConnectXdcPopup(true);
      return;
    }

    try {
      setIsClaimingTokens(true);

      // First ensure we have a provider
      if (!window.ethereum) {
        toast.error("Please connect your metamask wallet");

        throw new Error("No wallet detected. Please connect your wallet.");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Get current chain ID to determine which contract address to use
      const network = await provider.getNetwork();
      const chainId = network.chainId;

      // Get the appropriate contract address
      const contractAddress = CONTRACT_ADDRESSES[chainId]?.XDCAIPresale2;

      if (
        !contractAddress ||
        contractAddress === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error(
          `Contract not deployed on this network (Chain ID: ${chainId})`
        );
      }

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        XDCAIPresale2_ABI,
        signer
      );

      // Get the claimable amount first to check if there's anything to claim
      const claimable = await contract.getClaimableAmount(address);
      const vestingInfo = await contract.getVestingInfo(address);
      setClaimableTokens(ethers.utils.formatEther(claimable));

      console.log("claimable ", claimable.toString());
      console.log("Vesting info:", {
        totalAmount: ethers.utils.formatEther(vestingInfo.totalAmount),
        releasedAmount: ethers.utils.formatEther(vestingInfo.releasedAmount),
        vestedAmount: vestingInfo.vestedAmount
          ? ethers.utils.formatEther(vestingInfo.vestedAmount)
          : "N/A",
        nextUnlockTime: vestingInfo.nextUnlockTime
          ? new Date(vestingInfo.nextUnlockTime.toNumber() * 1000).toString()
          : "N/A",
        initialReleaseClaimed: vestingInfo.initialReleaseClaimed || "N/A",
      });

      if (claimable.toString() === "0") {
        toast.info("No tokens available to claim at this time.");
        setIsClaimingTokens(false);
        return;
      }

      // Execute the claim transaction
      const tx = await contract.claimTokens();
      toast.info("Transaction submitted, waiting for confirmation...");

      // Wait for transaction to confirm
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Tokens claimed successfully!");
        handleSuccessfulClaim();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Claim error:", error);

      // Provide more user-friendly error messages
      if (error.code === 4001) {
        toast.error("Transaction rejected. Please try again.");
      } else if (error.message?.includes("user rejected")) {
        toast.error("Transaction was cancelled. Please try again when ready.");
      } else {
        toast.error(error.message || "Failed to claim tokens");
      }
    } finally {
      setIsClaimingTokens(false);
    }
  };

  // ThankYou Popup Component
  const ThankYouPopup = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="w-full max-w-md p-6 bg-[#1A1A1A] border border-[#333333] rounded-lg">
        <h2 className="text-xl text-white text-center font-semibold mb-4">
          Thanks for purchasing $XDCAI tokens!
        </h2>

        <p className="text-center text-gray-light mb-6">
          In order to claim your tokens, please download metamask and connect to
          the XDC network.
        </p>

        <div className="border-t border-[#333333] my-4"></div>

        <div className="mb-4">
          <p className="text-primary text-sm font-medium mb-2">Step 1</p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-3 bg-[#0C0C0C] border border-primary rounded-lg !text-white hover:bg-[#0A0A0A] transition-colors"
          >
            <span>Download Metamask</span>
            <MetamaskIcon />
          </a>
        </div>

        <div className="mb-4">
          <p className="text-primary text-sm font-medium mb-2">Step 2</p>
          <button
            onClick={() => {
              setShowThankYouPopup(false);
              setShowConnectXdcPopup(true);
            }}
            className="flex items-center justify-between w-full p-3 bg-[#0C0C0C] border border-[#333333] rounded-lg text-white hover:bg-[#0A0A0A] transition-colors"
          >
            <span>Connect to XDC network!</span>
            <XDCIcon />
          </button>
        </div>

        <p className="text-center text-gray-light text-sm mt-2">
          Once metamask is connected, click on the Claim button below to claim
          your $XDCAI tokens.
        </p>

        <button
          onClick={() => setShowThankYouPopup(false)}
          className="w-full py-3 mt-6 bg-primary rounded-lg text-black font-semibold hover:bg-primary-light transition-colors"
        >
          Claim $XDCAI tokens!
        </button>
      </div>
    </div>
  );

  // If still checking email status, show loading
  if (isCheckingEmail) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-white">Checking account information...</span>
        </div>
      </div>
    );
  }

  // Show email submission form if not yet submitted
  if (!emailSubmitted) {
    return (
      <div className="p-5 max-w-md mx-auto">
        <h3 className="text-white text-xl text-center mb-4">
          Thanks for Your Purchase!
        </h3>
        <p className="text-gray-light text-sm mb-4 text-center">
          Please Enter Your Email ID To Claim The $XDCAI Tokens
        </p>

        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter your email address"
            className="w-full bg-dark-light rounded-md border border-[#425152] p-3 text-white text-lg mb-4"
            required
          />

          {error && (
            <div className="bg-accent-red/20 border border-accent-red rounded-md p-3 mb-4 text-accent-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmittingEmail || !emailInput}
            className={`w-full py-3 rounded-md font-bold text-dark
              ${
                isSubmittingEmail || !emailInput
                  ? "bg-primary-dark cursor-not-allowed"
                  : "bg-primary cursor-pointer hover:bg-primary-light"
              }`}
          >
            {isSubmittingEmail ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Email"
            )}
          </button>
        </form>
      </div>
    );
  }

  // Show success/claim instructions
  return (
    <div className="p-5 max-w-md mx-auto">
      <div className="text-white text-xl text-center mb-5">
        Thanks for purchasing XDCAI tokens!
      </div>

      {/* Display contribution status from WebSocket */}
      {transactionDetails && transactionDetails.hash && (
        <ContributionStatus
          txHash={transactionDetails.hash}
          walletAddress={address}
          senderAddress={transactionDetails.senderAddress}
          showToasts={true}
          onContributionFound={handleContributionFound}
        />
      )}

      <p className="text-center text-[#A5C8CA] mb-5">
        In order to claim your tokens, please connect to the XDC network.
      </p>

      <div className="steps-container">
        <div className="step mb-5">
          <div className="step-number text-primary font-semibold mb-2">
            {isXdcConnected ? undefined : "Step 1"}
          </div>
          <button
            onClick={() => {
              connectToXdcNetwork();
              setShowConnectXdcPopup(true);
            }}
            disabled={isConnecting || isXdcConnected}
            className={`flex flex-col justify-center items-center w-full p-4
              bg-dark-light border-primary-dark
              border rounded-lg text-white text-base
              ${
                isXdcConnected
                  ? "cursor-default border-primary"
                  : "cursor-pointer hover:border-primary"
              } mb-4`}
          >
            <span>
              {isXdcConnected
                ? "Connected to XDC network"
                : isConnecting
                ? "Connecting..."
                : "Connect to XDC network"}
            </span>
          </button>
        </div>
      </div>

      <p className="text-center text-[#A5C8CA] mb-4">
        Once the XDC network is connected, click the button below to claim your
        tokens.
      </p>

      <button
        onClick={handleClaimTokens}
        disabled={!isXdcConnected || isClaimingTokens}
        className={`w-full py-4 rounded-lg text-lg font-bold text-dark
          ${
            !isXdcConnected || isClaimingTokens
              ? "bg-primary-dark cursor-not-allowed"
              : "bg-primary cursor-pointer hover:bg-primary-light"
          }`}
      >
        {isClaimingTokens ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : !isXdcConnected ? (
          "Connect to XDC first"
        ) : (
          `Claim $XDCAI tokens!`
        )}
      </button>

      {/* Popups */}
      {showThankYouPopup && <ThankYouPopup />}
      {showConnectXdcPopup && (
        <ConnectXdcPopup
          isConnected={isConnected}
          contributionId={contributionId}
          setIsAddressConfirmed={setIsAddressConfirmed}
          setShowConnectXdcPopup={setShowConnectXdcPopup}
          handleClaimTokens={handleClaimTokens}
        />
      )}
    </div>
  );
};

export default ThankYouScreen;
