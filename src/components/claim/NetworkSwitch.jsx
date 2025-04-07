import React from "react";
import { useNetwork } from "../../context/NetworkContext";

/**
 * Component that displays XDC network details and instructions
 * to help users connect to the correct network
 */
const NetworkSwitch = () => {
  const { getNetworkDetails, isTestnet } = useNetwork();
  const networkDetails = getNetworkDetails();

  return (
    <div className="bg-dark-light border border-[#425152] rounded-lg p-4 mb-5">
      <h3 className="text-primary mb-3 text-center font-semibold">
        XDC Network Details
      </h3>

      <div className="network-info space-y-2">
        <div className="flex justify-between">
          <strong className="text-primary">Network Name:</strong>
          <span className="text-white">{networkDetails.networkName}</span>
        </div>

        <div className="flex justify-between">
          <strong className="text-primary">Chain ID:</strong>
          <span className="text-white">{networkDetails.chainId}</span>
        </div>

        <div className="flex justify-between">
          <strong className="text-primary">Currency Symbol:</strong>
          <span className="text-white">{networkDetails.currencySymbol}</span>
        </div>

        <div className="flex flex-col mb-2">
          <strong className="text-primary mb-1">RPC URL:</strong>
          <span className="text-white text-sm break-all">
            {networkDetails.rpcUrl}
          </span>
        </div>

        <div className="flex flex-col">
          <strong className="text-primary mb-1">Block Explorer:</strong>
          <span className="text-white text-sm break-all">
            {networkDetails.blockExplorer}
          </span>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-light italic">
        {isTestnet ? (
          <p>
            You are connecting to the XDC Apothem Testnet. For development
            purposes only.
          </p>
        ) : (
          <p>
            MetaMask will prompt you to add this network. Please approve the
            request to connect.
          </p>
        )}
      </div>
    </div>
  );
};

export default NetworkSwitch;
