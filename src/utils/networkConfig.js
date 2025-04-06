// utils/networkConfig.js

/**
 * Network configuration utility that automatically switches between
 * testnet and mainnet config based on environment settings.
 */

// Determine if we're using testnets or mainnets
const useTestnets = import.meta.env.VITE_USE_TESTNET === "true";

// Initialize the configuration object
const config = {
  // General settings
  isTestnet: useTestnets,
  networkType: useTestnets ? "testnet" : "mainnet",
  networkId: useTestnets ? 51 : 50, // XDC network ID (50 = mainnet, 51 = testnet)

  // RPC endpoints
  rpcEndpoints: {
    ethereum: {
      http: useTestnets
        ? import.meta.env.VITE_ETH_TESTNET_PROVIDER_URL
        : import.meta.env.VITE_ETH_MAINNET_PROVIDER_URL,
    },
    bsc: {
      http: useTestnets
        ? import.meta.env.VITE_BSC_TESTNET_PROVIDER_URL
        : import.meta.env.VITE_BSC_MAINNET_PROVIDER_URL,
    },
    solana: {
      http: useTestnets
        ? import.meta.env.VITE_SOLANA_TESTNET_PROVIDER_URL
        : import.meta.env.VITE_SOLANA_MAINNET_PROVIDER_URL,
    },
    xdc: useTestnets
      ? import.meta.env.VITE_XDC_TESTNET_PROVIDER_URL
      : import.meta.env.VITE_XDC_MAINNET_PROVIDER_URL,
  },

  // Deposit wallet addresses for each chain
  depositAddresses: {
    ethereum: useTestnets
      ? import.meta.env.VITE_OWNER_ETHEREUM_ADDRESS
      : import.meta.env.VITE_OWNER_ETHEREUM_ADDRESS,
    bsc: useTestnets
      ? import.meta.env.VITE_OWNER_BSC_ADDRESS
      : import.meta.env.VITE_OWNER_BSC_ADDRESS,
    solana: useTestnets
      ? import.meta.env.VITE_OWNER_SOLANA_ADDRESS
      : import.meta.env.VITE_OWNER_SOLANA_ADDRESS,
    xdc: useTestnets
      ? import.meta.env.VITE_OWNER_XDC_ADDRESS
      : import.meta.env.VITE_OWNER_XDC_ADDRESS,
  },

  // Token addresses for each chain
  tokenAddresses: {
    ethereum: {
      USDT: useTestnets
        ? import.meta.env.USDT_ADDRESS_ETH_TESTNET
        : import.meta.env.USDT_ADDRESS_ETH,
      USDC: useTestnets
        ? import.meta.env.USDC_ADDRESS_ETH_TESTNET
        : import.meta.env.USDC_ADDRESS_ETH,
    },
    bsc: {
      USDT: useTestnets
        ? import.meta.env.USDT_ADDRESS_BSC_TESTNET
        : import.meta.env.USDT_ADDRESS_BSC,
      USDC: useTestnets
        ? import.meta.env.USDC_ADDRESS_BSC_TESTNET
        : import.meta.env.USDC_ADDRESS_BSC,
    },
    solana: {
      USDT: useTestnets
        ? import.meta.env.USDT_ADDRESS_SOL_TESTNET
        : import.meta.env.USDT_ADDRESS_SOL,
      USDC: useTestnets
        ? import.meta.env.USDC_ADDRESS_SOL_TESTNET
        : import.meta.env.USDC_ADDRESS_SOL,
    },
  },

  // XDCAI contract addresses
  contracts: {
    xdcaiToken: useTestnets
      ? import.meta.env.VITE_XDC_AI_TOKEN_TESTNET_ADDRESS
      : import.meta.env.VITE_XDC_AI_TOKEN_ADDRESS,
    xdcaiPresale: useTestnets
      ? import.meta.env.VITE_XDC_AI_PRESALE_TESTNET_ADDRESS
      : import.meta.env.VITE_XDC_AI_PRESALE_ADDRESS,
  },

  // Explorer URLs for transaction links
  explorers: {
    ethereum: {
      txUrl: useTestnets
        ? "https://sepolia.etherscan.io/tx/"
        : "https://etherscan.io/tx/",
    },
    bsc: {
      txUrl: useTestnets
        ? "https://testnet.bscscan.com/tx/"
        : "https://bscscan.com/tx/",
    },
    solana: {
      txUrl: useTestnets
        ? "https://explorer.solana.com/tx/?cluster=devnet"
        : "https://explorer.solana.com/tx/",
    },
    xdc: {
      txUrl: useTestnets
        ? "https://explorer.apothem.network/tx/"
        : "https://explorer.xinfin.network/tx/",
    },
  },
};

export default config;
