// src/components/admin/AdminLogin.jsx
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
      navigate("/admin/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="bg-dark-light border border-dark-lighter rounded-widget shadow-widget p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          XDCAI Admin Portal
        </h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              className="block text-gray-light text-sm mb-2"
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
              className="w-full p-3 bg-dark border border-dark-lighter rounded-md text-white"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-accent-red bg-opacity-20 border border-accent-red rounded-md text-accent-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className={`w-full py-3 rounded-md font-bold text-dark ${
              isLoading || !password
                ? "bg-gray-dark cursor-not-allowed"
                : "bg-primary hover:bg-primary-light cursor-pointer"
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-primary hover:text-primary-light text-sm">
            Return to Main Site
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
