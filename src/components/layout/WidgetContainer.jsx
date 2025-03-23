// src/components/layout/WidgetContainer.jsx
import React from "react";

/**
 * The main container for the XDCAI Presale widget
 * Styled according to the XD design specs
 */
const WidgetContainer = ({ children, className = "" }) => {
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-accent-purple opacity-5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 bg-accent-blue opacity-5 blur-[150px] rounded-full"></div>
      </div>

      {/* Main widget container */}
      <div
        className={`relative w-full max-w-md bg-gradient-widget border border-dark-lighter rounded-widget shadow-widget z-10 ${className}`}
      >
        {/* Widget connectors - polygons attached to sides */}
        <div className="absolute -right-4 top-1/4 w-8 h-8 bg-dark-light border border-dark-lighter transform rotate-45"></div>
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-dark-light border border-dark-lighter transform rotate-45"></div>
        <div className="absolute -right-2 top-3/4 w-4 h-4 bg-dark-light border border-dark-lighter transform rotate-45"></div>

        {/* Content */}
        {children}
      </div>

      {/* Footer text */}
      <div className="mt-6 text-gray-light text-center">
        <p>Smart Contract Is Fully Audited.</p>
      </div>
    </div>
  );
};

export default WidgetContainer;
