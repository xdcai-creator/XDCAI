// src/services/transferService.js
import { ethers } from "ethers";
import {
  VITE_OWNER_ETHEREUM_ADDRESS,
  VITE_OWNER_BSC_ADDRESS,
  VITE_OWNER_SOLANA_ADDRESS,
  VITE_OWNER_XDC_ADDRESS,
} from "../config";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Simple ERC-20 ABI for token transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Token addresses for different networks
const TOKEN_ADDRESSES = {
  ethereum: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  bsc: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
  // XDC tokens removed as they're handled directly by the contract
};

// SPL token mint addresses (Solana)
const SPL_TOKEN_MINTS = {
  "USDT-SOL": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT mainnet
  "USDC-SOL": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet
};

/**
 * Get the appropriate owner address based on chain and token
 * @param {string} chain - The blockchain (ethereum, bsc, solana, xdc)
 * @param {string} token - The token symbol (ETH, BNB, SOL, USDT, USDC, etc.)
 * @returns {string} - The owner address for the specified chain and token
 */
export const getOwnerAddress = (chain, token) => {
  // Handle hyphenated token names (e.g., USDT-ETH, USDT-BSC, USDT-SOL)
  if (token.includes("-")) {
    const [tokenBase, chainBase] = token.split("-");
    if (chainBase === "ETH") return VITE_OWNER_ETHEREUM_ADDRESS;
    if (chainBase === "BNB") return VITE_OWNER_BSC_ADDRESS;
    if (chainBase === "SOL") return VITE_OWNER_SOLANA_ADDRESS;
  }

  // For regular tokens based on chain
  switch (chain) {
    case "ethereum":
      return VITE_OWNER_ETHEREUM_ADDRESS;
    case "bsc":
      return VITE_OWNER_BSC_ADDRESS;
    case "solana":
      return VITE_OWNER_SOLANA_ADDRESS;
    case "xdc":
      return VITE_OWNER_XDC_ADDRESS;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
};

/**
 * Get token address for a specific chain and token symbol
 * @param {string} chain - Blockchain name (ethereum, bsc)
 * @param {string} token - Token symbol (USDT, USDC)
 * @returns {string} - Token contract address
 */
export const getTokenAddress = (chain, token) => {
  // Handle hyphened token names
  if (token.includes("-")) {
    const [tokenBase, chainBase] = token.split("-");
    let targetChain = chain;

    // If token specifies chain (e.g., USDT-ETH), use that chain instead
    if (chainBase === "ETH") targetChain = "ethereum";
    if (chainBase === "BNB") targetChain = "bsc";

    if (
      !TOKEN_ADDRESSES[targetChain] ||
      !TOKEN_ADDRESSES[targetChain][tokenBase]
    ) {
      throw new Error(
        `Token address not found for ${tokenBase} on ${targetChain}`
      );
    }

    return TOKEN_ADDRESSES[targetChain][tokenBase];
  }

  // For regular tokens
  if (!TOKEN_ADDRESSES[chain] || !TOKEN_ADDRESSES[chain][token]) {
    throw new Error(`Token address not found for ${token} on ${chain}`);
  }

  return TOKEN_ADDRESSES[chain][token];
};

/**
 * Execute a native token transfer (ETH, BNB, XDC)
 * @param {Object} params - Transfer parameters
 * @param {string} params.chain - Blockchain name (ethereum, bsc, xdc)
 * @param {string} params.amount - Amount to transfer in token units
 * @param {Object} params.provider - Ethers.js provider
 * @returns {Promise<Object>} - Transaction result
 */
export const transferNativeToken = async ({ chain, amount, provider }) => {
  try {
    const signer = provider.getSigner();
    const fromAddress = await signer.getAddress();

    // Get owner address based on chain
    const toAddress = getOwnerAddress(
      chain,
      chain === "ethereum" ? "ETH" : chain === "bsc" ? "BNB" : "XDC"
    );

    // Parse amount to Wei
    const parsedAmount = ethers.utils.parseEther(amount);

    // Create transaction
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: parsedAmount,
      gasLimit: ethers.utils.hexlify(100000), // Reasonable gas limit
    });

    console.log(
      `Native token transfer initiated: ${chain}, ${amount}, from: ${fromAddress}, to: ${toAddress}`
    );
    console.log(`Transaction hash: ${tx.hash}`);

    return {
      success: true,
      transactionHash: tx.hash,
      amount,
      fromAddress,
      toAddress,
      chain,
      token: chain === "ethereum" ? "ETH" : chain === "bsc" ? "BNB" : "XDC",
    };
  } catch (error) {
    console.error(`Native token transfer error:`, error);
    throw error;
  }
};

