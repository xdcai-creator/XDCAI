/**
 * Network configuration utility that handles testnet/mainnet config
 * based on environment settings.
 */

// Determine if we're using testnets or mainnets
const useTestnets = import.meta.env.VITE_USE_TESTNET === "true";

// Initialize the configuration object
const config = {
  // General settings
  isTestnet: useTestnets,
  networkType: useTestnets ? "testnet" : "mainnet",

  // Network IDs
  networkIds: {
    ethereum: {
      mainnet: 1,
      testnet: 5, // Goerli
    },
    bsc: {
      mainnet: 56,
      testnet: 97,
    },
    xdc: {
      mainnet: 50,
      testnet: 51,
    },
    solana: {
      mainnet: 101,
      testnet: 103, // Devnet
    },
  },

  // RPC endpoints
  rpcEndpoints: {
    ethereum: {
      http: useTestnets
        ? import.meta.env.VITE_ETH_TESTNET_PROVIDER_URL ||
          "https://ethereum-goerli.publicnode.com"
        : import.meta.env.VITE_ETH_MAINNET_PROVIDER_URL ||
          "https://ethereum.publicnode.com",
    },
    bsc: {
      http: useTestnets
        ? import.meta.env.VITE_BSC_TESTNET_PROVIDER_URL ||
          "https://bsc-testnet.publicnode.com"
        : import.meta.env.VITE_BSC_MAINNET_PROVIDER_URL ||
          "https://bsc.publicnode.com",
    },
    solana: {
      http: useTestnets
        ? import.meta.env.VITE_SOLANA_TESTNET_PROVIDER_URL ||
          "https://api.devnet.solana.com"
        : import.meta.env.VITE_SOLANA_MAINNET_PROVIDER_URL ||
          "https://api.mainnet-beta.solana.com",
    },
    xdc: {
      http: useTestnets
        ? import.meta.env.VITE_XDC_TESTNET_PROVIDER_URL ||
          "https://erpc.apothem.network"
        : import.meta.env.VITE_XDC_MAINNET_PROVIDER_URL ||
          "https://erpc.xinfin.network",
    },
  },

  // Deposit wallet addresses for each chain
  depositAddresses: {
    ethereum:
      import.meta.env.VITE_OWNER_ETHEREUM_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
    bsc:
      import.meta.env.VITE_OWNER_BSC_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
    solana:
      import.meta.env.VITE_OWNER_SOLANA_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
    xdc:
      import.meta.env.VITE_OWNER_XDC_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
  },

  // Token addresses for supported networks
  tokenAddresses: {
    // ERC-20 tokens on Ethereum
    ethereum: {
      USDT: useTestnets
        ? import.meta.env.VITE_USDT_ADDRESS_ETH_TESTNET ||
          "0x110a13FC3efE6A245B50102D2d79B3E76125Ae83"
        : import.meta.env.VITE_USDT_ADDRESS_ETH ||
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      USDC: useTestnets
        ? import.meta.env.VITE_USDC_ADDRESS_ETH_TESTNET ||
          "0x07865c6e87b9f70255377e024ace6630c1eaa37f"
        : import.meta.env.VITE_USDC_ADDRESS_ETH ||
          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    // BEP-20 tokens on BSC
    bsc: {
      USDT: useTestnets
        ? import.meta.env.VITE_USDT_ADDRESS_BSC_TESTNET ||
          "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
        : import.meta.env.VITE_USDT_ADDRESS_BSC ||
          "0x55d398326f99059fF775485246999027B3197955",
      USDC: useTestnets
        ? import.meta.env.VITE_USDC_ADDRESS_BSC_TESTNET ||
          "0x64544969ed7EBf5f083679233325356EbE738930"
        : import.meta.env.VITE_USDC_ADDRESS_BSC ||
          "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    },
    // SPL tokens on Solana
    solana: {
      "USDT-SOL": useTestnets
        ? import.meta.env.VITE_USDT_ADDRESS_SOL_TESTNET ||
          "So11111111111111111111111111111111111111112"
        : import.meta.env.VITE_USDT_ADDRESS_SOL ||
          "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      "USDC-SOL": useTestnets
        ? import.meta.env.VITE_USDC_ADDRESS_SOL_TESTNET ||
          "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
        : import.meta.env.VITE_USDC_ADDRESS_SOL ||
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
  },

  // XDCAI contract addresses
  contracts: {
    xdcaiToken: useTestnets
      ? import.meta.env.VITE_XDC_AI_TOKEN_TESTNET_ADDRESS ||
        "0x0000000000000000000000000000000000000000"
      : import.meta.env.VITE_XDC_AI_TOKEN_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    xdcaiPresale: useTestnets
      ? import.meta.env.VITE_XDC_AI_PRESALE_TESTNET_ADDRESS ||
        "0x0000000000000000000000000000000000000000"
      : import.meta.env.VITE_XDC_AI_PRESALE_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
  },

  // Explorer URLs for transaction links
  explorers: {
    ethereum: {
      txUrl: useTestnets
        ? "https://goerli.etherscan.io/tx/"
        : "https://etherscan.io/tx/",
      addressUrl: useTestnets
        ? "https://goerli.etherscan.io/address/"
        : "https://etherscan.io/address/",
    },
    bsc: {
      txUrl: useTestnets
        ? "https://testnet.bscscan.com/tx/"
        : "https://bscscan.com/tx/",
      addressUrl: useTestnets
        ? "https://testnet.bscscan.com/address/"
        : "https://bscscan.com/address/",
    },
    solana: {
      txUrl: useTestnets
        ? "https://explorer.solana.com/tx/?cluster=devnet&"
        : "https://explorer.solana.com/tx/",
      addressUrl: useTestnets
        ? "https://explorer.solana.com/address/?cluster=devnet&"
        : "https://explorer.solana.com/address/",
    },
    xdc: {
      txUrl: useTestnets
        ? "https://explorer.apothem.network/tx/"
        : "https://explorer.xinfin.network/tx/",
      addressUrl: useTestnets
        ? "https://explorer.apothem.network/address/"
        : "https://explorer.xinfin.network/address/",
    },
  },

  // API endpoint
  apiEndpoint: import.meta.env.VITE_API_URL || "http://localhost:3500",
};

export default config;
