// src/components/admin/ContributionsDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { adminApi, authService } from "../../services/api";
import { formatTokenAmount } from "../../utils/tokenUtils";
import { formatAddress } from "../../utils/chainUtils";

// Table component for contributions list
const ContributionsTable = ({
  contributions,
  onViewDetails,
  onActionClick,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-dark-lighter border border-dark-lighter shadow-md rounded-md">
        <thead className="bg-dark-darker">
          <tr>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              ID
            </th>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              Source
            </th>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              Amount
            </th>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              Status
            </th>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              XDC Address
            </th>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              Created
            </th>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              Last Updated
            </th>
            <th className="py-2 px-4 border-b border-dark-darker text-left text-gray-light">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {contributions.length === 0 ? (
            <tr>
              <td colSpan="8" className="py-4 px-4 text-center text-gray-light">
                No contributions found
              </td>
            </tr>
          ) : (
            contributions.map((contribution) => (
              <tr key={contribution._id} className="hover:bg-dark-lighter">
                <td
                  className="py-2 px-4 border-b border-dark-darker cursor-pointer text-primary hover:text-primary-light"
                  onClick={() => onViewDetails(contribution)}
                >
                  {contribution._id.substring(0, 8)}...
                </td>
                <td className="py-2 px-4 border-b border-dark-darker">
                  <div className="text-white">{contribution.sourceChain}</div>
                  <div className="text-xs text-gray-light">
                    {contribution.sourceToken}
                  </div>
                </td>
                <td className="py-2 px-4 border-b border-dark-darker">
                  <div className="text-white">
                    {formatAmount(
                      contribution.amount,
                      contribution.sourceToken
                    )}
                  </div>
                  <div className="text-xs text-gray-light">
                    ${contribution.usdValue}
                  </div>
                </td>
                <td className="py-2 px-4 border-b border-dark-darker">
                  <StatusBadge status={contribution.status} />
                </td>
                <td className="py-2 px-4 border-b border-dark-darker text-xs text-white">
                  {formatAddress(contribution.xdcClaimAddress)}
                </td>
                <td className="py-2 px-4 border-b border-dark-darker text-xs text-white">
                  {new Date(contribution.createdAt).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b border-dark-darker text-xs text-white">
                  {new Date(contribution.updatedAt).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b border-dark-darker">
                  <div className="flex space-x-2">
                    <button
                      className="bg-primary hover:bg-primary-light text-dark px-2 py-1 rounded text-xs"
                      onClick={() => onActionClick(contribution, "advance")}
                    >
                      Advance
                    </button>
                    {isRetryable(contribution.status) && (
                      <button
                        className="bg-accent-blue hover:bg-accent-blue/80 text-white px-2 py-1 rounded text-xs"
                        onClick={() => onActionClick(contribution, "retry")}
                      >
                        Retry
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
  );
};

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
  let bgColor = "bg-gray-dark";
  let textColor = "text-white";

  switch (status) {
    case "Detected":
      bgColor = "bg-accent-blue/20";
      textColor = "text-accent-blue";
      break;
    case "Pending Swap":
    case "Pending Bridge":
      bgColor = "bg-secondary/20";
      textColor = "text-secondary";
      break;
    case "Swapped":
    case "Bridged":
      bgColor = "bg-primary/20";
      textColor = "text-primary";
      break;
    case "Bridging":
      bgColor = "bg-accent-purple/20";
      textColor = "text-accent-purple";
      break;
    case "Swap Failed":
    case "Bridge Failed":
    case "Failed":
      bgColor = "bg-accent-red/20";
      textColor = "text-accent-red";
      break;
    case "Claimable":
      bgColor = "bg-secondary-dark/20";
      textColor = "text-secondary-dark";
      break;
    case "Claimed":
      bgColor = "bg-primary/30";
      textColor = "text-primary";
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
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [chainFilter, setChainFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
  });
  const navigate = useNavigate();

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Detected", label: "Detected" },
    { value: "Pending Swap", label: "Pending Swap" },
    { value: "Swapped", label: "Swapped" },
    { value: "Swap Failed", label: "Swap Failed" },
    { value: "Pending Bridge", label: "Pending Bridge" },
    { value: "Bridging", label: "Bridging" },
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

  // Fetch contributions from the API
  const fetchContributions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters = {
        limit: pagination.limit,
        skip: pagination.skip,
        status: statusFilter !== "all" ? statusFilter : undefined,
        chain: chainFilter !== "all" ? chainFilter : undefined,
        search: searchQuery || undefined,
      };

      const response = await adminApi.getContributions(filters);

      setContributions(response.contributions);
      setPagination({
        ...pagination,
        total: response.pagination.total,
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
  }, [statusFilter, chainFilter, pagination.skip, pagination.limit]);

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
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

  return (
    <div className="bg-dark p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            XDCAI Admin Dashboard
          </h1>
          <div className="flex space-x-4">
            {isOwner && (
              <button
                className="bg-secondary hover:bg-secondary-light text-dark px-4 py-2 rounded"
                onClick={() => handleContributionAction(null, "reclaimUnsold")}
              >
                Reclaim Unsold Tokens
              </button>
            )}
            <button
              className="bg-accent-red hover:bg-accent-red/80 text-white px-4 py-2 rounded"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filters and search */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-light mb-1">
              Status Filter
            </label>
            <select
              className="w-full p-2 border border-dark-lighter bg-dark-light rounded text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-light mb-1">
              Chain Filter
            </label>
            <select
              className="w-full p-2 border border-dark-lighter bg-dark-light rounded text-white"
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
            >
              {chainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-light mb-1">
              Search
            </label>
            <form onSubmit={handleSearchSubmit} className="flex">
              <input
                type="text"
                className="flex-grow p-2 border border-dark-lighter bg-dark-light rounded-l text-white"
                placeholder="Search by address, tx hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-primary text-dark px-4 py-2 rounded-r hover:bg-primary-light"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-accent-red/20 text-accent-red p-4 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-white">Loading contributions...</p>
          </div>
        ) : (
          <>
            {/* Contributions table */}
            <ContributionsTable
              contributions={contributions}
              onViewDetails={(contribution) =>
                setSelectedContribution(contribution)
              }
              onActionClick={handleContributionAction}
            />

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-light">
                Showing {pagination.skip + 1} to{" "}
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
                  className="px-4 py-2 border border-dark-lighter rounded bg-dark-light text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={
                    pagination.skip + pagination.limit >= pagination.total
                  }
                  className="px-4 py-2 border border-dark-lighter rounded bg-dark-light text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Detail modal */}
        {selectedContribution && (
          <ContributionDetailModal
            contribution={selectedContribution}
            onClose={() => setSelectedContribution(null)}
            onAction={handleContributionAction}
          />
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
      Bridging: ["Bridged", "Bridge Failed", "Claimable"],
      Bridged: ["Claimable"],
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
