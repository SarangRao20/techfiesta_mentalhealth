import React, { useState } from "react";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sign in:", formData);
  };

  return (
    <div className="bg-gradient-to-b from-[#0E1116] to-[#141923] font-sans min-h-screen text-white relative overflow-hidden flex items-center justify-center">

      {/* Slim Glass Card */}
      <div className="w-full max-w-lg md:max-w-md rounded-2xl border border-white/10 bg-[#0f1320]/60 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-1">
            Sign in to continue your NirVana journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg bg-[#0E1116] border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
              placeholder="you@example.com"
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

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 text-gray-400 bg-[#0f1320]/60">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button className="py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm">
            Google
          </button>
          <button className="py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm">
            GitHub
          </button>
        </div>

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
