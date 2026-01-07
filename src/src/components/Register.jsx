import { API_URL } from "../config";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { role: "student" },
  });

  const role = watch("role");
  const [orgs, setOrgs] = useState([]);
  const [isOtherOrg, setIsOtherOrg] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/organizations`)
      .then((res) => res.json())
      .then((data) => setOrgs(data))
      .catch((err) => console.error("Failed to fetch orgs", err));
  }, []);

  const handleOrgChange = (e) => {
    const val = e.target.value;
    if (val === "other") {
      setIsOtherOrg(true);
      setValue("organization_id", null);
    } else {
      setIsOtherOrg(false);
      setValue("organization_id", val);
    }
  };

  const onSubmit = async (data) => {
    const send = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (send.ok) {
      navigate("/start-journey");
    } else {
      const errorData = await send.json();
      alert(errorData.message || "Registration failed. Please try again.");
    }
  };

  const inputClass =
    "w-full rounded-lg bg-[#0E1116] border border-white/20 text-white px-3 py-1.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm";

  const selectClass =
    "w-full rounded-lg bg-[#0E1116] border border-white/20 text-white px-3 py-1.5 appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm bg-[url('data:image/svg+xml;utf8,<svg fill=\\\"white\\\" height=\\\"20\\\" viewBox=\\\"0 0 24 24\\\" width=\\\"20\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"><path d=\\\"M7 10l5 5 5-5z\\\"/></svg>')] bg-no-repeat bg-[right_0.8rem_center]";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E1116] to-[#141923] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0f1320]/60 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">

        {/* Header */}
        <div className="border-b border-white/10 text-center py-4">
          <h3 className="text-xl font-semibold text-white tracking-wide">
            Create Your Account
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Join NiVana and begin your journey
          </p>
        </div>

        {/* Body */}
        <div className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

            {/* Name + Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Full Name
                </label>
                <input {...register("full_name", { required: true })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Username
                </label>
                <input {...register("username", { required: true })} className={inputClass} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Email
              </label>
              <input type="email" {...register("email", { required: true })} className={inputClass} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Password
              </label>
              <input type="password" {...register("password", { required: true })} className={inputClass} />
            </div>

            {/* Role + Student ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Role
                </label>
                <select {...register("role")} className={selectClass}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher / Mentor</option>
                  <option value="counsellor">Counsellor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {role === "student" && (
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Student ID
                  </label>
                  <input {...register("student_id")} className={inputClass} />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Encrypted for privacy
                  </p>
                </div>
              )}
              {(role === "student" || role === "teacher") && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    Organization
                  </label>
                  <select
                    className={selectClass}
                    onChange={handleOrgChange}
                    defaultValue=""
                    required={role === "student"}
                  >
                    <option value="" disabled>Select Organization</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                    {role === "teacher" && <option value="other">+ Add New Organization</option>}
                  </select>
                </div>
              )}

              {isOtherOrg && role === "teacher" && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-300 mb-1">
                    New Organization Name
                  </label>
                  <input {...register("new_organization_name", { required: true })} className={inputClass} placeholder="Enter organization name" />
                </div>
              )}


            </div>

            {/* Accommodation */}
            {role === "student" && (
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Accommodation Type
                </label>
                <select {...register("accommodation_type")} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="hostel">Hostel</option>
                  <option value="local">Local</option>
                </select>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-3 bg-gradient-to-r from-purple-600 to-purple-500 
              hover:from-purple-500 hover:to-purple-400 text-white py-2 
              rounded-xl font-semibold tracking-wide transition 
              shadow-lg shadow-purple-700/40 hover:shadow-purple-500/60
              hover:scale-[1.01] active:scale-[0.99] text-sm"
            >
              Create Account
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-gray-300 mt-4 text-xs">
            Already have an account?{" "}
            <a href="/signin" className="text-purple-400 hover:underline">
              Login here
            </a>
          </div>

          <div className="mt-3 text-gray-400 text-xs rounded-lg p-2 border border-white/10 bg-white/5">
            🔐 Your information is securely encrypted.
          </div>
        </div>
      </div>
    </div>
  );
}
