import React, { useState, useEffect } from 'react';

export const PurchaseScreen = ({
  handleCurrencySelect,
  handlePurchase,
  showCurrencySelection,
  setShowCurrencySelection,
  selectedCurrency,
  ethAmount,
  setEthAmount,
  xdcaiAmount,
  setXdcaiAmount
}) => {
  // Coin network associations
  const coinNetworks = {
    ETH: 'ETH',
    BNB: 'BSC',
    SOL: 'SOL',
    USDT: 'ETH',
    USDC: 'ETH',
    'USDT-BNB': 'BSC',
    'USDC-BNB': 'BSC',
    'USDT-SOL': 'SOL',
    'USDC-SOL': 'SOL',
  };

  // Original coin data with added network property
  const coinData = [
    { symbol: 'ETH', name: 'Ethereum', balance: 0.001, value: 3.122, network: 'ETH' },
    { symbol: 'BNB', name: 'Binance Coin', balance: 0.001, value: 0.968, network: 'BSC' },
    { symbol: 'SOL', name: 'Solana', balance: 0, value: 0, network: 'SOL' },
    { symbol: 'USDT', name: 'USDT', balance: 0, value: 0, network: 'ETH' },
    { symbol: 'USDC', name: 'USD Coin', balance: 0, value: 0, network: 'ETH' },
    { symbol: 'USDT-BNB', name: 'USDT', balance: 0, value: 0, network: 'BSC' },
    { symbol: 'USDC-BNB', name: 'USD Coin', balance: 0, value: 0, network: 'BSC' },
  ];

  const [activeTab, setActiveTab] = useState('ALL');
  const [filteredCoins, setFilteredCoins] = useState(coinData);
  const [coinPrices, setCoinPrices] = useState({});
  const [xdcPrice, setXdcPrice] = useState(0.0033722);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real-time cryptocurrency prices
  const fetchCryptoPrices = async () => {
    setIsLoading(true);
    try {
      // Simplified API call - in real implementation would call CoinGecko or similar
      const fallbackPrices = {
        'ETH': 3000,
        'BNB': 350,
        'SOL': 100,
        'USDT': 1,
        'USDC': 1,
        'USDT-BNB': 1,
        'USDC-BNB': 1,
        'USDT-SOL': 1,
        'USDC-SOL': 1,
      };
      setCoinPrices(fallbackPrices);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter coins based on active tab
  useEffect(() => {
    if (activeTab === 'ALL') {
      setFilteredCoins(coinData);
    } else {
      setFilteredCoins(coinData.filter(coin => coin.network === activeTab));
    }
  }, [activeTab]);

  // Fetch prices on component mount
  useEffect(() => {
    fetchCryptoPrices();
    // Update prices every 60 seconds
    const interval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate xdcai amount when eth amount changes
  useEffect(() => {
    if (ethAmount && coinPrices[selectedCurrency]) {
      const ethValue = parseFloat(ethAmount) * coinPrices[selectedCurrency];
      const xdcaiValue = ethValue / xdcPrice;
      setXdcaiAmount(xdcaiValue.toFixed(8));
    } else {
      setXdcaiAmount('0');
    }
  }, [ethAmount, selectedCurrency, coinPrices, xdcPrice, setXdcaiAmount]);

  // Handle input change with decimal validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid decimal up to 8 decimal places
    if (value === '' || /^\d*\.?\d{0,8}$/.test(value)) {
      setEthAmount(value);
    }
  };
  
  // Get logo URL for a currency
  const getCurrencyLogo = (symbol) => {
    switch(symbol) {
      case 'ETH':
        return 'https://cryptologos.cc/logos/ethereum-eth-logo.png';
      case 'BNB':
        return 'https://cryptologos.cc/logos/bnb-bnb-logo.png';
      case 'SOL':
        return 'https://cryptologos.cc/logos/solana-sol-logo.png';
      case 'USDT':
      case 'USDT-BNB':
      case 'USDT-SOL':
        return 'https://cryptologos.cc/logos/tether-usdt-logo.png';
      case 'USDC':
      case 'USDC-BNB':
      case 'USDC-SOL':
        return 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png';
      default:
        return 'https://cryptologos.cc/logos/question-mark.png';
    }
  };

  return (
    <div className="purchase-screen" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {showCurrencySelection ? (
        <div className="currency-selection">
          <h2>Select a currency</h2>
          
          <div className="currency-tabs">
            <button 
              className={`currency-tab ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              ALL
            </button>
            <button 
              className={`currency-tab ${activeTab === 'ETH' ? 'active' : ''}`}
              onClick={() => setActiveTab('ETH')}
            >
              <img 
                src={getCurrencyLogo('ETH')} 
                alt="ETH" 
                style={{width: '16px', height: '16px', marginRight: '4px'}}
              /> ETH
            </button>
            <button 
              className={`currency-tab ${activeTab === 'BSC' ? 'active' : ''}`}
              onClick={() => setActiveTab('BSC')}
            >
              <img 
                src={getCurrencyLogo('BNB')} 
                alt="BSC" 
                style={{width: '16px', height: '16px', marginRight: '4px'}}
              /> BSC
            </button>
            <button 
              className={`currency-tab ${activeTab === 'SOL' ? 'active' : ''}`}
              onClick={() => setActiveTab('SOL')}
            >
              <img 
                src={getCurrencyLogo('SOL')} 
                alt="SOL" 
                style={{width: '16px', height: '16px', marginRight: '4px'}}
              /> SOL
            </button>
          </div>
          
          <div className="currency-list">
            {filteredCoins.map((coin) => (
              <div 
                key={coin.symbol} 
                className="currency-item" 
                onClick={() => handleCurrencySelect(coin.symbol)}
              >
                <div className="currency-icon-wrapper">
                  <img 
                    src={getCurrencyLogo(coin.symbol)} 
                    alt={coin.symbol} 
                    style={{width: '32px', height: '32px'}}
                  />
                </div>
                <div className="currency-info">
                  <div className="currency-name">{coin.name}</div>
                  <div className="currency-symbol">{coin.symbol}</div>
                </div>
                <div className="currency-balance">
                  <div className="currency-value">~${coin.value.toFixed(3)}</div>
                  <div className="currency-amount">{coin.balance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Header section */}
          <div className="presale-header">
            <p style={{ 
              textAlign: 'right', 
              margin: '10px 0', 
              fontSize: '16px', 
              color: '#ccc'
            }}>
              Can't find tokens in your wallet?
            </p>
            <h2 style={{ 
              textAlign: 'center', 
              margin: '15px 0', 
              fontSize: '24px', 
              lineHeight: '1.3'
            }}>
              Take advantage of Huge Early Staking Rewards by becoming an early adopter!
            </h2>
            <div style={{ 
              textAlign: 'center', 
              color: '#90EE90', 
              fontSize: '38px', 
              fontWeight: 'bold', 
              margin: '25px 0',
              lineHeight: '1.2'
            }}>
              BUY $XDCAI PRESALE NOW!
            </div>
          </div>
          
          {/* Token display area */}
          <div style={{ 
            width: '100%', 
            height: '110px', 
            backgroundColor: '#3a4a4a', 
            borderRadius: '10px',
            marginBottom: '20px'
          }}></div>
          
          {/* Payment section */}
          <div style={{ padding: '0 5px' }}>
            {/* Pay with crypto field */}
            <div style={{ marginBottom: '25px' }}>
              <p style={{ 
                textAlign: 'left', 
                margin: '5px 0', 
                fontSize: '16px', 
                color: '#ccc' 
              }}>
                Pay with {selectedCurrency}
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                gap: '10px'
              }}>
                <input
                  type="text"
                  value={ethAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  style={{
                    flex: '1',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '15px',
                    fontSize: '20px',
                    color: 'white',
                    height: '55px',
                    boxSizing: 'border-box'
                  }}
                />
                <button 
                  onClick={() => setShowCurrencySelection(true)}
                  style={{
                    width: '120px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '0 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    height: '55px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#627EEA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px'
                  }}>
                    <img 
                      src={getCurrencyLogo(selectedCurrency)} 
                      alt={selectedCurrency} 
                      style={{
                        width: '16px', 
                        height: '16px'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedCurrency}</span>
                  <span style={{ marginLeft: '8px' }}>▼</span>
                </button>
              </div>
            </div>
            
            {/* Receive XDCAI field */}
            <div style={{ marginBottom: '5px' }}>
              <p style={{ 
                textAlign: 'left', 
                margin: '5px 0', 
                fontSize: '16px', 
                color: '#ccc' 
              }}>
                Receive $XDCAI
              </p>
              <input
                type="text"
                value={xdcaiAmount}
                readOnly
                placeholder="0"
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '15px',
                  fontSize: '20px',
                  color: 'white',
                  height: '55px',
                  boxSizing: 'border-box',
                  marginBottom: '5px'
                }}
              />
              <p style={{ 
                textAlign: 'right', 
                margin: '5px 0 20px 0', 
                fontSize: '14px', 
                color: '#aaa' 
              }}>
                1 $XDCAI = ${xdcPrice.toFixed(7)}
              </p>
            </div>
            
            {/* Error message */}
            <div style={{ 
              textAlign: 'center', 
              color: '#ff6b6b', 
              backgroundColor: 'rgba(100, 0, 0, 0.2)',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '25px'
            }}>
              You do not have enough ETH to pay for this transaction.
            </div>
            
            {/* Buy button */}
            <button 
              onClick={handlePurchase}
              style={{
                width: '100%',
                backgroundColor: '#90EE90',
                border: 'none',
                borderRadius: '8px',
                padding: '17px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'black',
                cursor: 'pointer',
                marginBottom: '15px',
                height: '60px'
              }}
            >
              BUY $XDCAI
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PurchaseScreen;