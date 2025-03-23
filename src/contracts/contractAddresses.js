export const NETWORKS = {
  XDC_MAINNET: 50,
  XDC_TESTNET: 51,
  ETHEREUM: 1,
  BSC: 56,
};

// Contract addresses - replace with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // XDC Mainnet
  50: {
    XDCAIPresale2: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Replace with actual address when deployed
    XDCAIToken: "0x9a67f1940164d0318612b497e8e6038f902a00a4", // Replace with actual address when deployed
  },
  // XDC Testnet (Apothem)
  51: {
    XDCAIPresale2: "0x7fE7de1eE2f9d75F2Ff5bFa555DB97043e9DA9A7", // Replace with actual address when deployed
    XDCAIToken: "0xAdC076c5D138F7A1e85a7313ecf33f111fF20e0A", // Replace with actual address when deployed
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
