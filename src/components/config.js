//src/components/config.js

import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import {
  injected,
  metaMask,
  coinbaseWallet,
  walletConnect,
} from "wagmi/connectors";

// Your WalletConnect project ID
const projectId = "1a4ff99bcd6e78be055075d2c24026b9";

// XDC Network configuration
const xdcNetwork = {
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
      http: ["https://rpc.xinfin.network"],
    },
    public: {
      http: ["https://rpc.xinfin.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "XDCScan",
      url: "https://explorer.xinfin.network",
    },
  },
};

export const config = createConfig({
  chains: [mainnet, xdcNetwork],
  connectors: [
    metaMask(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: "XDCAI Presale" }),
  ],
  transports: {
    [mainnet.id]: http(),
    [xdcNetwork.id]: http("https://rpc.xinfin.network"),
  },
});
