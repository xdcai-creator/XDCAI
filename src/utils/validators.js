/**
 * Check if a given string is a valid email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  if (!email) return false;

  // Simple regex for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a given string is a valid XDC address
 * @param {string} address - XDC address to validate (xdc... or 0x... format)
 * @returns {boolean} - True if valid XDC address
 */
export const isValidXdcAddress = (address) => {
  if (!address) return false;

  // XDC addresses can start with "xdc" or "0x" and must be 42 characters in total
  const xdcRegex = /^(xdc|0x)[a-fA-F0-9]{40}$/i;
  return xdcRegex.test(address);
};

/**
 * Check if a given string is a valid ETH address
 * @param {string} address - ETH address to validate
 * @returns {boolean} - True if valid ETH address
 */
export const isValidEthAddress = (address) => {
  if (!address) return false;

  // ETH addresses start with "0x" and must be 42 characters in total
  const ethRegex = /^0x[a-fA-F0-9]{40}$/i;
  return ethRegex.test(address);
};

/**
 * Check if a given amount is valid for a crypto transaction
 * @param {string} amount - Amount to validate
 * @returns {boolean} - True if valid amount
 */
export const isValidAmount = (amount) => {
  if (!amount) return false;

  // Must be a number greater than 0 with up to 8 decimal places
  const amountRegex = /^\d*\.?\d{0,8}$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

/**
 * Check if a given string is a valid Solana address (public key)
 * @param {string} address - Solana address to validate
 * @returns {boolean} - True if valid Solana address
 */
export const isValidSolanaAddress = (address) => {
  if (!address) return false;

  // Solana addresses are 44 characters base58 strings
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;
  return solanaRegex.test(address);
};
