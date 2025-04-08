import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { useNetwork } from "../../context/NetworkContext";
import { contributionsApi } from "../../services/api";
import { XDCIcon } from "../icons/CryptoIcons";

// Connect to XDC Network Popup
const ConnectXdcPopup = ({
  isConnected,
  contributionId,
  setIsAddressConfirmed,
  setShowConnectXdcPopup,
  handleClaimTokens,
}) => {
  const { isXdcConnected, connectToXdcNetwork, isConnecting } = useNetwork();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState("connect"); // "connect", "confirm", "processing"
  const [xdcAddress, setXdcAddress] = useState("");

  // Get XDC address when connected
  useEffect(() => {
    const getXdcAddress = async () => {
      if (isXdcConnected && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts && accounts.length > 0) {
            setXdcAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Error getting XDC address:", error);
        }
      }
    };

    getXdcAddress();
  }, [isXdcConnected]);

  // Handle connecting to XDC network
  const handleConnectXdc = async () => {
    setIsProcessing(true);

    try {
      // First try to connect to metamask if not already connected
      if (!isConnected && window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
          console.error("Failed to connect MetaMask:", error);
          toast.error("Please connect to MetaMask first");
          setIsProcessing(false);
          return;
        }
      }

      // Then connect to XDC network
      const connected = await connectToXdcNetwork();
      console.log("connected to xdc ", connected);

      if (connected) {
        // Get the XDC address
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts && accounts.length > 0) {
          setXdcAddress(accounts[0]);
          //   setCurrentStep("confirm");
          toast.success("Connected to XDC Network!");

          handleConfirmAddress(accounts[0]);

          // Close popup and proceed to claim
          //   setShowConnectXdcPopup(false);
        } else {
          toast.error("Failed to get XDC address");
        }
      } else {
        toast.error("Failed to connect to XDC Network");
      }
    } catch (error) {
      console.error("Error connecting to XDC:", error);
      toast.error("Error connecting to XDC Network");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle confirming the XDC address
  const handleConfirmAddress = async (_address) => {
    let _xdcAddress = xdcAddress || _address;
    if (!_xdcAddress) {
      toast.error("No XDC address available");
      return;
    }

    setCurrentStep("processing");
    setIsProcessing(true);

    try {
      // Update the XDC claim address using the API
      await contributionsApi.updateClaimAddress(
        contributionId,
        _xdcAddress // Use the detected XDC address
      );

      setIsAddressConfirmed(true);
      toast.success("XDC address confirmed for claiming!");

      // Close popup and proceed to claim
      setShowConnectXdcPopup(false);
      //   handleClaimTokens();
    } catch (error) {
      console.error("Error confirming XDC address:", error);
      toast.error("Failed to confirm XDC address. Please try again.");
      setCurrentStep("confirm");
    } finally {
      setIsProcessing(false);
    }
  };

  // Render based on current step
  if (currentStep === "connect") {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
        <div className="w-full max-w-md p-6 bg-[#1A1A1A] border border-[#333333] rounded-lg">
          <h2 className="text-xl text-white text-center font-semibold mb-4">
            Thanks for purchasing $XDCAI tokens!
          </h2>

          <p className="text-center text-gray-light mb-6">
            In order to claim your tokens, please connect to the XDC network.
          </p>

          <button
            onClick={handleConnectXdc}
            disabled={isProcessing}
            className="flex items-center justify-between w-full p-4 bg-[#0C0C0C] border border-primary rounded-lg text-white hover:bg-[#0A0A0A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Connecting...
              </>
            ) : (
              <>
                <XDCIcon />
                {/* <img src="/xdc-logo.png" alt="XDC" className="h-6 w-6 mr-3" /> */}
                <span className="text-lg">Connect to XDC network!</span>
              </>
            )}
          </button>

          <div className="text-center text-gray-light text-sm mt-4">
            Please make sure you have MetaMask installed and set up.
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "confirm") {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
        <div className="w-full max-w-md p-6 bg-[#1A1A1A] border border-[#333333] rounded-lg">
          <h2 className="text-xl text-white text-center font-semibold mb-4">
            Confirm Your XDC Address
          </h2>

          <div className="mb-4 p-3 bg-primary/10 border border-primary rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
              <span className="text-primary font-medium">
                Successfully connected to XDC Network
              </span>
            </div>
          </div>

          <p className="text-center text-gray-light mb-4">
            You will use the following address to claim your XDCAI tokens:
          </p>

          <div className="p-3 bg-[#0C0C0C] border border-[#333333] rounded-lg text-white text-center mb-6 break-all">
            {xdcAddress}
          </div>

          <p className="text-yellow-500 text-sm text-center mb-6">
            This address cannot be changed later. Please confirm this is the
            correct address.
          </p>

          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentStep("connect")}
              className="flex-1 py-3 bg-[#333333] rounded-lg text-white font-semibold hover:bg-[#444444] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmAddress}
              disabled={isProcessing}
              className="flex-1 py-3 bg-primary rounded-lg text-black font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
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
              ) : (
                "Confirm Address"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "processing") {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
        <div className="w-full max-w-md p-6 bg-[#1A1A1A] border border-[#333333] rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl text-white font-semibold mb-2">
              Processing
            </h2>
            <p className="text-gray-light">
              Please wait while we confirm your address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ConnectXdcPopup;
