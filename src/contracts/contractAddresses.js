//frontend/src/contracts/contractAddresses.js
export const NETWORKS = {
  XDC_MAINNET: 50,
  XDC_TESTNET: 51,
  ETHEREUM: 1,
  ETHEREUM_GOERLI: 5,
  BSC: 56,
  BSC_TESTNET: 97,
};

const VITE_XDC_AI_TOKEN_ADDRESS = import.meta.env.VITE_XDC_AI_TOKEN_ADDRESS;
const VITE_XDC_AI_TOKEN_TESTNET_ADDRESS = import.meta.env
  .VITE_XDC_AI_TOKEN_TESTNET_ADDRESS;
const VITE_XDC_AI_PRESALE_ADDRESS = import.meta.env.VITE_XDC_AI_PRESALE_ADDRESS;
const VITE_XDC_AI_PRESALE_TESTNET_ADDRESS = import.meta.env
  .VITE_XDC_AI_PRESALE_TESTNET_ADDRESS;

// Contract addresses - replace with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // XDC Mainnet
  50: {
    XDCAIPresale2: VITE_XDC_AI_PRESALE_ADDRESS, // Replace with actual address when deployed
    XDCAIToken: VITE_XDC_AI_TOKEN_ADDRESS, // Replace with actual address when deployed
  },
  // XDC Testnet (Apothem)
  51: {
    XDCAIPresale2: VITE_XDC_AI_PRESALE_TESTNET_ADDRESS, // Replace with actual address when deployed
    XDCAIToken: VITE_XDC_AI_TOKEN_TESTNET_ADDRESS, // Replace with actual address when deployed
  },
  // Ethereum Mainnet - For testing with Ethereum
  1: {
    XDCAIPresale2: "0x0000000000000000000000000000000000000000", // Replace with actual address if deployed on Ethereum
    XDCAIToken: "0x0000000000000000000000000000000000000000", // Replace with actual address if deployed on Ethereum
  },
  // BSC Mainnet - For testing with BSC
  56: {
    XDCAIPresale2: "0x0000000000000000000000000000000000000000", // Replace with actual address if deployed on BSC
    XDCAIToken: "0x0000000000000000000000000000000000000000", // Replace with actual address if deployed on BSC
  },
};
