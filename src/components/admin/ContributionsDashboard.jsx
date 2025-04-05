// frontend/src/components/admin/ContributionsDashboard.jsx
import React, { useState, useEffect } from "react";
import { formatUnits } from "viem";
import axios from "axios";

// Table component for contributions list
const ContributionsTable = ({
  contributions,
  onViewDetails,
  onActionClick,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b text-left">ID</th>
            <th className="py-2 px-4 border-b text-left">Source</th>
            <th className="py-2 px-4 border-b text-left">Amount</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
            <th className="py-2 px-4 border-b text-left">XDC Address</th>
            <th className="py-2 px-4 border-b text-left">Created</th>
            <th className="py-2 px-4 border-b text-left">Last Updated</th>
            <th className="py-2 px-4 border-b text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contributions.length === 0 ? (
            <tr>
              <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                No contributions found
              </td>
            </tr>
          ) : (
            contributions.map((contribution) => (
              <tr key={contribution._id} className="hover:bg-gray-50">
                <td
                  className="py-2 px-4 border-b cursor-pointer text-blue-600 hover:text-blue-800"
                  onClick={() => onViewDetails(contribution)}
                >
                  {contribution._id.substring(0, 8)}...
                </td>
                <td className="py-2 px-4 border-b">
                  <div>{contribution.sourceChain}</div>
                  <div className="text-xs text-gray-500">
                    {contribution.sourceToken}
                  </div>
                </td>
                <td className="py-2 px-4 border-b">
                  <div>
                    {formatAmount(
                      contribution.amount,
                      contribution.sourceToken
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    ${contribution.usdValue}
                  </div>
                </td>
                <td className="py-2 px-4 border-b">
                  <StatusBadge status={contribution.status} />
                </td>
                <td className="py-2 px-4 border-b text-xs">
                  {formatAddress(contribution.xdcClaimAddress)}
                </td>
                <td className="py-2 px-4 border-b text-xs">
                  {new Date(contribution.createdAt).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b text-xs">
                  {new Date(contribution.updatedAt).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b">
                  <div className="flex space-x-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => onActionClick(contribution, "advance")}
                    >
                      Advance
                    </button>
                    {isRetryable(contribution.status) && (
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
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
    return `${parseFloat(formatUnits(BigInt(amount), tokenDecimals)).toFixed(
      4
    )} ${token}`;
  } catch (error) {
    console.error("Error formatting amount:", error);
    return `${amount} ${token}`;
  }
};

// Helper function to format addresses
const formatAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

// Helper to check if status is retryable
const isRetryable = (status) => {
  return ["Swap Failed", "Bridge Failed", "Failed"].includes(status);
};

// Status badge component
const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-200";
  let textColor = "text-gray-800";

  switch (status) {
    case "Detected":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case "Pending Swap":
    case "Pending Bridge":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    case "Swapped":
    case "Bridged":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case "Bridging":
      bgColor = "bg-purple-100";
      textColor = "text-purple-800";
      break;
    case "Swap Failed":
    case "Bridge Failed":
    case "Failed":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case "Claimable":
      bgColor = "bg-indigo-100";
      textColor = "text-indigo-800";
      break;
    case "Claimed":
      bgColor = "bg-green-200";
      textColor = "text-green-900";
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
        className="text-blue-600 hover:text-blue-800"
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
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Contribution Details</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-700">ID</h3>
            <p className="text-sm">{contribution._id}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Status</h3>
            <StatusBadge status={contribution.status} />
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Source Chain</h3>
            <p className="text-sm">{contribution.sourceChain}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Source Token</h3>
            <p className="text-sm">{contribution.sourceToken}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Amount</h3>
            <p className="text-sm">
              {formatAmount(contribution.amount, contribution.sourceToken)}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">USD Value</h3>
            <p className="text-sm">${contribution.usdValue}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">XDC Claim Address</h3>
            <p className="text-sm">{contribution.xdcClaimAddress}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Email</h3>
            <p className="text-sm">{contribution.email || "N/A"}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-700">Notes</h3>
          <p className="text-sm p-2 bg-gray-50 rounded">
            {contribution.notes || "No notes available"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-700">Source Transaction</h3>
            <p className="text-sm">
              {formatTransactionLink(
                contribution.sourceTxHash,
                contribution.sourceChain
              )}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Swap Transaction</h3>
            <p className="text-sm">
              {contribution.swapTxHash
                ? formatTransactionLink(
                    contribution.swapTxHash,
                    contribution.sourceChain
                  )
                : "N/A"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">
              Bridge Transaction/Task
            </h3>
            <p className="text-sm">
              {contribution.bridgeTxHash ? contribution.bridgeTxHash : "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-700">Created</h3>
            <p className="text-sm">
              {new Date(contribution.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Last Updated</h3>
            <p className="text-sm">
              {new Date(contribution.updatedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Last Processed</h3>
            <p className="text-sm">
              {contribution.lastProcessed
                ? new Date(contribution.lastProcessed).toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Retry Count</h3>
            <p className="text-sm">{contribution.retryCount || 0}</p>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Advance Status</h3>
            <div className="flex space-x-2">
              {nextStatusOptions.map((status) => (
                <button
                  key={status}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  onClick={() => onAction(contribution, "advance", status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {isRetryable(contribution.status) && (
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm self-end"
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

// Main dashboard component
const ContributionsDashboard = () => {
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [chainFilter, setChainFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  // Fetch contributions from the API
  const fetchContributions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/transactions/contributions/pending?limit=${pagination.limit}&skip=${pagination.skip}`;

      // Add status filter if not 'all'
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }

      // Add chain filter if not 'all'
      if (chainFilter !== "all") {
        url += `&chain=${chainFilter}`;
      }

      // Add search filter if present
      if (searchQuery) {
        url += `&search=${searchQuery}`;
      }

      const response = await axios.get(url);

      setContributions(response.data.contributions);
      setPagination({
        ...pagination,
        total: response.data.pagination.total,
      });
    } catch (err) {
      console.error("Error fetching contributions:", err);
      setError("Failed to load contributions. Please try again later.");
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
        const response = await axios.post(
          "/api/transactions/contribution/advance",
          {
            contributionId: contribution._id,
            targetStatus: newStatus,
            notes: `Status manually changed to ${newStatus} by admin`,
          }
        );

        // Update the contribution in the local state
        setContributions((prevContributions) =>
          prevContributions.map((c) =>
            c._id === contribution._id ? response.data.contribution : c
          )
        );

        // Update the selected contribution if in modal
        if (
          selectedContribution &&
          selectedContribution._id === contribution._id
        ) {
          setSelectedContribution(response.data.contribution);
        }

        alert(`Contribution successfully advanced to ${newStatus}`);
      }

      if (action === "retry") {
        // Retry failed contribution
        const response = await axios.post(
          "/api/transactions/contribution/retry",
          {
            contributionId: contribution._id,
          }
        );

        // Update the contribution in the local state
        setContributions((prevContributions) =>
          prevContributions.map((c) =>
            c._id === contribution._id ? response.data.contribution : c
          )
        );

        // Update the selected contribution if in modal
        if (
          selectedContribution &&
          selectedContribution._id === contribution._id
        ) {
          setSelectedContribution(response.data.contribution);
        }

        alert("Contribution retry initiated");
      }
    } catch (err) {
      console.error("Error performing contribution action:", err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Contributions Dashboard</h1>

      {/* Filters and search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status Filter
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chain Filter
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <form onSubmit={handleSearchSubmit} className="flex">
            <input
              type="text"
              className="flex-grow p-2 border border-gray-300 rounded-l"
              placeholder="Search by address, tx hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading contributions...</p>
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
            <div className="text-sm text-gray-600">
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
                className="px-4 py-2 border rounded bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={
                  pagination.skip + pagination.limit >= pagination.total
                }
                className="px-4 py-2 border rounded bg-gray-100 disabled:opacity-50"
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
  );
};

export default ContributionsDashboard;
