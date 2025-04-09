// src/components/admin/ContributionsDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { adminApi, authService } from "../../services/api";
import { formatTokenAmount } from "../../utils/tokenUtils";
import { formatAddress } from "../../utils/chainUtils";

// Helper function to format amounts
const formatAmount = (amount, token) => {
  try {
    // Different tokens have different decimal places
    const decimals = {
      ETH: 18,
      BNB: 18,
      XDC: 18,
      SOL: 9,
      USDT: 6,
      USDC: 6,
      XDCAI: 18,
    };

    const tokenDecimals = decimals[token] || 18;
    return `${parseFloat(
      ethers.utils.formatUnits(amount, tokenDecimals)
    ).toFixed(4)} ${token}`;
  } catch (error) {
    console.error("Error formatting amount:", error);
    return `${amount} ${token}`;
  }
};

// Helper to check if status is retryable
const isRetryable = (status) => {
  return ["Swap Failed", "Bridge Failed", "Failed"].includes(status);
};

// Status badge component
const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-700";
  let textColor = "text-white";

  switch (status) {
    case "Detected":
      bgColor = "bg-[#1da1f2]/20";
      textColor = "text-[#1da1f2]";
      break;
    case "Pending Swap":
    case "Pending Bridge":
      bgColor = "bg-[#F3BA2F]/20";
      textColor = "text-[#F3BA2F]";
      break;
    case "Swapped":
    case "Bridged":
      bgColor = "bg-[#00FA73]/20";
      textColor = "text-[#00FA73]";
      break;
    case "Bridging":
      bgColor = "bg-[#9945FF]/20";
      textColor = "text-[#9945FF]";
      break;
    case "Bridge Needs Verification": // Add this case
      bgColor = "bg-[#F3BA2F]/40";
      textColor = "text-[#F3BA2F]";
      break;
    case "Registration Pending":
      bgColor = "bg-[#FF9800]/30";
      textColor = "text-[#FF9800]";
      break;
    case "Swap Failed":
    case "Bridge Failed":
    case "Failed":
      bgColor = "bg-[#ff4c4c]/20";
      textColor = "text-[#ff4c4c]";
      break;
    case "Claimable":
      bgColor = "bg-[#F3BA2F]/30";
      textColor = "text-[#F3BA2F]";
      break;
    case "Claimed":
      bgColor = "bg-[#00FA73]/30";
      textColor = "text-[#00FA73]";
      break;
    default:
      break;
  }

  return (
    <span
      className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}
    >
      {status}
    </span>
  );
};

