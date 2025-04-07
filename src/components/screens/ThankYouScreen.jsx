import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../../hooks/useWallet";
import { useNetwork } from "../../context/NetworkContext";
import { contributionsApi } from "../../services/api";
import NetworkSwitch from "../claim/NetworkSwitch";
import { isValidXdcAddress } from "../../utils/validators";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "../../contracts/contractAddresses";
import XDCAIPresale2_ABI from "../../contracts/abis/XDCAIPresale";

/**
 * Thank you screen shown after successful purchase
 * Collects email and XDC claim address for token delivery
 */
const ThankYouScreen = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const { isXdcConnected, connectToXdcNetwork, isConnecting } = useNetwork();

  // State variables
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [error, setError] = useState(null);

  // XDC claim address state
  const [xdcAddressInput, setXdcAddressInput] = useState("");
  const [isSubmittingXdcAddress, setIsSubmittingXdcAddress] = useState(false);
  const [xdcAddressSubmitted, setXdcAddressSubmitted] = useState(false);
  const [contributionId, setContributionId] = useState(null);
  const [showXdcAddressForm, setShowXdcAddressForm] = useState(false);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  //
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);

  // Check if user already has email/XDC address registered
  useEffect(() => {
    const checkUserInfo = async () => {
      if (!address) return;

      try {
        setIsCheckingEmail(true);

        // Call the API to check if user has email and XDC claim address
        const response = await contributionsApi.checkUserEmail(address);

        if (response) {
          if (response.email) {
            setUserEmail(response.email);
            setEmailSubmitted(true);

            // Check for any contribution without XDC claim address
            if (response.contributions && response.contributions.length > 0) {
              const contributionWithoutXdcAddress = response.contributions.find(
                (contribution) =>
                  !contribution.xdcClaimAddress &&
                  contribution.status !== "Claimed"
              );

              if (contributionWithoutXdcAddress) {
                setContributionId(contributionWithoutXdcAddress._id);
                setShowXdcAddressForm(true);
                setXdcAddressSubmitted(false);
              } else {
                setXdcAddressSubmitted(true);
              }
            } else {
              // No contributions found - shouldn't happen on thank you page
              setXdcAddressSubmitted(true); // Skip XDC address form
            }
          } else {
            setEmailSubmitted(false);
            setShowXdcAddressForm(false);
          }
        } else {
          // If user not found, we need to collect email
          setEmailSubmitted(false);
          setShowXdcAddressForm(false);
        }
      } catch (err) {
        console.error("Error checking user info:", err);
        setEmailSubmitted(false);
        setShowXdcAddressForm(false);
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
        setTransactionDetails(JSON.parse(txDetails));
      } catch (err) {
        console.error("Error parsing transaction details:", err);
        navigate("/purchase");
      }
    } else {
      // No transaction details found, redirect to purchase
      navigate("/purchase");
    }
  }, [navigate]);

  // Submit email
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
      await storeEmailApi(emailInput);
      setUserEmail(emailInput);
      setEmailSubmitted(true);

      // If transaction was in XDC, no need to ask for XDC address
      if (transactionDetails?.currency === "XDC") {
        setXdcAddressSubmitted(true);
      } else {
        // Show the XDC address form after email is submitted
        setShowXdcAddressForm(true);
      }
    } catch (error) {
      setError(error.message || "Failed to submit email");
    }
  };

  // Submit XDC claim address
  const handleXdcAddressSubmit = async (e) => {
    e.preventDefault();

    if (!isValidXdcAddress(xdcAddressInput)) {
      setError("Please enter a valid XDC address (starts with xdc or 0x)");
      return;
    }

    try {
      setIsSubmittingXdcAddress(true);
      setError(null);

      // Update the XDC claim address using the API
      await contributionsApi.updateClaimAddress(
        contributionId,
        xdcAddressInput
      );

      setXdcAddressSubmitted(true);
      setShowXdcAddressForm(false);
      toast.success("XDC claim address submitted successfully!");
    } catch (error) {
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to submit XDC address"
      );
    } finally {
      setIsSubmittingXdcAddress(false);
    }
  };

  // Store email API call
  const storeEmailApi = async (_emailInput, showEmailToast = true) => {
    try {
      setIsSubmittingEmail(true);
      setError(null);

      console.log(`_emailInput,
      address,
      transactionDetails ${_emailInput}, ${address}, ${JSON.stringify(
        transactionDetails
      )}`);

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

  const handleClaimTokens = async () => {
    if (!isXdcConnected || !isConnected || !address) {
      toast.error("Please connect to XDC Network first");
      return;
    }

    try {
      setIsClaimingTokens(true);

      // First ensure we have a provider
      if (!window.ethereum) {
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

      if (claimable.toString() === "0") {
        toast.info("No tokens available to claim at this time.");
        return;
      }

      // Execute the claim transaction
      const tx = await contract.claimTokens();
      toast.info("Transaction submitted, waiting for confirmation...");

      // Wait for transaction to confirm
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success("Tokens claimed successfully!");

        localStorage.removeItem("xdcai_tx_details");

        setTimeout(() => {
          navigate("/purchase");
        }, 1000 * 3);

        // navigate("/claim"); // Navigate to claim screen that shows vesting details
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Claim error:", error);

      // Provide more user-friendly error messages
      if (error.code === 4001) {
        toast.error("Transaction rejected. Please try again.");
      } else if (error.message.includes("user rejected")) {
        toast.error("Transaction was cancelled. Please try again when ready.");
      } else {
        toast.error(error.message || "Failed to claim tokens");
      }

      // setError(error.message || "Failed to claim tokens");
    } finally {
      setIsClaimingTokens(false);
    }
  };

  // If still checking email status, show loading
  if (isCheckingEmail) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-pulse">Checking account information...</div>
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
        <p className="text-white text-[#aaa] text-sm mb-4">
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
            {isSubmittingEmail ? "Submitting..." : "Submit Email"}
          </button>
        </form>
      </div>
    );
  }

  // If we need XDC address and it's not yet submitted
  if (showXdcAddressForm && !xdcAddressSubmitted) {
    return (
      <div className="p-5 max-w-md mx-auto">
        <p className="text-white text-[#aaa] text-sm mb-4">
          Please provide your XDC address to receive your XDCAI tokens
        </p>

        <form onSubmit={handleXdcAddressSubmit}>
          <input
            type="text"
            value={xdcAddressInput}
            onChange={(e) => setXdcAddressInput(e.target.value)}
            placeholder="Enter XDC address (starts with xdc or 0x)"
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
            disabled={isSubmittingXdcAddress || !xdcAddressInput}
            className={`w-full py-3 rounded-md font-bold text-dark
            ${
              isSubmittingXdcAddress || !xdcAddressInput
                ? "bg-primary-dark cursor-not-allowed"
                : "bg-primary cursor-pointer hover:bg-primary-light"
            }`}
          >
            {isSubmittingXdcAddress ? "Submitting..." : "Submit XDC Address"}
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

      <div className="mb-6 p-4 bg-dark-light border border-[#425152] rounded-lg">
        <h3 className="text-primary font-bold mb-3 text-center">
          Purchase Summary
        </h3>

        {transactionDetails && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">
                {transactionDetails.amount} {transactionDetails.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>USD Value:</span>
              <span className="font-semibold">
                ${transactionDetails.usdValue?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>XDCAI Tokens:</span>
              <span className="font-semibold">
                {parseFloat(transactionDetails.tokens).toFixed(4)}
              </span>
            </div>
            {parseFloat(transactionDetails.bonusTokens) > 0 && (
              <div className="flex justify-between">
                <span>Bonus Tokens:</span>
                <span className="font-semibold text-primary">
                  {parseFloat(transactionDetails.bonusTokens).toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

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
              setShowNetworkDetails(true);
            }}
            disabled={isConnecting || isXdcConnected}
            className={`flex flex-col justify-center items-center w-full p-4
              bg-dark-light border-primary-dark
              border rounded-lg text-white text-base
              ${
                isXdcConnected
                  ? "cursor-default"
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

      {/* Network details shown when trying to connect */}
      {showNetworkDetails && !isXdcConnected && <NetworkSwitch />}

      <p className="text-center text-[#A5C8CA] mb-4">
        Once the XDC network is connected, navigate to claim page to track your
        vesting and claim tokens.
      </p>

      <button
        onClick={() => handleClaimTokens()}
        disabled={!isXdcConnected || isClaimingTokens}
        className={`w-full py-4 rounded-lg text-lg font-bold text-dark
          ${
            !isXdcConnected
              ? "bg-primary-dark cursor-not-allowed"
              : "bg-primary cursor-pointer hover:bg-primary-light"
          }`}
      >
        {isClaimingTokens
          ? "Processing..."
          : !isXdcConnected
          ? "Connect to XDC first"
          : "Claim XDCAI tokens!"}
      </button>
    </div>
  );
};

export default ThankYouScreen;
