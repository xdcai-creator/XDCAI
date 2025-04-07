import React from "react";

/**
 * Component for displaying crypto currency icons
 * Uses a simple placeholder approach that can be replaced with actual SVG icons
 */
const CryptoIcon = ({ symbol, size = 32 }) => {
  // Get background color based on symbol
  const getBackgroundColor = () => {
    switch (symbol) {
      case "ETH":
        return "#627EEA";
      case "BNB":
        return "#F3BA2F";
      case "SOL":
        return "#9945FF";
      case "USDT":
      case "USDT-BNB":
      case "USDT-SOL":
        return "#26A17B";
      case "USDC":
      case "USDC-BNB":
      case "USDC-SOL":
        return "#2775CA";
      case "XDC":
        return "#143C7E";
      default:
        return "#808080";
    }
  };

  // Get the base symbol
  const getBaseSymbol = () => {
    if (symbol.includes("-")) {
      return symbol.split("-")[0];
    }
    return symbol;
  };

  // Get secondary icon for bridged tokens
  const getSecondaryIcon = () => {
    if (!symbol.includes("-")) return null;

    const chain = symbol.split("-")[1];
    switch (chain) {
      case "BNB":
        return (
          <div
            className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border border-white bg-[#F3BA2F] flex items-center justify-center text-xs font-bold text-dark"
            style={{ transform: "translate(25%, 25%)" }}
          >
            B
          </div>
        );
      case "SOL":
        return (
          <div
            className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border border-white bg-[#9945FF] flex items-center justify-center text-xs font-bold text-white"
            style={{ transform: "translate(25%, 25%)" }}
          >
            S
          </div>
        );
      case "ETH":
        return (
          <div
            className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border border-white bg-[#627EEA] flex items-center justify-center text-xs font-bold text-white"
            style={{ transform: "translate(25%, 25%)" }}
          >
            E
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
          color: ["BNB", "USDT", "USDC", "USDT-BNB", "USDC-BNB"].includes(
            symbol
          )
            ? "black"
            : "white",
        }}
      >
        {getBaseSymbol().charAt(0)}
        {getBaseSymbol().charAt(1)}
      </div>
      {getSecondaryIcon()}
    </div>
  );
};

export default CryptoIcon;
