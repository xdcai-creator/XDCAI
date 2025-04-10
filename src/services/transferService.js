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
import { toast } from "react-toastify";

// const SOLANA_RPC_ENDPOINTS = {
//   mainnet: [
//     "https://api.mainnet-beta.solana.com",
//     "https://solana-api.projectserum.com",
//     "https://rpc.ankr.com/solana",
//   ],
//   devnet: [
//     "https://api.devnet.solana.com",
//     "https://devnet.genesysgo.net",
//     "https://rpc.ankr.com/solana_devnet",
//   ],
// };

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

const SOLANA_RPC_ENDPOINTS = {
  mainnet: [
    "https://solana-mainnet.core.chainstack.com/01f2aa77b7f26968197ed2a2f700fd89",
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
    "https://rpc.ankr.com/solana",
    "https://solana.public-rpc.com",
    "https://solana.getblock.io/mainnet/",
    "https://free.rpcpool.com",
    "https://mainnet.rpcpool.com",
    "https://mainnet-beta.solflare.network",
  ],
  devnet: [
    "https://api.devnet.solana.com",
    "https://devnet.genesysgo.net",
    "https://rpc.ankr.com/solana_devnet",
    "https://dev.rpcpool.com",
  ],
};

/**
 * Get a reliable Solana connection with improved fallback logic
 * @param {boolean} isTestnet - Whether to use testnet or mainnet
 * @returns {Promise<Connection>} - A working Solana connection
 */
