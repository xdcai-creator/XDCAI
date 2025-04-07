import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Initial screen for the application
 * Displays the welcome message and options to start the purchase process
 */
const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 pt-7 relative">
      {/* Top notification banner */}
      <div className="text-[11px] text-white bg-[#425152] absolute top-0 right-0 left-0 w-[fit-content] text-center overflow-x-auto">
        The future of AI-powered agents is here - Grab $XDCAI at presale prices
        & fuel the AI revolution
      </div>

      {/* Support text */}
      <p className="text-center text-[#aaa] text-sm">
        Can't find tokens in your wallet?
      </p>

      {/* Main heading */}
      <h2 className="text-center text-white text-xl my-4">
        Take advantage of Huge Early Staking Rewards by becoming an early
        adopter!
      </h2>

      {/* Call to action */}
      <div className="text-center text-primary text-4xl font-semibold my-6">
        BUY $XDCAI PRESALE NOW!
      </div>

      {/* Action buttons */}
      <div className="flex justify-between gap-4 mb-6">
        <button
          className="flex-1 py-3 px-4 bg-dark-light border border-dark-darker rounded-md text-white font-medium"
          onClick={() => window.open("https://buy.onramper.com", "_blank")}
        >
          Don't Have Crypto
        </button>
        <button
          className="flex-1 py-3 px-4 bg-primary rounded-md text-dark font-medium"
          onClick={() => navigate("/connect")}
        >
          Buy with Crypto
        </button>
      </div>

      {/* Help links */}
      <div className="flex justify-center gap-6 text-[#A5C8CA] text-sm">
        <div className="flex items-center cursor-pointer">
          <span className="mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 22 22"
              fill="#A5C8CA"
            >
              <path d="M11.576,22.578a11,11,0,1,1,11-10.911A11,11,0,0,1,11.576,22.578Zm.233-12.565a5.773,5.773,0,0,0-3.032,1.031.959.959,0,0,0-.211.187c-.21.256-.138.473.179.556.122.032.247.054.366.092.506.161.642.409.514.934-.312,1.275-.63,2.548-.936,3.824A1.329,1.329,0,0,0,9.85,18.428a5.378,5.378,0,0,0,3.626-1.119.551.551,0,0,0,.191-.426c-.007-.084-.229-.153-.359-.221a.909.909,0,0,0-.182-.05c-.6-.161-.758-.412-.612-1.013.3-1.245.622-2.485.9-3.734a2.049,2.049,0,0,0,0-.927c-.168-.65-.736-.95-1.6-.925Zm2.8-3.813a2.046,2.046,0,1,0-2.034,2.018A2.028,2.028,0,0,0,14.608,6.2Z" />
            </svg>
          </span>
          How to Buy
        </div>
        <div className="flex items-center cursor-pointer">
          <span className="mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 22 22"
              fill="#A5C8CA"
            >
              <path d="M11.733.733a10.986,10.986,0,0,0-9.739,16.1L.77,21.391a1.062,1.062,0,0,0,.279,1.027,1.037,1.037,0,0,0,.748.315,1.212,1.212,0,0,0,.279-.037l4.561-1.225A11,11,0,1,0,11.733.733Zm0,17.673a1.21,1.21,0,1,1,1.21-1.21A1.211,1.211,0,0,1,11.733,18.407Zm1.943-6.072a1.773,1.773,0,0,0-.887,1.5,1.063,1.063,0,0,1-2.127,0,3.88,3.88,0,0,1,1.907-3.315,1.594,1.594,0,0,0,.77-1.408,1.652,1.652,0,0,0-1.547-1.584A1.6,1.6,0,0,0,10.12,8.991,1.064,1.064,0,0,1,8,8.793,3.735,3.735,0,0,1,11.88,5.4a3.8,3.8,0,0,1,3.593,3.681,3.758,3.758,0,0,1-1.8,3.256Z" />
            </svg>
          </span>
          Help, My Wallet Won't Connect!
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