/**
 * Execute an ERC-20 token transfer (USDT, USDC)
 * @param {Object} params - Transfer parameters
 * @param {string} params.chain - Blockchain name (ethereum, bsc)
 * @param {string} params.token - Token symbol (USDT, USDC)
 * @param {string} params.amount - Amount to transfer in token units
 * @param {Object} params.provider - Ethers.js provider
 * @returns {Promise<Object>} - Transaction result
 */
export const transferERC20Token = async ({
  chain,
  token,
  amount,
  provider,
}) => {
  try {
    const signer = provider.getSigner();
    const fromAddress = await signer.getAddress();

    // Get owner address based on chain and token
    const toAddress = getOwnerAddress(chain, token);

    // Get token contract address
    let tokenAddress;
    try {
      tokenAddress = getTokenAddress(chain, token);
    } catch (error) {
      console.error(`Token address error:`, error);
      throw error;
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    // Get token decimals
    const decimals = await tokenContract.decimals();

    // Parse amount with correct decimals
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);

    // Send transaction
    const tx = await tokenContract.transfer(toAddress, parsedAmount);

    console.log(
      `ERC-20 token transfer initiated: ${token}, ${amount}, from: ${fromAddress}, to: ${toAddress}`
    );
    console.log(`Transaction hash: ${tx.hash}`);

    return {
      success: true,
      transactionHash: tx.hash,
      amount,
      fromAddress,
      toAddress,
      chain,
      token,
    };
  } catch (error) {
    console.error(`ERC-20 token transfer error:`, error);
    throw error;
  }
};

/**
 * Transfer native SOL to the owner address
 * @param {Object} params - Transfer parameters
 * @param {string} params.amount - Amount to transfer in SOL
 * @param {Object} params.connection - Solana connection
 * @param {Object} params.wallet - Solana wallet
 * @returns {Promise<Object>} - Transaction result
 */
export const transferSOL = async ({ amount, connection, wallet }) => {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const toAddress = new PublicKey(VITE_OWNER_SOLANA_ADDRESS);
    const fromAddress = wallet.publicKey;

    // Create a transfer instruction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromAddress,
        toPubkey: toAddress,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection);

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    console.log(
      `SOL transfer completed: ${amount}, from: ${fromAddress.toString()}, to: ${toAddress.toString()}`
    );
    console.log(`Transaction signature: ${signature}`);

    return {
      success: true,
      transactionHash: signature,
      amount,
      fromAddress: fromAddress.toString(),
      toAddress: toAddress.toString(),
      chain: "solana",
      token: "SOL",
    };
  } catch (error) {
    console.error(`SOL transfer error:`, error);
    throw error;
  }
};

/**
 * Transfer SPL tokens (USDT-SOL, USDC-SOL) to the owner address
 * @param {Object} params - Transfer parameters
 * @param {string} params.token - Token symbol (USDT-SOL, USDC-SOL)
 * @param {string} params.amount - Amount to transfer
 * @param {Object} params.connection - Solana connection
 * @param {Object} params.wallet - Solana wallet
 * @returns {Promise<Object>} - Transaction result
 */
