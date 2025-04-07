import React from "react";

/**
 * Component for displaying bridged token icons
 * (e.g., USDT on BSC, USDC on Solana)
 */
const BridgeIcon = ({ primarySymbol, secondarySymbol, size = 32 }) => {
  // Get background color based on token symbol
  const getPrimaryColor = () => {
    switch (primarySymbol) {
      case "USDT":
        return "#26A17B";
      case "USDC":
        return "#2775CA";
      case "ETH":
        return "#627EEA";
      case "BNB":
        return "#F3BA2F";
      case "SOL":
        return "#9945FF";
      case "XDC":
        return "#143C7E";
      default:
        return "#808080";
    }
  };

  // Get background color for the secondary icon
  const getSecondaryColor = () => {
    switch (secondarySymbol) {
      case "ETH":
        return "#627EEA";
      case "BNB":
        return "#F3BA2F";
      case "SOL":
        return "#9945FF";
      default:
        return "#808080";
    }
  };

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Primary Icon - Full size in background */}
      <div
        className="rounded-full absolute flex items-center justify-center text-sm font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: getPrimaryColor(),
          color:
            primarySymbol === "USDT" ||
            primarySymbol === "USDC" ||
            primarySymbol === "BNB"
              ? "black"
              : "white",
          zIndex: 10,
        }}
      >
        {primarySymbol.charAt(0)}
        {primarySymbol.charAt(1)}
      </div>

      {/* Secondary Icon - Smaller, overlapping */}
      <div
        className="absolute border-2 border-white rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          bottom: 0,
          right: 0,
          backgroundColor: getSecondaryColor(),
          color: secondarySymbol === "BNB" ? "black" : "white",
          transform: "translate(25%, 25%)",
          fontSize: "0.7em",
          fontWeight: "bold",
          zIndex: 20,
        }}
      >
        {secondarySymbol.charAt(0)}
      </div>
    </div>
  );
};

export default BridgeIcon;
