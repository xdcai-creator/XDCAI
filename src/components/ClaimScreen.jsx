import React from 'react';


export const ClaimScreen = ({ connectToXdcNetwork, handleClaim, isXdcConnected }) => (
  <div className="claim-screen">
    <h2>Thanks for purchasing $XDCAI tokens!</h2>
    <p>In order to claim your tokens, please connect to the XDC network.</p>
    <button 
      className="xdc-connect-button" 
      onClick={connectToXdcNetwork}
      disabled={isXdcConnected}
    >
      <span>Connect to XDC network!</span>
      <span className="xdc-icon">XDC</span>
    </button>
    <p>Once the XDC network is connected, click on the Claim button below to claim your $XDCAI tokens.</p>
    <button 
      className="claim-button" 
      onClick={handleClaim}
      disabled={!isXdcConnected}
    >
      Claim $XDCAI tokens!
    </button>
  </div>
);

export default ClaimScreen;