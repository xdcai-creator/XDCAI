// src/components/ThankYouScreen.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ethers } from "ethers"; // Using v5.7.2 as per package.json
import { toast } from "react-toastify";
import { switchToXdcNetwork, isTestnet, addXdcNetworkToWallet } from "./config";
import { XDCAIPresale2_ABI } from "../contracts/abis";
import { CONTRACT_ADDRESSES } from "../contracts/contractAddresses";
import { useContract } from "../hooks/useContract";
import { MetamaskIcon, XDCClaimsPageIcon } from "./icons/CryptoIcons";
import { contributionsApi } from "../services/api";

// MetaMask mobile SDK is better for production, but for simplicity,
// we'll use deep linking for mobile MetaMask interaction
const METAMASK_DEEPLINK = "https://metamask.app.link/dapp/";

export const ThankYouScreen = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { contract: presaleContract, error: contractError } =
    useContract("XDCAIPresale2");

  // State variables
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isXdcConnected, setIsXdcConnected] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [showXdcNetworkDetails, setShowXdcNetworkDetails] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);

  //for setting XDC claim address
  const [xdcAddressInput, setXdcAddressInput] = useState("");
  const [isSubmittingXdcAddress, setIsSubmittingXdcAddress] = useState(false);
  const [xdcAddressSubmitted, setXdcAddressSubmitted] = useState(false);
  const [contributionId, setContributionId] = useState(null);
  const [showXdcAddressForm, setShowXdcAddressForm] = useState(false);

  // Check device type and connection on component mount
  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
    checkXdcConnection();
  }, [isConnected, address]);

  // Check wallet connection to XDC network
  const checkXdcConnection = async () => {
    try {
      // For mobile, we won't check MetaMask specifically, just if we have a provider
      // This allows other mobile wallets to work as well
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        // XDC Mainnet (50) or XDC Testnet (51)
        const isXdc = network.chainId === (isTestnet ? 51 : 50);
        setIsXdcConnected(isXdc);

        // If we have a provider, we can proceed without requiring specifically MetaMask
        setIsMetaMaskInstalled(true);
      } else {
        setIsMetaMaskInstalled(false);
        setIsXdcConnected(false);
      }
    } catch (err) {
      console.error("Error checking XDC connection:", err);
      setIsMetaMaskInstalled(false);
      setIsXdcConnected(false);
    }
  };

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
    }
  }, [navigate]);

  // Check if user already has email registered
  useEffect(() => {
    const checkUserEmail = async () => {
      if (!address) return;

      try {
        setIsCheckingEmail(true);

        // Call the API to check if user has email
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await fetch(
          `${apiUrl}/api/users/walletAddress?walletAddress=${address}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.email) {
            setUserEmail(data.email);
            setEmailSubmitted(true);

            //to trigger purchase email
            let showEmailToast = false;
            storeEmailApi(data.email, showEmailToast);
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

    if (isConnected && address) {
      checkUserEmail();
    }
  }, [address, isConnected]);

  // Listen for wallet connection changes
  useEffect(() => {
    if (!isMetaMaskInstalled && window.ethereum) {
      // Provider appeared - user might have connected a wallet
      setIsMetaMaskInstalled(true);
      // toast.success("Wallet connected! Now connect to XDC Network");
      checkXdcConnection();
    }

    // Set up listener for wallet connection
    const handleProviderUpdate = () => {
      setIsMetaMaskInstalled(!!window.ethereum);
      checkXdcConnection();
    };

    window.addEventListener("ethereum#initialized", handleProviderUpdate);

    // Some mobile wallets might inject ethereum after page load
    const checkInterval = setInterval(() => {
      if (window.ethereum && !isMetaMaskInstalled) {
        handleProviderUpdate();
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => {
      window.removeEventListener("ethereum#initialized", handleProviderUpdate);
      clearInterval(checkInterval);
    };
  }, [isMetaMaskInstalled]);

  // Listen for network changes with any wallet
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = async (chainId) => {
        // Convert hex chainId to decimal for comparison
        const chainIdDecimal = parseInt(chainId, 16);
        const targetChainId = isTestnet ? 51 : 50;

        setIsXdcConnected(chainIdDecimal === targetChainId);

        // if (chainIdDecimal === targetChainId) {
        // toast.success("Successfully connected to XDC Network!");
        // }
      };

      // Check current chain when component mounts
      window.ethereum
        .request({ method: "eth_chainId" })
        .then(handleChainChanged)
        .catch((err) => console.error("Error getting chain ID:", err));

      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [isTestnet]);

  // Connect to XDC Network
  const handleXdcNetworkConnect = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      setShowXdcNetworkDetails(true);

      // Use utility function to switch to XDC network
      await switchToXdcNetwork(isTestnet);

      // If we get here, the network switch was successful
      setIsXdcConnected(true);
      toast.success(
        `Connected to ${isTestnet ? "XDC Testnet" : "XDC Network"}`
      );
    } catch (error) {
      console.error("XDC network connection error:", error);
      // setError("Failed to connect to XDC network. Please try again.");

      // Show manual instructions if auto-switching failed
      if (error.code === 4902) {
        toast.error(
          "Could not automatically add XDC network. Please add it manually with the details shown below."
        );
      } else {
        toast.error("Failed to connect to XDC network. Please try manually.");
      }

      setIsXdcConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

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

  // Handle email submission
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
    } catch (error) {
      setError(error.message || "Failed to submit email");
    }
  };

  // API call to store email
  const storeEmailApi = async (_emailInput, showEmailToast = true) => {
    try {
      setIsSubmittingEmail(true);
      setError(null);

      if (!address) {
        throw new Error("Wallet not connected");
      }

      const txDetails =
        transactionDetails ||
        JSON.parse(localStorage.getItem("xdcai_tx_details") || "{}");

      // Prepare transaction data for API
      const transformedTransactionData = {
        amount: txDetails.amount || "0",
        tokenType: txDetails.currency || "ETH",
        tokenDecimals:
          txDetails.currency === "USDT" || txDetails.currency === "USDC"
            ? 6
            : 18,
        tokensReceived: txDetails.tokens || "0",
        bonusTokens: txDetails.bonusTokens || "0",
        hash: txDetails.hash || "",
        usdValue: txDetails.usdValue || 0,
      };

      // Submit email to backend API
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/users/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: _emailInput,
          walletAddress: address,
          transactionData: transformedTransactionData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit email");
      }

      setEmailSubmitted(true);
      if (showEmailToast) {
        toast.success("Email submitted successfully!");
      }
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

  // Handle claiming tokens from contract
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
      const vestingInfo = await contract.getVestingInfo(address);

      // console.log("claimable ", ethers.utils.formatUnits(claimable, 18));
      // console.log(
      //   "Total amount:",
      //   ethers.utils.formatUnits(vestingInfo.totalAmount, 18)
      // );
      // console.log(
      //   "Released so far:",
      //   ethers.utils.formatUnits(vestingInfo.releasedAmount, 18)
      // );
      // console.log(
      //   "Currently vested:",
      //   ethers.utils.formatUnits(vestingInfo.vestedAmount, 18)
      // );
      // console.log(
      //   "Next unlock time:",
      //   new Date(vestingInfo.nextUnlockTime * 1000).toLocaleString()
      // );

      if (claimable.toString() === "0") {
        toast.info("No tokens available to claim at this time.");
        return;
      }

      return;
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

  // Handle wallet connection guidance
  const handleWalletGuidance = () => {
    if (isMobile) {
      // For mobile, we'll offer multiple options
      const userChoice = window.confirm("Would you like to open MetaMask?.");

      if (userChoice) {
        // Try to open MetaMask or take them to app store
        window.location.href = METAMASK_DEEPLINK + window.location.hostname;
      } else {
        // Show alternatives
        toast.info("We only accept Metamask for now");
      }
    } else {
      // On desktop, open MetaMask extension page
      window.open("https://metamask.io/download.html", "_blank");
    }
  };

  const isValidXdcAddress = (address) => {
    return /^(xdc|0x)[a-fA-F0-9]{40}$/i.test(address);
  };

  // Render email collection form if user doesn't have email
  if (isCheckingEmail) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-pulse">Checking account information...</div>
      </div>
    );
  }

  // Email submission form
  if (!emailSubmitted) {
    return (
      <div className="p-5">
        {/* <h3 className="text-white text-center mb-4">
          Stay Updated on Your Investment
        </h3> */}
        <p className="text-white text-[#aaa] text-sm mb-4">
          Please Enter Your Email ID To Claim The $XDCAI Tokens
        </p>

        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter your email address"
            className="w-full bg-[#1A1A1A] rounded-md border border-[#333333] p-3 text-white text-lg mb-4"
            required
          />

          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-4 text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmittingEmail || !emailInput}
            className={`w-full py-3 rounded-md font-bold text-black
              ${
                isSubmittingEmail || !emailInput
                  ? "bg-[#5a8f5a] cursor-not-allowed"
                  : "bg-[#00FA73] cursor-pointer hover:bg-[#00E066]"
              }`}
          >
            {isSubmittingEmail ? "Submitting..." : "Submit Email"}
          </button>
        </form>
      </div>
    );
  }

  // XDC Address submission form
  if (showXdcAddressForm && !xdcAddressSubmitted) {
    return (
      <div className="p-5">
        <p className="text-white text-[#aaa] text-sm mb-4">
          Please provide your XDC address to receive your XDCAI tokens
        </p>

        <form onSubmit={handleXdcAddressSubmit}>
          <input
            type="text"
            value={xdcAddressInput}
            onChange={(e) => setXdcAddressInput(e.target.value)}
            placeholder="Enter XDC address (starts with xdc or 0x)"
            className="w-full bg-[#1A1A1A] rounded-md border border-[#333333] p-3 text-white text-lg mb-4"
            required
          />

          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-4 text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmittingXdcAddress || !xdcAddressInput}
            className={`w-full py-3 rounded-md font-bold text-black
            ${
              isSubmittingXdcAddress || !xdcAddressInput
                ? "bg-[#5a8f5a] cursor-not-allowed"
                : "bg-[#00FA73] cursor-pointer hover:bg-[#00E066]"
            }`}
          >
            {isSubmittingXdcAddress ? "Submitting..." : "Submit XDC Address"}
          </button>
        </form>
      </div>
    );
  }

  // Show wallet connection prompt if no provider is detected
  if (!isMetaMaskInstalled) {
    return (
      <div className="p-5">
        <div className="text-[#707070] text-[20px] text-center mb-[20px]">
          Thanks for purchasing XDCAI tokens!
        </div>

        <p className="text-[15px] text-center !text-[#A5C8CA] mb-5">
          In order to claim your tokens, please download metamask and connect to
          the XDC network.
        </p>

        <div className="steps-container">
          <div className="step mb-5">
            <div className="step-number text-[#00FA73] font-[600] mb-2">
              Step 1
            </div>
            <button
              onClick={handleWalletGuidance}
              className="flex justify-between items-center w-full p-4 bg-[#0E281A]
                border !border-[#00FA73] rounded-lg text-white text-base cursor-pointer"
            >
              <span>Download MetaMask"</span>
              <div>
                <MetamaskIcon />
              </div>
            </button>
          </div>
          <div className="step mb-5">
            <div className="step-number !text-[#A5C8CA] font-[600] mb-2">
              Step 2
            </div>
            <button
              // onClick={handleWalletGuidance}
              disabled
              className="flex justify-between items-center w-full p-4
                border !border-[#425152] rounded-lg text-white text-base cursor-pointer"
            >
              <span>Connect to XDC network!</span>
              <div>
                <XDCClaimsPageIcon />
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-[#707070] my-4">
          {isMobile
            ? "Once you have a wallet installed, return to this page in your wallet's browser."
            : "Once MetaMask is installed, refresh this page to continue."}
        </p>

        {isMobile && (
          <div className="bg-[#112211] border border-[#333] rounded-md p-4 mt-5">
            <h3 className="text-[#00FA73] mb-2 text-center">
              Compatible Wallets
            </h3>
            <ul className="list-disc list-inside text-[#b0b0b0]">
              <li>MetaMask Mobile</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Main view for connecting to XDC and claiming tokens
  return (
    <div className="p-5">
      <div className="text-[white] text-[20px] text-center mb-[20px] text-[20px]">
        Thanks for purchasing XDCAI tokens!
      </div>

      <p className="text-[15px] text-center text-[#A5C8CA] mb-5">
        In order to claim your tokens, please connect to the XDC network.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-md p-4 mb-5 text-center text-red-400">
          {error}
        </div>
      )}

      <div className="steps-container">
        <div className="step mb-5">
          <div className="step-number text-[#00FA73] font-bold mb-2">
            {isXdcConnected ? undefined : "Step 2"}
          </div>
          <button
            onClick={handleXdcNetworkConnect}
            disabled={isConnecting || isXdcConnected}
            className={`flex flex-col justify-between items-center w-full p-4
                  bg-[#112211] !border-[#00FA73]
              border rounded-lg text-white text-base
              ${isXdcConnected ? "cursor-default" : "cursor-pointer"} mb-4`}
          >
            <div className="mb-2">
              <XDCClaimsPageIcon />
            </div>
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

      {showXdcNetworkDetails && !isXdcConnected && (
        <div className="bg-[#112211] border border-[#333] rounded-md p-4 mb-5">
          <h3 className="text-[#00FA73] mb-3 text-center">
            XDC Network Details
          </h3>
          <div className="network-info">
            <p className="mb-2">
              <strong className="text-[#00FA73] mr-2">Network Name:</strong>
              <span className="text-[#b0b0b0]">
                {isTestnet ? "XDC Apothem Testnet" : "XDC Network"}
              </span>
            </p>
            <p className="mb-2">
              <strong className="text-[#00FA73] mr-2">Chain ID:</strong>
              <span className="text-[#b0b0b0]">{isTestnet ? "51" : "50"}</span>
            </p>
            <p className="mb-2">
              <strong className="text-[#00FA73] mr-2">Currency Symbol:</strong>
              <span className="text-[#b0b0b0]">
                {isTestnet ? "TXDC" : "XDC"}
              </span>
            </p>
            <p className="mb-2">
              <strong className="text-[#00FA73] mr-2">RPC URL:</strong>
              <span className="text-[#b0b0b0]">
                {isTestnet
                  ? "https://erpc.apothem.network"
                  : "https://erpc.xinfin.network"}
              </span>
            </p>
            <p className="mb-2">
              <strong className="text-[#00FA73] mr-2">Block Explorer:</strong>
              <span className="text-[#b0b0b0]">
                {isTestnet
                  ? "https://explorer.apothem.network"
                  : "https://explorer.xinfin.network"}
              </span>
            </p>
          </div>
          <p className="mt-3 text-sm text-[#aaa] italic">
            MetaMask will prompt you to add this network. Please approve the
            request to connect.
          </p>
        </div>
      )}

      <p className="text-center text-[#A5C8CA] mb-4">
        Once the XDC network is connected, click on the Claim button below to
        claim your $XDCAI tokens.
      </p>

      <button
        onClick={handleClaimTokens}
        disabled={!isXdcConnected || isClaimingTokens}
        className={`w-full py-4 rounded-lg text-lg font-bold text-black
          ${
            !isXdcConnected || isClaimingTokens
              ? "bg-[#5a8f5a] cursor-not-allowed"
              : "bg-[#00FA73] cursor-pointer hover:bg-[#00E066]"
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
