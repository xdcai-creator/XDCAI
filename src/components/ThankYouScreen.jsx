//src/components/ThankYouScreen.jsx
import React, { useState } from "react";
import { MetamaskIcon } from "./icons";
import { useConnect } from "wagmi";

export const ThankYouScreen = ({
  connectToXdcNetwork,
  setCurrentScreen,
  isXdcConnected,
}) => {
  const [error, setError] = useState(null);
  const [showXdcNetworkDetails, setShowXdcNetworkDetails] = useState(false);
  const { connectors, connect, isPending } = useConnect();
  const [pendingConnector, setPendingConnector] = useState(null);

  const handleMetaMaskConnect = async () => {
    try {
      // Find MetaMask connector
      const metaMaskConnector = connectors.find(
        (c) => c.id === "metaMask" || c.name?.toLowerCase().includes("metamask")
      );

      if (!metaMaskConnector) {
        window.open("https://metamask.io/download.html", "_blank");
        return;
      }

      setPendingConnector(metaMaskConnector.id);

      // Attempt connection with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 30000);
      });

      const connectionPromise = connect({ connector: metaMaskConnector });
      await Promise.race([connectionPromise, timeoutPromise]);

      setError(null);
    } catch (error) {
      console.error("MetaMask connection error:", error);
      setError("Failed to connect to MetaMask. Please try again.");
      setPendingConnector(null);
    }
  };

  const handleXdcNetworkConnect = async () => {
    try {
      setShowXdcNetworkDetails(true);
      const XDC_NETWORK = {
        chainId: "0x32", // 50 in decimal
        chainName: "XDC Network",
        nativeCurrency: {
          name: "XDC",
          symbol: "XDC",
          decimals: 18,
        },
        rpcUrls: ["https://erpc.xinfin.network"],
        blockExplorerUrls: ["https://xdcscan.io"],
      };

      await connectToXdcNetwork({
        provider: window.ethereum,
        setIsXdcConnected: () => {},
        setError,
        XDC_NETWORK,
      });
    } catch (error) {
      console.error("XDC network connection error:", error);
      setError("Failed to connect to XDC network. Please try again.");
    }
  };

  return (
    <div className="thank-you-screen">
      <h2>Thanks for purchasing $XDCAI tokens!</h2>
      <p>
        In order to claim your tokens, please download metamask and connect to
        the XDC network.
      </p>
      {error && <div className="error-message">{error}</div>}
      <div className="steps-container">
        <div className="step">
          <div className="step-number">Step 1</div>
          <button
            className="step-button"
            onClick={handleMetaMaskConnect}
            disabled={isPending && pendingConnector === "metaMask"}
          >
            <span>Connect to Metamask</span>
            <MetamaskIcon />
          </button>
        </div>
        <div className="step">
          <div className="step-number">Step 2</div>
          <button
            className="step-button"
            onClick={handleXdcNetworkConnect}
            disabled={isPending}
          >
            <span>Connect to XDC network!</span>
            <span className="xdc-icon">XDC</span>
          </button>
        </div>
      </div>

      {showXdcNetworkDetails && (
        <div className="xdc-network-details">
          <h3>XDC Network Details</h3>
          <div className="network-info">
            <p>
              <strong>Network Name:</strong> XDC Network
            </p>
            <p>
              <strong>Chain ID:</strong> 50{" "}
            </p>
            <p>
              <strong>Currency Symbol:</strong> XDC
            </p>
            <p>
              <strong>RPC URL:</strong> https://erpc.xinfin.network
            </p>
            <p>
              <strong>Block Explorer:</strong> https://xdcscan.io
            </p>
          </div>
          <p className="network-note">
            MetaMask will prompt you to add this network. Please approve the
            request to connect.
          </p>
        </div>
      )}

      <p>
        Once metamask is connected, click on the Claim button below to claim
        your $XDCAI tokens.
      </p>
      <button
        className="claim-button"
        onClick={() => setCurrentScreen(4)}
        disabled={!isXdcConnected}
      >
        Claim $XDCAI tokens!
      </button>
    </div>
  );
};

export default ThankYouScreen;
