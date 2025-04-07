import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.login(password);
      // Use window.location for a full page reload to ensure state is reset
      window.location.href = "/admin/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.error || error.message || "Invalid credentials"
      );
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
              XDCAI Admin Portal
            </h2>

            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label
                  className="block text-[#aaaaaa] text-sm mb-2"
                  htmlFor="password"
                >
                  Admin Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full p-4 bg-[#111111] border border-[#333333] rounded-md text-white"
                  required
                />
              </div>

              {error && (
                <div className="mb-6 p-3 bg-[#ff4c4c]/20 border border-[#ff4c4c] rounded-md text-[#ff4c4c]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className={`w-full py-4 rounded-md font-bold text-black ${
                  isLoading || !password
                    ? "bg-[#118C4F] cursor-not-allowed"
                    : "bg-[#00FA73] hover:bg-[#00E066] cursor-pointer"
                }`}
              >
                {isLoading ? "Logging in..." : "Login"}
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