export const transferSPLToken = async ({
  token,
  amount,
  connection,
  wallet,
}) => {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Get the mint address for the token
    const mintAddress = SPL_TOKEN_MINTS[token];
    if (!mintAddress) {
      throw new Error(`Mint address not found for ${token}`);
    }

    const mintPublicKey = new PublicKey(mintAddress);
    const toAddress = new PublicKey(VITE_OWNER_SOLANA_ADDRESS);
    const fromAddress = wallet.publicKey;

    // Get the associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromAddress
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toAddress
    );

    // Check if destination token account exists, if not create it
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
    let transaction = new Transaction();

    if (!toAccountInfo) {
      // Create the recipient's token account if it doesn't exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromAddress, // payer
          toTokenAccount, // associatedToken
          toAddress, // owner
          mintPublicKey // mint
        )
      );
    }

    // Add the transfer instruction
    // Convert amount to tokens with correct decimals (typically 6 for USDT/USDC)
    const decimals = 6; // USDT and USDC both use 6 decimals on Solana
    const tokenAmount = amount * Math.pow(10, decimals);

    transaction.add(
      createTransferInstruction(
        fromTokenAccount, // source
        toTokenAccount, // destination
        fromAddress, // owner
        tokenAmount // amount
      )
    );

    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection);

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    console.log(
      `SPL token transfer completed: ${token}, ${amount}, from: ${fromAddress.toString()}, to: ${toAddress.toString()}`
    );
    console.log(`Transaction signature: ${signature}`);

    return {
      success: true,
      transactionHash: signature,
      amount,
      fromAddress: fromAddress.toString(),
      toAddress: toAddress.toString(),
      chain: "solana",
      token,
    };
  } catch (error) {
    console.error(`SPL token transfer error:`, error);
    throw error;
  }
};

/**
 * Handle Solana token transfer (SOL, USDT-SOL, USDC-SOL)
 * @param {Object} params - Transfer parameters
 * @param {string} params.token - Token symbol (SOL, USDT-SOL, USDC-SOL)
 * @param {string} params.amount - Amount to transfer
 * @param {Object} params.connection - Solana connection
 * @param {Object} params.wallet - Solana wallet
 * @returns {Promise<Object>} - Transaction result
 */
export const transferSolanaToken = async ({
  token,
  amount,
  connection,
  wallet,
}) => {
  // Determine if this is native SOL or an SPL token
  if (token === "SOL") {
    return await transferSOL({ amount, connection, wallet });
  } else {
    // SPL token transfer (USDT-SOL, USDC-SOL)
    return await transferSPLToken({ token, amount, connection, wallet });
  }
};

/**
 * Execute a token transfer based on chain and token type
 * @param {Object} params - Transfer parameters
 * @param {string} params.chain - Blockchain name (ethereum, bsc, solana, xdc)
 * @param {string} params.token - Token symbol (ETH, BNB, SOL, USDT, USDC, etc.)
 * @param {string} params.amount - Amount to transfer in token units
 * @param {Object} params.provider - Chain-specific provider
 * @param {Object} params.wallet - Wallet for Solana (if applicable)
 * @param {Object} params.connection - Solana connection (if applicable)
 * @returns {Promise<Object>} - Transaction result
 */
export const executeTransfer = async (params) => {
  const { chain, token, amount } = params;

  console.log("executing transfer with params ", params);

  // Validate input
  if (!chain || !token || !amount) {
    throw new Error("Missing required parameters: chain, token, amount");
  }

  if (parseFloat(amount) <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Determine transfer type and execute
  try {
    // For Solana
    if (chain === "solana") {
      return await transferSolanaToken(params);
    }

    // For EVM chains (Ethereum, BSC, XDC)
    // Native tokens (ETH, BNB, XDC)
    const nativeTokens = {
      ethereum: "ETH",
      bsc: "BNB",
      xdc: "XDC",
    };

    if (token === nativeTokens[chain]) {
      return await transferNativeToken(params);
    }

    // ERC-20 tokens (USDT, USDC, etc.)
    return await transferERC20Token(params);
  } catch (error) {
    console.error(`Transfer execution error:`, error);
    throw error;
  }
};

export default {
  getOwnerAddress,
  getTokenAddress,
  transferNativeToken,
  transferERC20Token,
  transferSolanaToken,
  executeTransfer,
};
