import React from 'react';
import {
  MetamaskIcon,
  CoinbaseWalletIcon,
  PhantomIcon,
  WalletConnectIcon
} from './icons';

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
}) => (
  <div className="purchase-screen">
    <div className="presale-header">
      <div className="cant-find-tokens">Can't find tokens in your wallet?</div>
      <h2>Take advantage of Huge Early Staking Rewards by becoming an early adopter!</h2>
      <div className="presale-cta">BUY $XDCAI PRESALE NOW!</div>
    </div>
    
    {showCurrencySelection ? (
      <div className="currency-selection">
        <div className="currency-tabs">
          <button className="currency-tab active">ALL</button>
          <button className="currency-tab">
            <div className="eth-icon-small"></div> ETH
          </button>
          <button className="currency-tab">
            <div className="bsc-icon-small"></div> BSC
          </button>
          <button className="currency-tab">
            <div className="sol-icon-small"></div> SOL
          </button>
        </div>
        
        <div className="currency-list">
          <div className="currency-item" onClick={() => handleCurrencySelect('ETH')}>
            <div className="currency-icon-wrapper">
              <div className="eth-icon"></div>
            </div>
            <div className="currency-info">
              <div className="currency-name">Ethereum</div>
              <div className="currency-symbol">ETH</div>
            </div>
            <div className="currency-balance">
              <div className="currency-value">~$3.122</div>
              <div className="currency-amount">0.001</div>
            </div>
          </div>
          
          <div className="currency-item" onClick={() => handleCurrencySelect('BNB')}>
            <div className="currency-icon-wrapper">
              <div className="bnb-icon"></div>
            </div>
            <div className="currency-info">
              <div className="currency-name">Binance Coin</div>
              <div className="currency-symbol">BNB</div>
            </div>
            <div className="currency-balance">
              <div className="currency-value">~$0.968</div>
              <div className="currency-amount">0.001</div>
            </div>
          </div>
          
          <div className="currency-item" onClick={() => handleCurrencySelect('SOL')}>
            <div className="currency-icon-wrapper">
              <div className="sol-icon"></div>
            </div>
            <div className="currency-info">
              <div className="currency-name">Solana</div>
              <div className="currency-symbol">SOL</div>
            </div>
            <div className="currency-balance">
              <div className="currency-value">~$0</div>
              <div className="currency-amount">0</div>
            </div>
          </div>
          
          <div className="currency-item" onClick={() => handleCurrencySelect('USDT')}>
            <div className="currency-icon-wrapper">
              <div className="usdt-icon"></div>
            </div>
            <div className="currency-info">
              <div className="currency-name">USDT</div>
              <div className="currency-symbol">ETH</div>
            </div>
            <div className="currency-balance">
              <div className="currency-value">~$0</div>
              <div className="currency-amount">0</div>
            </div>
          </div>
          
          <div className="currency-item" onClick={() => handleCurrencySelect('USDC')}>
            <div className="currency-icon-wrapper">
              <div className="usdc-icon"></div>
            </div>
            <div className="currency-info">
              <div className="currency-name">USD Coin</div>
              <div className="currency-symbol">ETH</div>
            </div>
            <div className="currency-balance">
              <div className="currency-value">~$0</div>
              <div className="currency-amount">0</div>
            </div>
          </div>
          
          <div className="currency-item" onClick={() => handleCurrencySelect('USDT-BNB')}>
            <div className="currency-icon-wrapper">
              <div className="usdt-bnb-icon"></div>
            </div>
            <div className="currency-info">
              <div className="currency-name">USDT</div>
              <div className="currency-symbol">BNB</div>
            </div>
            <div className="currency-balance">
              <div className="currency-value">~$0</div>
              <div className="currency-amount">0</div>
            </div>
          </div>
          
          <div className="currency-item" onClick={() => handleCurrencySelect('USDC-BNB')}>
            <div className="currency-icon-wrapper">
              <div className="usdc-bnb-icon"></div>
            </div>
            <div className="currency-info">
              <div className="currency-name">USD Coin</div>
              <div className="currency-symbol">BNB</div>
            </div>
            <div className="currency-balance">
              <div className="currency-value">~$0</div>
              <div className="currency-amount">0</div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="payment-container">
        <div className="payment-row">
          <p className="payment-label">Pay with {selectedCurrency}</p>
          <div className="payment-input-container">
            <input
              type="text"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="0"
              className="payment-input"
            />
            <button 
              className="currency-dropdown"
              onClick={() => setShowCurrencySelection(true)}
            >
              <div className={`currency-icon-small ${
                selectedCurrency === 'ETH' ? 'eth-icon-small' :
                selectedCurrency === 'BNB' ? 'bsc-icon-small' :
                selectedCurrency === 'SOL' ? 'sol-icon-small' : 'eth-icon-small'
              }`}></div>
              {selectedCurrency}
              <span className="dropdown-arrow">▼</span>
            </button>
          </div>
        </div>
        
        <div className="payment-row">
          <p className="payment-label">Receive $XDCAI</p>
          <div className="payment-input-container">
            <input
              type="text"
              value={xdcaiAmount}
              onChange={(e) => setXdcaiAmount(e.target.value)}
              placeholder="0"
              className="payment-input"
            />
          </div>
          <div className="price-rate">1 $XDCAI = $0.0033722</div>
        </div>
        
        <div className="error-message">You do not have enough {selectedCurrency} to pay for this transaction.</div>
        
        <button 
          className="buy-button" 
          onClick={handlePurchase}
        >
          BUY $XDCAI
        </button>
      </div>
    )}
  </div>
);

export default PurchaseScreen;