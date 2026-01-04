import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/app/dashboard");
      } else {
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#0E1116] to-[#141923] font-sans min-h-screen text-white relative overflow-hidden flex items-center justify-center">

      {/* Slim Glass Card */}
      <div className="w-full max-w-lg md:max-w-md rounded-2xl border border-white/10 bg-[#0f1320]/60 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-1">
            Sign in to continue your NiVana journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-lg bg-[#0E1116] border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg bg-[#0E1116] border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 text-gray-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
              />
              Remember me
            </label>
            <a href="#" className="text-purple-400 hover:text-purple-300">
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
              hover:from-purple-500 hover:to-purple-400 text-white py-3 
              rounded-xl font-semibold tracking-wide transition 
              shadow-lg shadow-purple-700/40 hover:shadow-purple-500/60
              hover:scale-[1.01] active:scale-[0.99] text-sm"
            >
              Sign In
            </button>
          </div>
        </form>

        {/* Wrapper for social login removed */}

        {/* Signup */}
        <p className="text-center text-gray-400 text-xs mt-2">
          Don’t have an account?{" "}
          <a href="/register" className="text-purple-400 hover:text-purple-300">
            Create one now
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
