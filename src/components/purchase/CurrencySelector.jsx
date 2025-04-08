import React, { useState, useEffect } from "react";
import { useNetwork } from "../../context/NetworkContext";
import CryptoIcon from "../common/CryptoIcon";
import BridgeSvgIcon from "../icons/BridgeSvgIcon";
import * as Icons from "../icons/CryptoIcons";

export const getCurrencyLogo = (symbol) => {
  if (svgIconToSymbolMatcher[symbol]) return svgIconToSymbolMatcher[symbol];
};

const svgIconToSymbolMatcher = {
  ETH: <Icons.EthereumIcon />,
  BNB: (
    <div className="scale-[2] ml-2">
      <Icons.BinanceIcon />
    </div>
  ),
  SOL: (
    <div className="scale-[1.8] ml-2">
      <Icons.SolanaIcon />
    </div>
  ),
  "USDT-ETH": (
    <BridgeSvgIcon Icon1={Icons.TetherIcon} Icon2={Icons.EthereumIcon} />
  ),
  "USDT-BNB": (
    <BridgeSvgIcon Icon1={Icons.TetherIcon} Icon2={Icons.BinanceIcon} />
  ),
  "USDT-SOL": (
    <BridgeSvgIcon Icon1={Icons.TetherIcon} Icon2={Icons.SolanaIcon} />
  ),
  "USDC-ETH": (
    <BridgeSvgIcon Icon1={Icons.USDCIcon} Icon2={Icons.EthereumIcon} />
  ),
  "USDC-BNB": (
    <BridgeSvgIcon Icon1={Icons.USDCIcon} Icon2={Icons.BinanceIcon} />
  ),
  "USDC-SOL": <BridgeSvgIcon Icon1={Icons.USDCIcon} Icon2={Icons.SolanaIcon} />,
  XDC: <Icons.XDCIcon />,
};

/**
 * Currency selection component for the purchase flow
 */
const CurrencySelector = ({ onSelect, onCancel, prices }) => {
  const { isTestnet } = useNetwork();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCoins, setFilteredCoins] = useState([]);

  // List of supported coins with network information
  const coinData = [
    // {
    //   symbol: "XDC",
    //   name: "XDC",
    //   network: "XDC",
    //   enabled: true, // Always enabled
    // },
    {
      symbol: "ETH",
      name: "Ethereum",
      network: "ETH",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "BNB",
      name: "Binance Coin",
      network: "BSC",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "SOL",
      name: "Solana",
      network: "SOL",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "USDT-ETH",
      name: "USDT",
      network: "ETH",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "USDC-ETH",
      name: "USD Coin",
      network: "ETH",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "USDT-BNB",
      name: "USDT (BSC)",
      network: "BSC",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "USDC-BNB",
      name: "USD Coin (BSC)",
      network: "BSC",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "USDT-SOL",
      name: "USDT (Solana)",
      network: "SOL",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
    {
      symbol: "USDC-SOL",
      name: "USD Coin (Solana)",
      network: "SOL",
      enabled: !isTestnet || (isTestnet && true), // Enable on testnet for testing
    },
  ];

  // Update prices on coin data
  const enrichedCoinData = coinData.map((coin) => {
    // Handle multi-network tokens
    const priceKey = coin.symbol.includes("-")
      ? coin.symbol.split("-")[0]
      : coin.symbol;

    // Get the price or default to 0
    const price = prices?.[priceKey] || 0;

    return {
      ...coin,
      price,
    };
  });

  // Apply filters when tab or search changes
  useEffect(() => {
    let filtered = enrichedCoinData;

    // Filter by network tab
    if (activeTab !== "ALL") {
      filtered = filtered.filter((coin) => coin.network === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
    }

    // Only show enabled coins
    filtered = filtered.filter((coin) => coin.enabled);

    setFilteredCoins(filtered);
  }, [activeTab, searchQuery, prices]);

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="currency-selection">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg text-white font-medium">Select a currency</h2>
        <button onClick={onCancel} className="text-gray-light hover:text-white">
          ✕
        </button>
      </div>

      {/* Search box */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search currencies..."
          className="w-full p-2.5 bg-dark-light border border-[#425152] rounded-md text-white"
        />
      </div>

      {/* Network tabs */}
      <div className="flex mb-4 overflow-x-auto scrollbar-hide h-[50px] space-x-2 px-2 py-1 ">
        <button
          className={`border border-[#425152] flex-shrink-0 px-4 py-2 text-sm whitespace-nowrap ${
            activeTab === "ALL"
              ? "bg-primary text-dark font-medium"
              : "bg-dark-light text-gray-light"
          } rounded-md transition-colors`}
          onClick={() => setActiveTab("ALL")}
        >
          ALL
        </button>
        <button
          className={`border border-[#425152]  flex-shrink-0 px-4 py-2 text-sm flex items-center whitespace-nowrap ${
            activeTab === "ETH"
              ? "bg-primary text-dark font-medium"
              : "bg-dark-light text-gray-light"
          } rounded-md space-x-2 transition-colors`}
          onClick={() => setActiveTab("ETH")}
        >
          <Icons.EthereumIcon className="scale-[0.6]" />
          <span>ETH</span>
        </button>
        <button
          className={`border border-[#425152] flex-shrink-0 px-4 py-2 text-sm flex items-center whitespace-nowrap ${
            activeTab === "BSC"
              ? "bg-primary text-dark font-medium"
              : "bg-dark-light text-gray-light"
          } rounded-md space-x-2 transition-colors`}
          onClick={() => setActiveTab("BSC")}
        >
          <div className="scale-[1.5]">
            <Icons.BinanceIcon />
          </div>
          <span>BSC</span>
        </button>
        <button
          className={`border border-[#425152] flex-shrink-0 px-4 py-2 text-sm flex items-center whitespace-nowrap ${
            activeTab === "SOL"
              ? "bg-primary text-dark font-medium"
              : "bg-dark-light text-gray-light"
          } rounded-md space-x-2 transition-colors`}
          onClick={() => setActiveTab("SOL")}
        >
          <div className="scale-[1.5]">
            <Icons.SolanaIcon />
          </div>
          <span>SOL</span>
        </button>
        {/* <button
          className={`border border-[#425152] flex-shrink-0 px-4 py-2 text-sm flex items-center whitespace-nowrap ${
            activeTab === "XDC"
              ? "bg-primary text-dark font-medium"
              : "bg-dark-light text-gray-light"
          } rounded-md space-x-2 transition-colors`}
          onClick={() => setActiveTab("XDC")}
        >
          <span>XDC</span>
        </button> */}
      </div>

      {/* Currency list */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredCoins.length === 0 ? (
          <div className="text-center py-4 text-gray-light">
            No currencies found
          </div>
        ) : (
          filteredCoins.map((coin) => (
            <div
              key={coin.symbol}
              className="p-4 bg-dark-light border border-[#425152] rounded-lg mb-2 flex items-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelect(coin.symbol)}
            >
              <div className="mr-3">{getCurrencyLogo(coin.symbol)}</div>
              <div className="flex-grow">
                <div className="font-medium text-white">{coin.name}</div>
                <div className="text-sm text-gray-light">{coin.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">
                  ~${coin.price.toFixed(3)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CurrencySelector;
