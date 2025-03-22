//src/components/InitialScreen

import React from "react";
import {
  MetamaskIcon,
  CoinbaseWalletIcon,
  PhantomIcon,
  WalletConnectIcon,
} from "./icons";

export const InitialScreen = ({ setCurrentScreen }) => (
  <div className="xdcai-purchase-container">
    <h1>
      The future of AI-powered agents is here - Grab $XDCAI at presale prices &
      fuel the AI revolution
    </h1>
    <p className="cant-find-tokens">Can't find tokens in your wallet?</p>
    <h2>
      Take advantage of Huge Early Staking Rewards by becoming an early adopter!
    </h2>
    <div className="presale-cta">BUY $XDCAI PRESALE NOW!</div>
    <div className="button-container">
      <button className="btn-secondary">Don't Have Crypto</button>
      <button className="btn-primary" onClick={() => setCurrentScreen(1)}>
        Buy with Crypto
      </button>
    </div>
    <div className="help-links">
      <div className="help-link">
        <span className="help-icon">ℹ️</span> How to Buy
      </div>
      <div className="help-link">
        <span className="help-icon">❓</span> Help, My Wallet Won't Connect!
      </div>
    </div>
  </div>
);

export default InitialScreen;
