import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useNetwork } from "../context/NetworkContext";
import { XDCAIPresale2_ABI, XDCAIToken_ABI } from "../contracts/abis";
import networkConfig from "../config/networkConfig";

// Map of contract names to ABIs
const CONTRACT_ABIS = {
  XDCAIPresale2: XDCAIPresale2_ABI,
  XDCAIToken: XDCAIToken_ABI,
};

/**
 * Custom hook to interact with smart contracts
 * @param {string} contractName - The name of the contract to interact with
 * @returns {Object} - Contract instance and status
 */
export const useContract = (contractName) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected } = useAccount();
  const { isXdcConnected, isTestnet } = useNetwork();

  useEffect(() => {
    const initContract = async () => {
      if (!isConnected || !isXdcConnected) {
        setContract(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if window.ethereum is available
        if (!window.ethereum) {
          throw new Error("Please install MetaMask or another Ethereum wallet");
        }

        // Create a provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Get contract address based on testnet/mainnet status
        let contractAddress;
        if (contractName === "XDCAIPresale2") {
          contractAddress = networkConfig.contracts.xdcaiPresale;
        } else if (contractName === "XDCAIToken") {
          contractAddress = networkConfig.contracts.xdcaiToken;
        } else {
          throw new Error(`Unknown contract name: ${contractName}`);
        }

        if (
          !contractAddress ||
          contractAddress === "0x0000000000000000000000000000000000000000"
        ) {
          throw new Error(
            `Contract ${contractName} not deployed on this network`
          );
        }

        // Get the appropriate ABI
        const abi = CONTRACT_ABIS[contractName];
        if (!abi) {
          throw new Error(`ABI not found for contract ${contractName}`);
        }

        // Create contract instance
        const contractInstance = new ethers.Contract(
          contractAddress,
          abi,
          signer
        );
        setContract(contractInstance);
      } catch (err) {
        console.error("Error initializing contract:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initContract();

    // Listen for network and account changes
    const handleNetworkChange = () => {
      initContract();
    };

    const handleAccountChange = () => {
      initContract();
    };

    if (window.ethereum) {
      window.ethereum.on("chainChanged", handleNetworkChange);
      window.ethereum.on("accountsChanged", handleAccountChange);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", handleNetworkChange);
        window.ethereum.removeListener("accountsChanged", handleAccountChange);
      }
    };
  }, [contractName, isConnected, isXdcConnected, isTestnet]);

  return { contract, loading, error };
};

export default useContract;