export const getSolanaConnection = async (isTestnet = false) => {
  const endpoints = isTestnet
    ? SOLANA_RPC_ENDPOINTS.devnet
    : SOLANA_RPC_ENDPOINTS.mainnet;

  const errors = [];

  // Try each endpoint with a short timeout
  for (const endpoint of endpoints) {
    try {
      console.log(
        `Attempting to connect to Solana ${
          isTestnet ? "devnet" : "mainnet"
        } using ${endpoint}`
      );
      const connection = new Connection(endpoint, "confirmed");

      // Test the connection with a short timeout
      await Promise.race([
        connection.getLatestBlockhash().then(() => true),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Connection timeout for ${endpoint}`)),
            3000
          )
        ),
      ]);

      console.log(
        `Connected to Solana ${
          isTestnet ? "devnet" : "mainnet"
        } using ${endpoint}`
      );
      return connection;
    } catch (error) {
      const errorMsg = `Failed to connect to ${endpoint}: ${error.message}`;
      console.warn(errorMsg);
      errors.push(errorMsg);
      // Continue to the next endpoint
    }
  }

  // If we're here, we couldn't connect to any endpoint
  // Try one more approach - use a dynamic fallback from a list of free RPCs
  try {
    // Default to devnet as a last resort for testing
    const fallbackUrl = isTestnet
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com";

    console.log(
      `Trying final fallback connection to ${fallbackUrl} with higher timeout`
    );
    const connection = new Connection(fallbackUrl, {
      commitment: "confirmed",
      disableRetryOnRateLimit: false,
      httpHeaders: { "Content-Type": "application/json" },
    });

    // Test with longer timeout
    await Promise.race([
      connection.getVersion(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Final fallback connection timeout")),
          8000
        )
      ),
    ]);

    console.log(`Connected to Solana using fallback endpoint ${fallbackUrl}`);
    return connection;
  } catch (finalError) {
    console.error("All Solana connection attempts failed:", finalError);
    throw new Error(
      `Unable to connect to any Solana RPC endpoint. Please try again later. Error details: ${errors.join(
        "; "
      )}`
    );
  }
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

function getNetworkParams(chain, isTestnet) {
  switch (chain) {
    case "bsc":
      return {
        chainId: isTestnet ? "0x61" : "0x38", // 97 or 56
        chainName: isTestnet ? "BSC Testnet" : "Binance Smart Chain",
        nativeCurrency: {
          name: "BNB",
          symbol: "BNB",
          decimals: 18,
        },
        rpcUrls: [
          isTestnet
            ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
            : "https://bsc-dataseed.binance.org",
        ],
        blockExplorerUrls: [
          isTestnet ? "https://testnet.bscscan.com" : "https://bscscan.com",
        ],
      };

    case "ethereum":
      return {
        chainId: isTestnet ? "0xaa36a7" : "0x1", // 11155111 (Sepolia) or 1
        chainName: isTestnet ? "Sepolia Testnet" : "Ethereum Mainnet",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [
          isTestnet
            ? "https://sepolia.infura.io/v3/"
            : "https://mainnet.infura.io/v3/",
        ],
        blockExplorerUrls: [
          isTestnet ? "https://sepolia.etherscan.io" : "https://etherscan.io",
        ],
      };

    case "xdc":
      return {
        chainId: isTestnet ? "0x33" : "0x32", // 51 or 50
        chainName: isTestnet ? "XDC Apothem Testnet" : "XDC Network",
        nativeCurrency: {
          name: isTestnet ? "TXDC" : "XDC",
          symbol: isTestnet ? "TXDC" : "XDC",
          decimals: 18,
        },
        rpcUrls: [
          isTestnet
            ? "https://erpc.apothem.network"
            : "https://erpc.xinfin.network",
        ],
        blockExplorerUrls: [
          isTestnet
            ? "https://explorer.apothem.network"
            : "https://explorer.xinfin.network",
        ],
      };

    default:
      throw new Error(`Network parameters not available for chain: ${chain}`);
  }
}

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
    // First ensure we're on the correct network before proceeding
    const requiredChainId =
      chain === "ethereum" ? 1 : chain === "bsc" ? 56 : 50;
    const testnetChainId =
      chain === "ethereum" ? 11155111 : chain === "bsc" ? 97 : 51;

    // Determine if we should use testnet (based on environment or a global setting)
    const useTestnet = import.meta.env.VITE_USE_TESTNET === "true";
    const targetChainId = useTestnet ? testnetChainId : requiredChainId;

    // Check current chain and switch if needed
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== targetChainId) {
        // Format chain ID as hex string
        const targetChainIdHex = `0x${targetChainId.toString(16)}`;

        // Show a more visible notification to the user
        toast.info(
          `Switching to ${chain.toUpperCase()} network. Please confirm in your wallet.`,
          {
            autoClose: false,
            position: "top-center",
          }
        );

        try {
          // Request network switch
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetChainIdHex }],
          });

          // Refresh provider after network switch
          provider = new ethers.providers.Web3Provider(window.ethereum);
        } catch (switchError) {
          // Handle the case where the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            // Add network - adjust parameters based on target chain
            const params = getNetworkParams(chain, useTestnet);

            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [params],
            });

            // After adding, try switching again
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: targetChainIdHex }],
            });

            // Refresh provider after network switch
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } else {
            throw switchError;
          }
        }
      }
    } catch (networkError) {
      console.error("Network switching error:", networkError);
      throw new Error(
        `Please switch to the ${chain} network manually and try again.`
      );
    }

    const signer = provider.getSigner();
    const fromAddress = await signer.getAddress();

    // Get owner address based on chain
    const toAddress = getOwnerAddress(
      chain,
      chain === "ethereum" ? "ETH" : chain === "bsc" ? "BNB" : "XDC"
    );

    // Parse amount to Wei
    const parsedAmount = ethers.utils.parseEther(amount);

    console.log("parsing native tx");
    // Create transaction with explicit gas limit
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
    // First ensure we're on the correct network before proceeding
    const requiredChainId =
      chain === "ethereum" ? 1 : chain === "bsc" ? 56 : 50;
    const testnetChainId =
      chain === "ethereum" ? 11155111 : chain === "bsc" ? 97 : 51;

    // Determine if we should use testnet (based on environment or a global setting)
    const useTestnet = import.meta.env.VITE_USE_TESTNET === "true";
    const targetChainId = useTestnet ? testnetChainId : requiredChainId;

    // Check current chain and switch if needed
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== targetChainId) {
        // Format chain ID as hex string
        const targetChainIdHex = `0x${targetChainId.toString(16)}`;

        // Show a more visible notification to the user
        toast.info(
          `Switching to ${chain.toUpperCase()} network. Please confirm in your wallet.`,
          {
            autoClose: false,
            position: "top-center",
          }
        );

        try {
          // Request network switch
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetChainIdHex }],
          });

          // Refresh provider after network switch
          provider = new ethers.providers.Web3Provider(window.ethereum);
        } catch (switchError) {
          // Handle the case where the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            // Add network - adjust parameters based on target chain
            const params = getNetworkParams(chain, useTestnet);

            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [params],
            });

            // After adding, try switching again
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: targetChainIdHex }],
            });

            // Refresh provider after network switch
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } else {
            throw switchError;
          }
        }
      }
    } catch (networkError) {
      console.error("Network switching error:", networkError);
      throw new Error(
        `Please switch to the ${chain} network manually and try again.`
      );
    }

    const signer = provider.getSigner();
    const fromAddress = await signer.getAddress();

    // Get owner address based on chain and token
    const toAddress = getOwnerAddress(chain, token);

    // Get token contract address - handle chain specific tokens
    let tokenAddress;

    try {
      // Special handling for token formats like "USDT-BNB"
      if (token.includes("-")) {
        const [tokenName, chainName] = token.split("-");
        let baseChain = chain;

        // Map chain suffix to actual chain name
        if (chainName === "ETH") baseChain = "ethereum";
        else if (chainName === "BNB") baseChain = "bsc";
        else if (chainName === "SOL") baseChain = "solana";

        // Use the correct chain for getting token address
        tokenAddress = getTokenAddress(baseChain, tokenName);
      } else {
        tokenAddress = getTokenAddress(chain, token);
      }

      if (!tokenAddress) {
        throw new Error(`Token address not found for ${token} on ${chain}`);
      }
    } catch (error) {
      console.error(`Token address error:`, error);
      throw error;
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    // Get token decimals with a timeout to prevent hanging
    const getDecimals = async () => {
      try {
        return await Promise.race([
          tokenContract.decimals(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout getting token decimals")),
              5000
            )
          ),
        ]);
      } catch (error) {
        console.warn("Error getting decimals:", error);
        // Use common defaults as fallback
        if (token.includes("USDT")) return 6;
        if (token.includes("USDC")) return 6;
        return 18; // Default for most tokens
      }
    };

    const decimals = await getDecimals();
    console.log(`Token decimals for ${token}: ${decimals}`);

    // Parse amount with correct decimals
    const parsedAmount = ethers.utils.parseUnits(amount, decimals);

    // Approve 110% of the required amount (small buffer for potential price fluctuations)
    const approvalAmount = parsedAmount.mul(110).div(100);

    // Check and update allowance with a timeout
    try {
      const allowance = await Promise.race([
        tokenContract.allowance(fromAddress, toAddress),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout checking allowance")),
            10000
          )
        ),
      ]);

      // If allowance is less than amount, request approval
      if (allowance.lt(parsedAmount)) {
        toast.info("Approving token transfer. Please confirm in your wallet.", {
          position: "top-center",
        });

        const approveTx = await tokenContract.approve(
          toAddress,
          approvalAmount, // Use limited approval instead of MaxUint256
          { gasLimit: ethers.utils.hexlify(150000) }
        );

        await approveTx.wait();
        toast.success("Token approval confirmed.", { position: "top-center" });
      }
    } catch (allowanceError) {
      console.error("Allowance check error:", allowanceError);
      // Continue without checking allowance - transfer might still work
    }

    // Send the transaction with explicit gas limit
    toast.info("Confirming transaction. Please wait...", {
      position: "top-center",
    });
    const tx = await tokenContract.transfer(toAddress, parsedAmount, {
      gasLimit: ethers.utils.hexlify(200000), // Higher gas limit for token transfers
    });

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
// Modify the transferSOL function to handle connection issues better
export const transferSOL = async ({ amount, connection, wallet }) => {
  try {
    if (!wallet) {
      throw new Error("No Solana wallet provided");
    }

    if (!wallet.publicKey) {
      throw new Error(
        "Solana wallet not connected. Please connect your wallet."
      );
    }

    // Get a reliable connection - always try to get a fresh one
    // since the provided one might be stale or from a failed endpoint
    const isTestnet = import.meta.env.VITE_USE_TESTNET === "true";
    console.log("Getting fresh Solana connection");
    let reliableConnection;

    try {
      reliableConnection = await getSolanaConnection(isTestnet);
    } catch (connError) {
      // If even getSolanaConnection fails, provide a clear error
      throw new Error(
        `Could not establish a reliable connection to Solana network. Please try again later. ${connError.message}`
      );
    }

    const toAddress = new PublicKey(VITE_OWNER_SOLANA_ADDRESS);
    const fromAddress = wallet.publicKey;

    console.log(
      `Preparing SOL transfer from ${fromAddress.toString()} to ${toAddress.toString()}`
    );

    // Get blockhash with retry
    let blockhashInfo;
    try {
      blockhashInfo = await reliableConnection.getLatestBlockhash("finalized");
    } catch (bhError) {
      console.error("Error getting blockhash:", bhError);
      throw new Error(
        `Network connection issue: ${bhError.message}. Please try again.`
      );
    }

    // Validate amount and convert to lamports
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);
    if (isNaN(lamports) || lamports <= 0) {
      throw new Error(`Invalid SOL amount: ${amount}`);
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromAddress,
        toPubkey: toAddress,
        lamports: lamports,
      })
    );

    // Set transaction properties
    transaction.recentBlockhash = blockhashInfo.blockhash;
    transaction.lastValidBlockHeight = blockhashInfo.lastValidBlockHeight;
    transaction.feePayer = fromAddress;

    console.log(`Sending ${amount} SOL to ${toAddress.toString()}`);

    // Sign and send transaction
    try {
      const signature = await wallet.sendTransaction(
        transaction,
        reliableConnection
      );

      console.log(`Transaction sent with signature: ${signature}`);

      // Confirm transaction
      await reliableConnection.confirmTransaction({
        signature,
        blockhash: blockhashInfo.blockhash,
        lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
      });

      console.log(`SOL transfer completed with signature: ${signature}`);

      return {
        success: true,
        transactionHash: signature,
        amount,
        fromAddress: fromAddress.toString(),
        toAddress: toAddress.toString(),
        chain: "solana",
        token: "SOL",
      };
    } catch (signError) {
      // Handle wallet-specific errors
      if (signError.message?.includes("User rejected")) {
        throw new Error("Transaction was rejected in your wallet");
      } else {
        console.error("Solana transaction error:", signError);
        throw new Error(`Transaction failed: ${signError.message}`);
      }
    }
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
/**
 * Transfer SPL tokens with improved error handling and connection reliability
 * @param {Object} params - Transfer parameters
 * @returns {Promise<Object>} - Transaction result
 */
export const transferSPLToken = async ({
  token,
  amount,
  connection,
  wallet,
}) => {
  try {
    if (!wallet || !wallet.publicKey) {
      throw new Error("Solana wallet not connected");
    }

    // Get the mint address for the token
    const mintAddress = SPL_TOKEN_MINTS[token];
    if (!mintAddress) {
      throw new Error(`Mint address not found for ${token}`);
    }

    // Always get a fresh reliable connection
    const isTestnet = import.meta.env.VITE_USE_TESTNET === "true";
    console.log("Getting fresh Solana connection for SPL token transfer");
    let reliableConnection;

    try {
      reliableConnection = await getSolanaConnection(isTestnet);
    } catch (connError) {
      throw new Error(
        `Could not connect to Solana network for SPL token transfer: ${connError.message}`
      );
    }

    const mintPublicKey = new PublicKey(mintAddress);
    const toAddress = new PublicKey(VITE_OWNER_SOLANA_ADDRESS);
    const fromAddress = wallet.publicKey;

    console.log(`Processing ${token} transfer from ${fromAddress.toString()}`);

    // Get token accounts with error handling
    let fromTokenAccount, toTokenAccount;
    try {
      fromTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        fromAddress
      );

      toTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        toAddress
      );
    } catch (tokenError) {
      console.error("Error getting token accounts:", tokenError);
      throw new Error(
        `Failed to process ${token} accounts: ${tokenError.message}`
      );
    }

    // Check if sender has the token account and sufficient balance
    try {
      const accountInfo = await reliableConnection.getAccountInfo(
        fromTokenAccount
      );

      if (!accountInfo) {
        throw new Error(
          `You don't have a ${token} token account. Please create one first by receiving some ${token}.`
        );
      }
    } catch (balanceError) {
      console.error("Error checking token account:", balanceError);
      throw new Error(
        `Could not verify your ${token} balance: ${balanceError.message}`
      );
    }

    // Get blockhash with retry
    let blockhashInfo;
    try {
      blockhashInfo = await reliableConnection.getLatestBlockhash("finalized");
    } catch (bhError) {
      console.error("Error getting blockhash for SPL transfer:", bhError);
      throw new Error(
        `Network issue while preparing transaction: ${bhError.message}`
      );
    }

    // Create transaction
    let transaction = new Transaction();
    transaction.recentBlockhash = blockhashInfo.blockhash;
    transaction.feePayer = fromAddress;

    // Check if destination token account exists, create if needed
    let toAccountInfo;
    try {
      toAccountInfo = await reliableConnection.getAccountInfo(toTokenAccount);
    } catch (accError) {
      console.warn(
        "Error checking destination account, assuming it doesn't exist:",
        accError
      );
      toAccountInfo = null;
    }

    if (!toAccountInfo) {
      console.log(`Creating destination token account for ${token}`);
      // Create destination token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromAddress,
          toTokenAccount,
          toAddress,
          mintPublicKey
        )
      );
    }

    // Calculate token amount with correct decimals
    const decimals = token.includes("USDT") || token.includes("USDC") ? 6 : 9;
    const tokenAmount = Math.round(amount * Math.pow(10, decimals));

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromAddress,
        tokenAmount
      )
    );

    console.log(`Sending ${amount} ${token} to ${toAddress.toString()}`);

    // Sign and send transaction
    try {
      const signature = await wallet.sendTransaction(
        transaction,
        reliableConnection
      );

      console.log(`${token} transaction sent with signature: ${signature}`);

      // Confirm transaction with reasonable timeout
      await Promise.race([
        reliableConnection.confirmTransaction({
          signature,
          blockhash: blockhashInfo.blockhash,
          lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Transaction confirmation timeout")),
            60000
          )
        ),
      ]);

      console.log(`${token} transfer completed successfully!`);

      return {
        success: true,
        transactionHash: signature,
        amount,
        fromAddress: fromAddress.toString(),
        toAddress: toAddress.toString(),
        chain: "solana",
        token,
      };
    } catch (txError) {
      if (txError.message?.includes("User rejected")) {
        throw new Error("Transaction was rejected in your wallet");
      } else if (txError.message?.includes("insufficient funds")) {
        throw new Error(
          `Insufficient ${token} balance or SOL for transaction fees`
        );
      } else {
        console.error("SPL token transfer error:", txError);
        throw new Error(`${token} transfer failed: ${txError.message}`);
      }
    }
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
  // connection,
  wallet,
}) => {
  // Input validation
  if (!amount || parseFloat(amount) <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  if (!wallet) {
    throw new Error("Solana wallet not provided");
  }

  if (!wallet.publicKey) {
    throw new Error(
      "Solana wallet not connected. Please connect your wallet first."
    );
  }

  // Determine if this is native SOL or an SPL token
  if (token === "SOL") {
    return await transferSOL({ amount, wallet });
  } else {
    // SPL token transfer (USDT-SOL, USDC-SOL)
    return await transferSPLToken({ token, amount, wallet });
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
      return await transferSolanaToken({
        token,
        amount,
        wallet: params.wallet,
      });
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
