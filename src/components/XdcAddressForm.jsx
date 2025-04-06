// src/components/XdcAddressForm.jsx
import React, { useState } from "react";
import { contributionsApi } from "../services/api";

const XdcAddressForm = ({ contributionId, onSuccess }) => {
  const [xdcAddress, setXdcAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValidXdcAddress = (address) => {
    return /^(xdc|0x)[a-fA-F0-9]{40}$/i.test(address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate XDC address format
    if (!isValidXdcAddress(xdcAddress)) {
      setError("Please enter a valid XDC address (starts with xdc or 0x)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await contributionsApi.updateClaimAddress(contributionId, xdcAddress);

      // Call the success callback
      if (onSuccess) {
        onSuccess(xdcAddress);
      }
    } catch (error) {
      console.error("Error updating XDC claim address:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to update XDC claim address"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-dark-light border border-dark-lighter rounded-widget">
      <h3 className="text-xl font-bold text-white mb-4">
        Set Your XDC Claim Address
      </h3>

      <p className="text-gray-light mb-6">
        Please provide an XDC address where you will receive your XDCAI tokens
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            value={xdcAddress}
            onChange={(e) => setXdcAddress(e.target.value)}
            placeholder="Enter XDC address (starts with xdc or 0x)"
            className="w-full p-4 bg-dark border border-dark-lighter rounded-lg text-white"
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent-red bg-opacity-20 border border-accent-red rounded-lg text-accent-red">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !xdcAddress}
          className={`w-full py-4 rounded-lg text-dark font-bold ${
            isSubmitting || !xdcAddress
              ? "bg-gray-dark cursor-not-allowed"
              : "bg-primary hover:bg-primary-light cursor-pointer"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Set Claim Address"}
        </button>
      </form>
    </div>
  );
};

export default XdcAddressForm;
