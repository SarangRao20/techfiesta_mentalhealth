import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    username: "",
    email: "",
    role: "student",
    student_id: "",
    accommodation_type: "",
    bio: "",
    profile_picture: null,
    organization_name: ""
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock progress data - replace with actual data from your backend
  const weeklyProgress = [
    { day: "Mon", tasks: 85, mood: 70, sessions: 60 },
    { day: "Tue", tasks: 90, mood: 80, sessions: 75 },
    { day: "Wed", tasks: 75, mood: 65, sessions: 70 },
    { day: "Thu", tasks: 95, mood: 85, sessions: 80 },
    { day: "Fri", tasks: 88, mood: 75, sessions: 85 },
    { day: "Sat", tasks: 92, mood: 90, sessions: 90 },
    { day: "Sun", tasks: 100, mood: 95, sessions: 95 }
  ];

  const overallStats = [
    { name: "Tasks", value: 89, fill: "#8b5cf6" },
    { name: "Mood", value: 80, fill: "#f59e0b" },
    { name: "Sessions", value: 79, fill: "#10b981" }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData({
          full_name: data.full_name || "",
          username: data.username || "",
          email: data.email || "",
          role: data.role || "student",
          student_id: data.student_id || "",
          accommodation_type: data.accommodation_type || "",
          bio: data.bio || "",
          profile_picture: data.profile_picture || null,
          organization_name: data.organization_name || ""
        });
        if (data.profile_picture) {
          setPreviewImage(data.profile_picture);
        }
      } else {
        console.error("Failed to fetch profile");
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();

      // Append text fields
      Object.keys(profileData).forEach(key => {
        if (key !== 'profile_picture' && profileData[key] !== null) {
          formData.append(key, profileData[key]);
        }
      });

      // Append file if selected
      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        body: formData, // No Content-Type header needed for FormData
        credentials: 'include'
      });

      if (res.ok) {
        const updated = await res.json();
        setProfileData({
          full_name: updated.full_name || "",
          username: updated.username || "",
          email: updated.email || "",
          role: updated.role || "student",
          student_id: updated.student_id || "",
          accommodation_type: updated.accommodation_type || "",
          bio: updated.bio || "",
          profile_picture: updated.profile_picture || null
        });
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    }
  };

  const inputClass = isEditing
    ? "w-full bg-[#0E1116] border border-white/20 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
    : "w-full bg-transparent text-white/80 px-3 py-2 text-sm border-none";

  const selectClass = "w-full rounded-lg bg-[#0E1116] border border-white/20 text-white px-3 py-2 appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center text-white">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1116] p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const role = profileData.role?.toLowerCase();
                if (['teacher', 'mentor'].includes(role)) {
                  navigate('/app/mentor');
                } else if (['counsellor', 'counselor'].includes(role)) {
                  navigate('/app/counselor-dashboard');
                } else {
                  navigate('/app/dashboard');
                }
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold">My Profile</h1>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile(); // Reset to original data
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition font-medium"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 transition font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Profile Card */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-xl border border-white/10 bg-[#1a1f2e] p-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-4xl font-bold overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white">
                        {profileData.full_name?.charAt(0).toUpperCase() || profileData.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer hover:bg-purple-500 transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold mt-4 text-white">
                  {profileData.full_name || "No name set"}
                </h2>
                <p className="text-white/60 text-sm">
                  @{profileData.username || "username"}
                </p>
                <span className="mt-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 text-xs capitalize">
                  {profileData.role}
                </span>
                {profileData.organization_name && (
                  <span className="mt-1 px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-semibold">
                    {profileData.organization_name}
                  </span>
                )}
              </div>

              {/* Bio */}
              <div className="mb-4">
                <label className="block text-xs text-white/60 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="w-full bg-[#0E1116] border border-white/20 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm resize-none"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-sm text-white/80">
                    {profileData.bio || "No bio added yet"}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">89%</div>
                  <div className="text-xs text-white/60 mt-1">Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">80%</div>
                  <div className="text-xs text-white/60 mt-1">Mood</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">79%</div>
                  <div className="text-xs text-white/60 mt-1">Sessions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Personal Information */}
            <div className="rounded-xl border border-white/10 bg-[#1a1f2e] p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/60 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">Role</label>
                  {isEditing ? (
                    <select
                      name="role"
                      value={profileData.role}
                      onChange={handleInputChange}
                      className={selectClass}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher / Mentor</option>
                      <option value="counsellor">Counsellor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  ) : (
                    <div className="w-full text-white/80 px-3 py-2 text-sm capitalize">
                      {profileData.role}
                    </div>
                  )}
                </div>

                {profileData.role === "student" && (
                  <>
                    <div>
                      <label className="block text-xs text-white/60 mb-2">Student ID</label>
                      <input
                        type="text"
                        name="student_id"
                        value={profileData.student_id}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/60 mb-2">Accommodation Type</label>
                      {isEditing ? (
                        <select
                          name="accommodation_type"
                          value={profileData.accommodation_type}
                          onChange={handleInputChange}
                          className={selectClass}
                        >
                          <option value="">Select...</option>
                          <option value="hostel">Hostel</option>
                          <option value="local">Local</option>
                        </select>
                      ) : (
                        <div className="w-full text-white/80 px-3 py-2 text-sm capitalize">
                          {profileData.accommodation_type || "Not specified"}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Weekly Progress Chart */}
            <div className="rounded-xl border border-white/10 bg-[#1a1f2e] p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyProgress}>
                  <XAxis
                    dataKey="day"
                    stroke="#ffffff40"
                    tick={{ fill: '#ffffff80' }}
                  />
                  <YAxis
                    stroke="#ffffff40"
                    tick={{ fill: '#ffffff80' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1f2e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                  <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                  <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
                  <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <span className="text-white/60">Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-white/60">Mood</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-white/60">Sessions</span>
                </div>
              </div>
            </div>

            {/* Overall Performance */}
            <div className="rounded-xl border border-white/10 bg-[#1a1f2e] p-6">
              <h3 className="text-lg font-semibold mb-4">Overall Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="90%"
                  barSize={15}
                  data={overallStats}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <Legend
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ color: '#fff' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1f2e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff"
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}