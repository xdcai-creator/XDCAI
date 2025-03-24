// src/components/config.js
import { http, createConfig } from "wagmi";
import { mainnet, bsc } from "wagmi/chains";
import {
  injected,
  metaMask,
  coinbaseWallet,
  walletConnect,
} from "wagmi/connectors";

// Your WalletConnect project ID
const projectId = "1a4ff99bcd6e78be055075d2c24026b9"; // Replace with your actual project ID

// XDC Network configuration (Mainnet)
export const xdcNetwork = {
  id: 50,
  name: "XDC Network",
  network: "xdc",
  nativeCurrency: {
    name: "XDC",
    symbol: "XDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://erpc.xinfin.network"],
    },
    public: {
      http: ["https://erpc.xinfin.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "XDCScan",
      url: "https://explorer.xinfin.network",
    },
  },
};

// XDC Apothem Testnet configuration
export const xdcTestnet = {
  id: 51,
  name: "XDC Apothem Testnet",
  network: "xdc-testnet",
  nativeCurrency: {
    name: "TXDC",
    symbol: "TXDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://erpc.apothem.network"],
    },
    public: {
      http: ["https://erpc.apothem.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "XDCScan",
      url: "https://explorer.apothem.network",
    },
  },
  testnet: true,
};

// Create Wagmi config with all supported networks
export const config = createConfig({
  chains: [mainnet, bsc, xdcNetwork, xdcTestnet],
  connectors: [
    metaMask({ projectId }),
    walletConnect({ projectId, showQrModal: true }),
    coinbaseWallet({ appName: "XDCAI Presale" }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
    [xdcNetwork.id]: http("https://erpc.xinfin.network"),
    [xdcTestnet.id]: http("https://erpc.apothem.network"),
  },
});

// Fixed switchToXdcNetwork function for proper XDC Network switching

export const switchToXdcNetwork = async (testnet = false) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // XDC chainIds in decimal
    const testnetChainIdDecimal = 51;
    const mainnetChainIdDecimal = 50;

    // Convert to hex string with 0x prefix - ensure proper format
    const chainId = testnet
      ? `0x${testnetChainIdDecimal.toString(16)}` // "0x33" for testnet
      : `0x${mainnetChainIdDecimal.toString(16)}`; // "0x32" for mainnet

    console.log("Attempting to switch to chainId:", chainId);

    try {
      // First try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });

      console.log("Successfully switched to XDC network");
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (
        switchError.code === 4902 ||
        // Some providers give different error codes
        switchError.message.includes("wallet_addEthereumChain") ||
        switchError.message.includes("Unrecognized chain")
      ) {
        console.log("Network not found, attempting to add it...");
        return await addXdcNetworkToWallet(testnet);
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error("Error switching to XDC network:", error);
    throw error;
  }
};

// Improved function to add XDC network to wallet
export const addXdcNetworkToWallet = async (testnet = false) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const networkParams = testnet
    ? {
        chainId: `0x${(51).toString(16)}`, // "0x33"
        chainName: "XDC Apothem Testnet",
        nativeCurrency: {
          name: "TXDC",
          symbol: "TXDC",
          decimals: 18,
        },
        rpcUrls: ["https://erpc.apothem.network"],
        blockExplorerUrls: ["https://explorer.apothem.network"],
      }
    : {
        chainId: `0x${(50).toString(16)}`, // "0x32"
        chainName: "XDC Network",
        nativeCurrency: {
          name: "XDC",
          symbol: "XDC",
          decimals: 18,
        },
        rpcUrls: ["https://erpc.xinfin.network"],
        blockExplorerUrls: ["https://explorer.xinfin.network"],
      };

  console.log("Adding network with params:", networkParams);

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [networkParams],
    });

    console.log("Successfully added XDC network");
    return true;
  } catch (error) {
    console.error("Error adding XDC network:", error);
    throw error;
  }
};

// Set environment based on NODE_ENV
export const isTestnet = process.env.NODE_ENV === "development";

// Network specific constants
export const XDC_NETWORK = isTestnet ? xdcTestnet : xdcNetwork;
