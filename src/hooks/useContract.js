import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, NETWORKS } from "../contracts/contractAddresses";
import { XDCAIPresale2_ABI, XDCAIToken_ABI } from "../contracts/abis";

/**
 * Custom hook to interact with smart contracts
 * @param {string} contractName - The name of the contract to interact with
 * @returns {Object} - Contract instance and loading state
 */
export const useContract = (contractName) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if window.ethereum is available
        if (!window.ethereum) {
          throw new Error("Please install MetaMask or another Ethereum wallet");
        }

        // Create a provider and get the current chain ID
        const provider = new ethers.BrowserProvider(window.ethereum);
        const { chainId } = await provider.getNetwork();

        // Get contract address for current network
        const address = CONTRACT_ADDRESSES[chainId.toString()][contractName];

        if (
          !address ||
          address === "0x0000000000000000000000000000000000000000"
        ) {
          throw new Error(
            `Contract ${contractName} not deployed on network ${chainId}`
          );
        }

        // Get the appropriate ABI
        let abi;
        switch (contractName) {
          case "XDCAIPresale2":
            abi = XDCAIPresale2_ABI;
            break;
          case "XDCAIToken":
            abi = XDCAIToken_ABI;
            break;
          default:
            throw new Error(`Unknown contract name: ${contractName}`);
        }

        // Create and return contract instance
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(address, abi, signer);
        setContract(contractInstance);
      } catch (err) {
        console.error("Error initializing contract:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initContract();

    // Listen for chain changes and reinitialize the contract
    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [contractName]);

  return { contract, loading, error };
};
