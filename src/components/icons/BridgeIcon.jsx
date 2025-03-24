import React from "react";

// Bridge icon component
const BridgeIcon = ({
  Icon1 = "ETH",
  Icon2 = "BNB",
  className = "",
  size = 32,
}) => {
  // Validate and get icon components
  //   const FirstIcon = CryptoIcons[Icon1] || CryptoIcons.ETH;
  //   const SecondIcon = CryptoIcons[Icon2] || CryptoIcons.BNB;

  return (
    <div
      className={`relative flex items-center justify-center inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      {/* First Icon - Full size in background */}
      <div
        className="scale-[2] z-10 absolute flex items-center justify-center"
        style={{
          width: size,
          height: size,
          //   boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        <Icon1 />
      </div>

      {/* Second Icon - Smaller, overlapping */}
      <div
        className="absolute bottom-0 right-0 z-30  flex items-center justify-center border-white rounded-full overflow-hidden"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          transform: "translate(25%, 25%)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        <Icon2 />
      </div>
    </div>
  );
};

export default BridgeIcon;
