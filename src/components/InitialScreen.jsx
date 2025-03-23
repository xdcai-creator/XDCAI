// src/components/InitialScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export const InitialScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="xdcai-purchase-containerd">
      <div className="text-[5px] text-white bg-[#425152]">
        The future of AI-powered agents is here - Grab $XDCAI at presale prices
        & fuel the AI revolution
      </div>
      <p className="cant-find-tokens text-center">
        Can't find tokens in your wallet?
      </p>
      <h2>
        Take advantage of Huge Early Staking Rewards by becoming an early
        adopter!
      </h2>
      <div className="presale-cta">BUY $XDCAI PRESALE NOW!</div>
      <div className="button-container">
        <button className="btn-secondary">Don't Have Crypto</button>
        <button className="btn-primary" onClick={() => navigate("/connect")}>
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
};

export default InitialScreen;
