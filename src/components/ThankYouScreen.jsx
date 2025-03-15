import React from 'react';
import {
  MetamaskIcon,
  CoinbaseWalletIcon,
  PhantomIcon,
  WalletConnectIcon
} from './icons';

export const ThankYouScreen = ({ connectToXdcNetwork, setCurrentScreen, isXdcConnected }) => (
  <div className="thank-you-screen">
    <h2>Thanks for purchasing $XDCAI tokens!</h2>
    <p>In order to claim your tokens, please download metamask and connect to the XDC network.</p>
    <div className="steps-container">
      <div className="step">
        <div className="step-number">Step 1</div>
        <button className="step-button" onClick={() => window.open('https://metamask.io/download.html', '_blank')}>
          <span>Download Metamask</span>
          <MetamaskIcon />
        </button>
      </div>
      <div className="step">
        <div className="step-number">Step 2</div>
        <button className="step-button" onClick={connectToXdcNetwork}>
          <span>Connect to XDC network!</span>
          <span className="xdc-icon">XDC</span>
        </button>
      </div>
    </div>
    <p>Once metamask is connected, click on the Claim button below to claim your $XDCAI tokens.</p>
    <button 
      className="claim-button" 
      onClick={() => setCurrentScreen(4)}
      disabled={!isXdcConnected}
    >
      Claim $XDCAI tokens!
    </button>
  </div>
);

export default ThankYouScreen;