// Main dashboard component
const ContributionsDashboard = () => {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [chainFilter, setChainFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isRegistering, setIsRegistering] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
  });

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Detected", label: "Detected" },
    { value: "Pending Swap", label: "Pending Swap" },
    { value: "Swapped", label: "Swapped" },
    { value: "Swap Failed", label: "Swap Failed" },
    { value: "Pending Bridge", label: "Pending Bridge" },
    { value: "Bridging", label: "Bridging" },
    { value: "Bridge Needs Verification", label: "Bridge Needs Verification" },
    { value: "Registration Pending", label: "Registration Pending" }, // Add new status
    { value: "Bridged", label: "Bridged" },
    { value: "Bridge Failed", label: "Bridge Failed" },
    { value: "Claimable", label: "Claimable" },
    { value: "Claimed", label: "Claimed" },
    { value: "Failed", label: "Failed" },
  ];

  // Chain filter options
  const chainOptions = [
    { value: "all", label: "All Chains" },
    { value: "ethereum", label: "Ethereum" },
    { value: "bsc", label: "BSC" },
    { value: "solana", label: "Solana" },
    { value: "xdc", label: "XDC" },
  ];

  // Sort options
  const sortOptions = [
    { value: "createdAt", label: "Created Date" },
    { value: "updatedAt", label: "Updated Date" },
    { value: "usdValue", label: "USD Value" },
    { value: "status", label: "Status" },
  ];

  const pendingRegistrations = useMemo(() => {
    return contributions.filter((c) => c.status === "Registration Pending");
  }, [contributions]);

  // Check authentication on component mount
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/admin/login");
    }

    // Check if user is contract owner
    checkIfOwner();
  }, [navigate]);

  // Check if user is contract owner
  const checkIfOwner = async () => {
    try {
      const ownerAddress = import.meta.env.VITE_OWNER_ETHEREUM_ADDRESS;

      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const connectedAddress = accounts[0].toLowerCase();
          setIsOwner(connectedAddress === ownerAddress.toLowerCase());
        }
      }
    } catch (error) {
      console.error("Error checking owner status:", error);
    }
  };

  // Fetch contributions from the API using the new robust filtering
  const fetchContributions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build filter options
      const filterOptions = {
        limit: pagination.limit,
        skip: pagination.skip,
        sort: sortField,
        order: sortOrder,
        status: statusFilter !== "all" ? statusFilter : undefined,
        chain: chainFilter !== "all" ? chainFilter : undefined,
        search: searchQuery || undefined,
      };

      const response = await adminApi.getContributions(filterOptions);

      setContributions(response.contributions || []);
      setPagination({
        ...pagination,
        total: response.pagination?.total || 0,
      });
    } catch (err) {
      console.error("Error fetching contributions:", err);
      setError("Failed to load contributions. Please try again later.");

      // Check if auth error and redirect
      if (err.response?.status === 401) {
        authService.logout();
        navigate("/admin/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load contributions on initial render and when filters change
  useEffect(() => {
    fetchContributions();
  }, [
    statusFilter,
    chainFilter,
    sortField,
    sortOrder,
    pagination.skip,
    pagination.limit,
  ]);

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Reset pagination when searching
    setPagination({
      ...pagination,
      skip: 0,
    });
    fetchContributions();
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.skip > 0) {
      setPagination({
        ...pagination,
        skip: Math.max(0, pagination.skip - pagination.limit),
      });
    }
  };

  const handleNextPage = () => {
    if (pagination.skip + pagination.limit < pagination.total) {
      setPagination({
        ...pagination,
        skip: pagination.skip + pagination.limit,
      });
    }
  };

  // Handle contribution actions (advance/retry)
  const handleContributionAction = async (
    contribution,
    action,
    newStatus = null
  ) => {
    try {
      if (action === "advance" && !newStatus) {
        // Just open the modal to select which status
        setSelectedContribution(contribution);
        return;
      }

      if (action === "advance" && newStatus) {
        // Advance to specific status
        const response = await adminApi.advanceContributionStatus(
          contribution._id,
          newStatus,
          `Status manually changed to ${newStatus} by admin`
        );

        // Update the contribution in the local state
        setContributions((prevContributions) =>
          prevContributions.map((c) =>
            c._id === contribution._id ? response.contribution : c
          )
        );

        // Update the selected contribution if in modal
        if (
          selectedContribution &&
          selectedContribution._id === contribution._id
        ) {
          setSelectedContribution(response.contribution);
        }

        alert(`Contribution successfully advanced to ${newStatus}`);
      }

      if (action === "retry") {
        // Retry failed contribution
        const response = await adminApi.retryContribution(contribution._id);

        // Update the contribution in the local state
        setContributions((prevContributions) =>
          prevContributions.map((c) =>
            c._id === contribution._id ? response.contribution : c
          )
        );

        // Update the selected contribution if in modal
        if (
          selectedContribution &&
          selectedContribution._id === contribution._id
        ) {
          setSelectedContribution(response.contribution);
        }

        alert("Contribution retry initiated");
      }

      if (action === "bridge") {
        // Bridge contribution
        const response = await adminApi.bridgeContribution(contribution._id);

        // Update the contribution in the local state
        setContributions((prevContributions) =>
          prevContributions.map((c) =>
            c._id === contribution._id ? { ...c, status: "Bridging" } : c
          )
        );

        alert(`Bridge initiated. Task ID: ${response.taskId}`);
      }

      if (action === "reclaimUnsold" && isOwner) {
        if (
          window.confirm(
            "Are you sure you want to reclaim unsold tokens? This action cannot be undone."
          )
        ) {
          await adminApi.reclaimUnsoldTokens();
          alert("Unsold tokens reclaimed successfully");
        }
      }
    } catch (err) {
      console.error("Error performing contribution action:", err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    navigate("/admin/login");
  };

  // Format token amount
  const formatAmount = (amount, token, sourceChain) => {
    try {
      // Different tokens have different decimal places based on chain
      const decimals = {
        // Base tokens
        ETH: 18,
        BNB: 18,
        XDC: 18,
        SOL: 9,
        XDCAI: 18,

        // USDT/USDC by chain
        "USDT-ethereum": 6,
        "USDT-bsc": 18,
        "USDT-solana": 6,
        "USDC-ethereum": 6,
        "USDC-bsc": 18,
        "USDC-solana": 6,

        // Defaults
        USDT: 6,
        USDC: 6,
      };

      // Try to get chain-specific decimals first
      const tokenKey = sourceChain ? `${token}-${sourceChain}` : token;
      const tokenDecimals = decimals[tokenKey] || decimals[token] || 18;

      return `${parseFloat(
        ethers.utils.formatUnits(amount, tokenDecimals)
      ).toFixed(4)} ${token}`;
    } catch (error) {
      console.error("Error formatting amount:", error);
      return `${amount} ${token}`;
    }
  };

  // Determine if a status is retryable
  const isRetryable = (status) => {
    return ["Swap Failed", "Bridge Failed", "Failed"].includes(status);
  };

  const handleRegisterContract = async (contributionId) => {
    try {
      setIsRegistering(true);

      // Show confirmation dialog first
      if (
        !confirm(
          "Are you sure you want to manually register this contribution with the contract?"
        )
      ) {
        setIsRegistering(false);
        return;
      }

      const response = await adminApi.registerContribution(contributionId);

      if (response.success) {
        // Update contribution in list
        setContributions((prevContributions) =>
          prevContributions.map((c) =>
            c._id === contributionId
              ? {
                  ...c,
                  status: "Claimable",
                  contractRegistered: true,
                  contractTxHash: response.txHash,
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        );

        // Update selected contribution if in modal
        if (
          selectedContribution &&
          selectedContribution._id === contributionId
        ) {
          setSelectedContribution((prev) => ({
            ...prev,
            status: "Claimable",
            contractRegistered: true,
            contractTxHash: response.txHash,
            updatedAt: new Date().toISOString(),
          }));
        }

        alert(
          `Contribution successfully registered with contract. TX: ${response.txHash}`
        );
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (err) {
      console.error("Error registering contribution with contract:", err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  // Check if a status can be bridged
  const isBridgeable = (status, chain) => {
    return status === "Swapped" && chain !== "xdc";
  };

  // Get next possible statuses based on current status
  const getNextStatusOptions = (currentStatus) => {
    const statusOptions = {
      Detected: ["Pending Swap", "Pending Bridge", "Claimable"],
      "Pending Swap": ["Swapped", "Swap Failed", "Pending Bridge"],
      Swapped: ["Pending Bridge"],
      "Pending Bridge": ["Bridging", "Bridge Failed", "Claimable"],
      Bridging: [
        "Bridged",
        "Bridge Failed",
        "Claimable",
        "Bridge Needs Verification",
      ],
      "Bridge Needs Verification": [
        "Bridged",
        "Bridging",
        "Bridge Failed",
        "Claimable",
      ],
      Bridged: ["Claimable"],
      Claimable: ["Claimed"],
      "Swap Failed": ["Pending Swap", "Failed"],
      "Bridge Failed": ["Pending Bridge", "Failed"],
    };

    return statusOptions[currentStatus] || [];
  };

  // Format transaction link helper
  const formatTransactionLink = (txHash, chain) => {
    if (!txHash) return "N/A";

    const explorers = {
      ethereum: "https://sepolia.etherscan.io/tx/",
      bsc: "https://testnet.bscscan.com/tx/",
      xdc: "https://explorer.apothem.network/tx/",
      solana: "https://explorer.solana.com/tx/?cluster=devnet",
    };

    const baseUrl = explorers[chain] || "#";

    return (
      <a
        href={`${baseUrl}${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00FA73] hover:text-[#00E066]"
      >
        {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 4)}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            XDCAI Admin Dashboard
          </h1>
          <div className="flex space-x-4">
            {isOwner && (
              <button
                className="bg-[#F3BA2F] hover:bg-[#E49B0F] text-black px-4 py-2 rounded-md"
                onClick={() => handleContributionAction(null, "reclaimUnsold")}
              >
                Reclaim Unsold Tokens
              </button>
            )}
            <button
              className="bg-[#ff4c4c] hover:bg-[#ff4c4c]/80 text-white px-4 py-2 rounded-md"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status Filter
            </label>
            <select
              className="w-full p-2 border border-[#303030] bg-[#1A1A1A] rounded text-white"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, skip: 0 });
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Chain Filter
            </label>
            <select
              className="w-full p-2 border border-[#303030] bg-[#1A1A1A] rounded text-white"
              value={chainFilter}
              onChange={(e) => {
                setChainFilter(e.target.value);
                setPagination({ ...pagination, skip: 0 });
              }}
            >
              {chainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sort By
            </label>
            <div className="flex items-center">
              <select
                className="flex-grow p-2 border border-[#303030] bg-[#1A1A1A] rounded-l text-white"
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value);
                  setPagination({ ...pagination, skip: 0 });
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className="bg-[#1A1A1A] border border-[#303030] border-l-0 p-2 rounded-r text-white"
                onClick={() => {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  setPagination({ ...pagination, skip: 0 });
                }}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Search
            </label>
            <form onSubmit={handleSearchSubmit} className="flex">
              <input
                type="text"
                className="flex-grow p-2 border border-[#303030] bg-[#1A1A1A] rounded-l text-white"
                placeholder="Search by address, tx hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-[#00FA73] text-black px-4 py-2 rounded-r hover:bg-[#00E066]"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-[#ff4c4c]/20 text-[#ff4c4c] p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FA73]"></div>
            <p className="mt-2 text-white">Loading contributions...</p>
          </div>
        ) : (
          <>
            {/* Contributions table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#1A1A1A] border border-[#303030] shadow-md rounded-md">
                <thead className="bg-[#0C0C0C]">
                  <tr>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      ID
                    </th>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      Source
                    </th>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      Amount
                    </th>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      Status
                    </th>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      XDC Address
                    </th>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      Created
                    </th>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      Last Updated
                    </th>
                    <th className="py-2 px-4 border-b border-[#303030] text-left text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-4 px-4 text-center text-gray-300"
                      >
                        No contributions found
                      </td>
                    </tr>
                  ) : (
                    contributions.map((contribution) => (
                      <tr key={contribution._id} className="hover:bg-[#242424]">
                        <td
                          className="py-2 px-4 border-b border-[#303030] cursor-pointer text-[#00FA73] hover:text-[#00E066]"
                          onClick={() => setSelectedContribution(contribution)}
                        >
                          {contribution._id.substring(0, 8)}...
                        </td>
                        <td className="py-2 px-4 border-b border-[#303030]">
                          <div className="text-white">
                            {contribution.sourceChain}
                          </div>
                          <div className="text-xs text-gray-400">
                            {contribution.sourceToken}
                          </div>
                        </td>
                        <td className="py-2 px-4 border-b border-[#303030]">
                          <div className="text-white">
                            {formatAmount(
                              contribution.amount,
                              contribution.sourceToken,
                              contribution.sourceChain
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            ${contribution.usdValue}
                          </div>
                        </td>
                        <td className="py-2 px-4 border-b border-[#303030]">
                          <StatusBadge status={contribution.status} />
                        </td>
                        <td className="py-2 px-4 border-b border-[#303030] text-xs text-white">
                          {formatAddress(contribution.xdcClaimAddress)}
                        </td>
                        <td className="py-2 px-4 border-b border-[#303030] text-xs text-white">
                          {new Date(contribution.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 border-b border-[#303030] text-xs text-white">
                          {new Date(contribution.updatedAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-4 border-b border-[#303030]">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="bg-[#00FA73] hover:bg-[#00E066] text-black px-2 py-1 rounded text-xs"
                              onClick={() =>
                                handleContributionAction(
                                  contribution,
                                  "advance"
                                )
                              }
                            >
                              Advance
                            </button>
                            {contribution.status === "Registration Pending" && (
                              <button
                                className="bg-[#FF9800] hover:bg-[#FFA726] text-black px-2 py-1 rounded text-xs"
                                onClick={() =>
                                  handleRegisterContract(contribution._id)
                                }
                                disabled={isRegistering}
                              >
                                {isRegistering
                                  ? "Registering..."
                                  : "Register Contract"}
                              </button>
                            )}
                            {isRetryable(contribution.status) && (
                              <button
                                className="bg-[#1da1f2] hover:bg-[#1da1f2]/80 text-white px-2 py-1 rounded text-xs"
                                onClick={() =>
                                  handleContributionAction(
                                    contribution,
                                    "retry"
                                  )
                                }
                              >
                                Retry
                              </button>
                            )}
                            {isBridgeable(
                              contribution.status,
                              contribution.sourceChain
                            ) && (
                              <button
                                className="bg-[#9945FF] hover:bg-[#8A35F0] text-white px-2 py-1 rounded text-xs"
                                onClick={() =>
                                  handleContributionAction(
                                    contribution,
                                    "bridge"
                                  )
                                }
                              >
                                Bridge
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-300">
                Showing {pagination.total > 0 ? pagination.skip + 1 : 0} to{" "}
                {Math.min(
                  pagination.skip + contributions.length,
                  pagination.total
                )}{" "}
                of {pagination.total} contributions
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.skip === 0}
                  className="px-4 py-2 border border-[#303030] rounded bg-[#1A1A1A] text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={
                    pagination.skip + pagination.limit >= pagination.total
                  }
                  className="px-4 py-2 border border-[#303030] rounded bg-[#1A1A1A] text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Detail modal */}
        {selectedContribution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  Contribution Details
                </h2>
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => setSelectedContribution(null)}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-medium text-gray-300">ID</h3>
                  <p className="text-sm text-white">
                    {selectedContribution._id}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Status</h3>
                  <StatusBadge status={selectedContribution.status} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Source Chain</h3>
                  <p className="text-sm text-white">
                    {selectedContribution.sourceChain}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Source Token</h3>
                  <p className="text-sm text-white">
                    {selectedContribution.sourceToken}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Amount</h3>
                  <p className="text-sm text-white">
                    {formatAmount(
                      selectedContribution.amount,
                      selectedContribution.sourceToken,
                      selectedContribution.sourceChain
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">USD Value</h3>
                  <p className="text-sm text-white">
                    ${selectedContribution.usdValue}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">
                    XDC Claim Address
                  </h3>
                  <p className="text-sm text-white">
                    {selectedContribution.xdcClaimAddress}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Email</h3>
                  <p className="text-sm text-white">
                    {selectedContribution.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-300">Notes</h3>
                <p className="text-sm p-2 bg-[#0C0C0C] rounded text-white">
                  {selectedContribution.notes || "No notes available"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <h3 className="font-medium text-gray-300">
                    Source Transaction
                  </h3>
                  <p className="text-sm text-white">
                    {formatTransactionLink(
                      selectedContribution.sourceTxHash,
                      selectedContribution.sourceChain
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">
                    Swap Transaction
                  </h3>
                  <p className="text-sm text-white">
                    {selectedContribution.swapTxHash
                      ? formatTransactionLink(
                          selectedContribution.swapTxHash,
                          selectedContribution.sourceChain
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">
                    Bridge Transaction/Task
                  </h3>
                  <p className="text-sm text-white">
                    {selectedContribution.bridgeTxHash
                      ? selectedContribution.bridgeTxHash
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-medium text-gray-300">Created</h3>
                  <p className="text-sm text-white">
                    {new Date(selectedContribution.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Last Updated</h3>
                  <p className="text-sm text-white">
                    {new Date(selectedContribution.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Last Processed</h3>
                  <p className="text-sm text-white">
                    {selectedContribution.lastProcessed
                      ? new Date(
                          selectedContribution.lastProcessed
                        ).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-300">Retry Count</h3>
                  <p className="text-sm text-white">
                    {selectedContribution.retryCount || 0}
                  </p>
                </div>
              </div>

              {selectedContribution.status === "Registration Pending" && (
                <div className="mt-4 p-4 bg-[#FF9800]/10 border border-[#FF9800] rounded-lg">
                  <h3 className="font-medium text-[#FF9800] mb-2">
                    Registration Required
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    This contribution has been bridged successfully but failed
                    during contract registration. Manual registration is
                    required.
                  </p>

                  {selectedContribution.registrationRetryCount > 0 && (
                    <div className="text-sm text-gray-400 mb-3">
                      System retry count:{" "}
                      {selectedContribution.registrationRetryCount}/3
                    </div>
                  )}

                  <button
                    onClick={() =>
                      handleRegisterContract(selectedContribution._id)
                    }
                    className="w-full py-2 bg-[#FF9800] hover:bg-[#FFA726] text-black rounded font-medium"
                    disabled={isRegistering}
                  >
                    {isRegistering
                      ? "Registering..."
                      : "Register with Contract"}
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-[#303030]">
                <div>
                  <h3 className="font-medium text-gray-300 mb-2">
                    Advance Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getNextStatusOptions(selectedContribution.status).map(
                      (status) => (
                        <button
                          key={status}
                          className="bg-[#00FA73] hover:bg-[#00E066] text-black px-3 py-1 rounded text-sm"
                          onClick={() =>
                            handleContributionAction(
                              selectedContribution,
                              "advance",
                              status
                            )
                          }
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 self-end">
                  {isRetryable(selectedContribution.status) && (
                    <button
                      className="bg-[#1da1f2] hover:bg-[#1da1f2]/80 text-white px-4 py-2 rounded text-sm"
                      onClick={() =>
                        handleContributionAction(selectedContribution, "retry")
                      }
                    >
                      Retry
                    </button>
                  )}

                  {isBridgeable(
                    selectedContribution.status,
                    selectedContribution.sourceChain
                  ) && (
                    <button
                      className="bg-[#9945FF] hover:bg-[#8A35F0] text-white px-4 py-2 rounded text-sm"
                      onClick={() =>
                        handleContributionAction(selectedContribution, "bridge")
                      }
                    >
                      Bridge
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Detail view modal component
const ContributionDetailModal = ({ contribution, onClose, onAction }) => {
  if (!contribution) return null;

  const formatTransactionLink = (txHash, chain) => {
    if (!txHash) return "N/A";

    const explorers = {
      ethereum: "https://sepolia.etherscan.io/tx/",
      bsc: "https://testnet.bscscan.com/tx/",
      xdc: "https://explorer.apothem.network/tx/",
      solana: "https://explorer.solana.com/tx/?cluster=devnet",
    };

    const baseUrl = explorers[chain] || "#";

    return (
      <a
        href={`${baseUrl}${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary-light"
      >
        {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 4)}
      </a>
    );
  };

  // Determine what next status options should be available
  const getNextStatusOptions = (currentStatus) => {
    const statusOptions = {
      Detected: ["Pending Swap", "Pending Bridge", "Claimable"],
      "Pending Swap": ["Swapped", "Swap Failed", "Pending Bridge"],
      Swapped: ["Pending Bridge"],
      "Pending Bridge": ["Bridging", "Bridge Failed", "Claimable"],
      Bridging: [
        "Bridged",
        "Bridge Failed",
        "Claimable",
        "Registration Pending", // Add new status option
        "Bridge Needs Verification",
      ],
      "Bridge Needs Verification": [
        "Bridged",
        "Bridging",
        "Bridge Failed",
        "Registration Pending", // Add new status option
        "Claimable",
      ],
      "Registration Pending": ["Claimable"],
      Bridged: ["Claimable", "Registration Pending"], // Add Registration Pending as an option
      Claimable: ["Claimed"],
      "Swap Failed": ["Pending Swap", "Failed"],
      "Bridge Failed": ["Pending Bridge", "Failed"],
    };

    return statusOptions[currentStatus] || [];
  };

  const nextStatusOptions = getNextStatusOptions(contribution.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-light p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Contribution Details</h2>
          <button className="text-gray hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-light">ID</h3>
            <p className="text-sm text-white">{contribution._id}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Status</h3>
            <StatusBadge status={contribution.status} />
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Source Chain</h3>
            <p className="text-sm text-white">{contribution.sourceChain}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Source Token</h3>
            <p className="text-sm text-white">{contribution.sourceToken}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Amount</h3>
            <p className="text-sm text-white">
              {formatAmount(contribution.amount, contribution.sourceToken)}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">USD Value</h3>
            <p className="text-sm text-white">${contribution.usdValue}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">XDC Claim Address</h3>
            <p className="text-sm text-white">{contribution.xdcClaimAddress}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Email</h3>
            <p className="text-sm text-white">{contribution.email || "N/A"}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-light">Notes</h3>
          <p className="text-sm p-2 bg-dark rounded text-white">
            {contribution.notes || "No notes available"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-light">Source Transaction</h3>
            <p className="text-sm text-white">
              {formatTransactionLink(
                contribution.sourceTxHash,
                contribution.sourceChain
              )}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Swap Transaction</h3>
            <p className="text-sm text-white">
              {contribution.swapTxHash
                ? formatTransactionLink(
                    contribution.swapTxHash,
                    contribution.sourceChain
                  )
                : "N/A"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">
              Bridge Transaction/Task
            </h3>
            <p className="text-sm text-white">
              {contribution.bridgeTxHash ? contribution.bridgeTxHash : "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-light">Created</h3>
            <p className="text-sm text-white">
              {new Date(contribution.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Last Updated</h3>
            <p className="text-sm text-white">
              {new Date(contribution.updatedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Last Processed</h3>
            <p className="text-sm text-white">
              {contribution.lastProcessed
                ? new Date(contribution.lastProcessed).toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-light">Retry Count</h3>
            <p className="text-sm text-white">{contribution.retryCount || 0}</p>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-dark">
          <div>
            <h3 className="font-medium text-gray-light mb-2">Advance Status</h3>
            <div className="flex flex-wrap gap-2">
              {nextStatusOptions.map((status) => (
                <button
                  key={status}
                  className="bg-primary hover:bg-primary-light text-dark px-3 py-1 rounded text-sm"
                  onClick={() => onAction(contribution, "advance", status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {isRetryable(contribution.status) && (
            <button
              className="bg-accent-blue hover:bg-accent-blue/80 text-white px-4 py-2 rounded text-sm self-end"
              onClick={() => onAction(contribution, "retry")}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributionsDashboard;
