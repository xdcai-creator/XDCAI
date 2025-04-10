import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const navigate = useNavigate();

  // Check if already authenticated or if setup is required
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        navigate("/admin/dashboard");
        return;
      }

      // Check if admin setup is required
      try {
        const { setupRequired } = await authService.checkSetupRequired();
        setSetupRequired(setupRequired);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setError("Failed to check admin status. Please try again.");
      }
    };

    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    // Basic validation
    if (!password) {
      setError("Password is required");
      return false;
    }

    // Additional validation for setup mode
    if (setupRequired) {
      if (!newPassword) {
        setError("New password is required");
        return false;
      }

      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters");
        return false;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (setupRequired) {
        // Initial setup mode - pass both passwords
        await authService.login(password, newPassword);
      } else {
        // Normal login mode
        await authService.login(password);
      }

      // Use window.location for a full page reload to ensure state is reset
      window.location.href = "/admin/dashboard";
    } catch (error) {
      console.error("Login error:", error);

      // Handle special case for initial setup
      if (error.response?.data?.needsNewPassword) {
        setSetupRequired(true);
        setError("New password required for initial setup");
      } else {
        setError(
          error.response?.data?.error || error.message || "Invalid credentials"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full px-4">
        <div className="relative rounded-lg bg-[#161616] border-2 border-[#1A1A1A] shadow-lg overflow-hidden">
          {/* Top banner */}
          <div className="text-xs text-white bg-[#425152] w-full text-center py-1">
            XDCAI Admin Portal - Secure Access
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {setupRequired ? "Admin Setup" : "XDCAI Admin Portal"}
            </h2>
            {setupRequired && (
              <div className="mb-4 p-3 bg-[#00FA73]/20 border border-[#00FA73] rounded-md text-[#00FA73]">
                Initial admin setup required. Please create your admin password.
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label
                  className="block text-[#aaaaaa] text-sm mb-2"
                  htmlFor="password"
                >
                  {setupRequired ? "Initial Admin Password" : "Admin Password"}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    setupRequired
                      ? "Enter initial password"
                      : "Enter admin password"
                  }
                  className="w-full p-4 bg-[#111111] border border-[#333333] rounded-md text-white"
                  required
                />
              </div>

              {setupRequired && (
                <>
                  <div className="mb-6">
                    <label
                      className="block text-[#aaaaaa] text-sm mb-2"
                      htmlFor="newPassword"
                    >
                      New Admin Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create new password (min 8 characters)"
                      className="w-full p-4 bg-[#111111] border border-[#333333] rounded-md text-white"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label
                      className="block text-[#aaaaaa] text-sm mb-2"
                      htmlFor="confirmPassword"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full p-4 bg-[#111111] border border-[#333333] rounded-md text-white"
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="mb-6 p-3 bg-[#ff4c4c]/20 border border-[#ff4c4c] rounded-md text-[#ff4c4c]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !password ||
                  (setupRequired && (!newPassword || !confirmPassword))
                }
                className={`w-full py-4 rounded-md font-bold text-black ${
                  isLoading ||
                  !password ||
                  (setupRequired && (!newPassword || !confirmPassword))
                    ? "bg-[#118C4F] cursor-not-allowed"
                    : "bg-[#00FA73] hover:bg-[#00E066] cursor-pointer"
                }`}
              >
                {isLoading
                  ? "Processing..."
                  : setupRequired
                  ? "Create Admin Account"
                  : "Login"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-[#00FA73] hover:text-[#00E066] text-sm"
              >
                Return to Main Site
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full text-center p-3 text-[#737373] text-sm">
            Smart Contract Is Fully Audited.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
