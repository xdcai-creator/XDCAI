//src/components/WalletOptions.jsx
import React, { useEffect } from "react";
import { useConnect } from "wagmi";
import { WalletOption } from "./WalletOption";

export function WalletOptions({ setSelectedWallet, onError }) {
  const { connectors, connect, isPending, error } = useConnect();
  const [pendingConnector, setPendingConnector] = React.useState(null);
  const [availableConnectors, setAvailableConnectors] = React.useState([]);
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);

  // Define our specific wallets we want to show
  const desiredWallets = [
    { id: "metaMask", name: "Metamask" },
    { id: "walletConnect", name: "WalletConnect" },
    { id: "coinbaseWallet", name: "Coinbase Wallet" },
  ];

  // Manually create our wallet list based on available connectors
  useEffect(() => {
    // Debug log to see what connectors are available
    console.log(
      "All available connectors:",
      connectors.map((c) => ({ id: c.id, name: c.name }))
    );

    // Show exactly the wallets we want, in our specific order
    const manuallyOrderedConnectors = [];

    // First add MetaMask
    const metaMaskConnector = connectors.find(
      (c) => c.id === "metaMask" || c.name?.toLowerCase().includes("metamask")
    );
    if (metaMaskConnector) manuallyOrderedConnectors.push(metaMaskConnector);

    // Then WalletConnect
    const walletConnectConnector = connectors.find(
      (c) =>
        c.id === "walletConnect" ||
        c.name?.toLowerCase().includes("walletconnect")
    );
    if (walletConnectConnector)
      manuallyOrderedConnectors.push(walletConnectConnector);

    // Then Coinbase Wallet
    const coinbaseConnector = connectors.find(
      (c) =>
        c.id === "coinbaseWallet" || c.name?.toLowerCase().includes("coinbase")
    );
    if (coinbaseConnector) manuallyOrderedConnectors.push(coinbaseConnector);

    // Log our final list for debugging
    console.log(
      "Manually ordered connectors:",
      manuallyOrderedConnectors.map((c) => ({ id: c.id, name: c.name }))
    );

    setAvailableConnectors(manuallyOrderedConnectors);
  }, [connectors]);

  // Handle connection error
  useEffect(() => {
    if (error) {
      console.error("Wallet connection error:", error);
      onError(error.message);

      // Reset pending state
      setPendingConnector(null);

      // Increment connection attempts
      setConnectionAttempts((prev) => prev + 1);
    }
  }, [error, onError]);

  // Connection timeout handler
  const connectWithTimeout = async (connector) => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 30000);
      });

      const connectionPromise = connect({ connector });
      await Promise.race([connectionPromise, timeoutPromise]);

      // Reset connection attempts on successful connection
      setConnectionAttempts(0);
    } catch (error) {
      console.error("Connection attempt failed:", error);
      onError(error.message);

      if (connectionAttempts < 3) {
        // Retry connection
        console.log("Retrying connection...");
        setTimeout(() => handleConnectWallet(connector), 1000);
      } else {
        onError(
          "Failed to connect after multiple attempts. Please try again later."
        );
        setConnectionAttempts(0);
      }
    }
  };

  // Handle wallet connection
  const handleConnectWallet = async (connector) => {
    try {
      setSelectedWallet(connector.id);
      setPendingConnector(connector.id);

      // Check if MetaMask is installed for MetaMask connector
      if (
        connector.id === "metaMask" &&
        typeof window.ethereum === "undefined"
      ) {
        throw new Error("Please install MetaMask to continue");
      }

      // Attempt connection with timeout
      await connectWithTimeout(connector);
    } catch (error) {
      console.error("Wallet connection error:", error);
      onError(error.message);
      setPendingConnector(null);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "0px 20px",
        backgroundColor: "#0c0c0c",
        color: "white",
        borderRadius: "12px",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "600",
          textAlign: "center",
          margin: "10px 0 20px 0",
        }}
      >
        Connect Wallet
      </h2>

      <p
        style={{
          textAlign: "center",
          margin: "10px 0",
          color: "#b0b0b0",
          fontSize: "16px",
          maxWidth: "450px",
        }}
      >
        If you already have a wallet, select it from the options below.
      </p>

      <p
        style={{
          textAlign: "center",
          margin: "10px 0 30px 0",
          color: "#b0b0b0",
          fontSize: "16px",
        }}
      >
        If you don't have a wallet, install{" "}
        <a
          href="https://metamask.io/download.html"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#00FA73",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          Metamask
        </a>{" "}
        to get started.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "520px",
        }}
      >
        {availableConnectors.length > 0 ? (
          availableConnectors.map((connector) => (
            <WalletOption
              key={connector.uid}
              connector={connector}
              onClick={() => handleConnectWallet(connector)}
              selectedWallet={pendingConnector}
              isPending={isPending && pendingConnector === connector.id}
            />
          ))
        ) : (
          <p style={{ color: "#b0b0b0", textAlign: "center" }}>
            No wallet connectors available. Please make sure you have a wallet
            installed.
          </p>
        )}
      </div>

      {/* Show error if any */}
      {error && (
        <p
          style={{
            marginTop: "20px",
            padding: "10px 15px",
            backgroundColor: "rgba(255, 76, 76, 0.1)",
            color: "#ff4c4c",
            borderRadius: "5px",
            textAlign: "center",
            width: "100%",
            maxWidth: "520px",
          }}
        >
          {error.message}
        </p>
      )}

      {/* Show connecting status */}
      {isPending && (
        <p
          style={{
            marginTop: "20px",
            padding: "10px 15px",
            backgroundColor: "rgba(144, 238, 144, 0.1)",
            color: "#00FA73",
            borderRadius: "5px",
            textAlign: "center",
            width: "100%",
            maxWidth: "520px",
          }}
        >
          Connecting to wallet...
        </p>
      )}
    </div>
  );
}
