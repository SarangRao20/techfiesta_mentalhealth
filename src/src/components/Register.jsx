import { useEffect } from "react";
import { useForm } from "react-hook-form";
import download from "../assets/download.png";
import { useNavigate } from "react-router-dom";
export default function Register() {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { role: "student" },
  });

  const role = watch("role");

  const onSubmit = async (data) => {
    const send = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    console.log(data)
    if (send.ok) {
      alert("Registration successful! Please log in.");
      navigate("/login");
    } else {
      alert("Registration failed. Please try again.");
    }
  };
  // #0E1116   (Primary background)
  // #141923 
  return (
    <div className="min-h-screen  flex flex-col items-center justify-center px-4 py-5">
      <div className="w-full bg-white shadow-lg max-w-xl rounded-xl border-white/60 border-1 overflow-hidden">

        {/* Header */}
        <div className="  text-black border-b-2 text-center py-4">
          <h3 className="text-xl  font-semibold flex items-center justify-center gap-2">
            <i className="fas fa-user-plus" />
            Join Us Today!
          </h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

            {/* Name + Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm  text-black font-medium mb-1">
                  <i className="fas fa-id-card  mr-1" />
                  Full Name
                </label>
                <input
                  {...register("full_name", { required: true })}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2  "
                />
              </div>

              <div>
                <label className="block text-sm   text-black font-medium mb-1">
                  <i className="fas fa-user    mr-1" />
                  Username
                </label>
                <input
                  {...register("username", { required: true })}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2  "
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm   text-black font-medium mb-1">
                <i className="fas fa-envelope    mr-1" />
                Email
              </label>
              <input
                type="email"
                {...register("email", { required: true })}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2  "
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm   text-black font-medium mb-1">
                <i className="fas fa-lock    mr-1" />
                Password
              </label>
              <input
                type="password"
                {...register("password", { required: true })}
                className="w-full rounded-md border px-3 py-2 bg-blue-50 focus:outline-none focus:ring-2  "
              />
            </div>

            {/* Role + Student ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm  text-black font-medium mb-1">
                  <i className="fas fa-users    mr-1" />
                  Role
                </label>
                <select
                  {...register("role")}
                  className="w-full rounded-md border px-3 py-2 text-black focus:outline-none focus:ring-2  "
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher/Mentor</option>
                  <option value="counsellor">Counsellor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {role === "student" && (
                <div>
                  <label className="block text-sm   text-black font-medium mb-1">
                    <i className="fas fa-id-badge    mr-1" />
                    Student ID
                  </label>
                  <input
                    {...register("student_id")}
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2  "
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Will be encrypted for privacy
                  </p>
                </div>
              )}
            </div>

            {/* Accommodation */}
            {role === "student" && (
              <div>
                <label className="block text-sm font-medium mb-1  text-black">
                  <i className="fas fa-home    mr-1" />
                  Accommodation Type
                </label>
                <select
                  {...register("accommodation_type")}
                  className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2  "
                >
                  <option value="">Select...</option>
                  <option value="hostel">Hostel</option>
                  <option value="local">Local</option>
                </select>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-200 text-black/60 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <i className="fas fa-user-plus" />
              Create Account
            </button>
          </form>

          {/* Footer */}
          <div className="text-center  text-black mt-4 text-sm">
            Already have an account?{" "}
            <a href="/login" className="   font-medium hover:underline">
              Login here
            </a>
          </div>

          <div className="mt-4 border-1 border-white  text-black text-sm rounded-lg p-3 flex gap-2">
            <i className="fas fa-shield-alt mt-0.5" />
            <span>
              Your personal information is encrypted and secure. Student IDs are
              hashed for privacy protection.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
