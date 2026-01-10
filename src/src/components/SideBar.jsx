import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import {
  Menu,
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  UserCog,
  Users,
  Brain,
  BookOpen,
  Wind,
  Eye,
  ClipboardList,
  Glasses,
  ChevronRight,
  LogOut,
  X
} from "lucide-react";

function SideBar() {
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [username, setUsername] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      const u = saved ? JSON.parse(saved) : null;
      return u ? (u.username || u.full_name || "User") : "User";
    } catch (e) { return "User"; }
  });
  const [role, setRole] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? (JSON.parse(saved).role || "student") : "student";
    } catch (e) { return "student"; }
  });
  const navigate = useNavigate();

  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.username || data.full_name) {
            const name = data.username || data.full_name;
            setUsername(name.trim());
          }
          if (data.role) {
            setRole(data.role);
          }
          if (data.profile_picture) {
            setProfilePicture(data.profile_picture);
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };

    fetchProfile();

    // Listen for updates from Profile component
    window.addEventListener('userProfileUpdate', fetchProfile);

    return () => {
      window.removeEventListener('userProfileUpdate', fetchProfile);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed", error);
      navigate("/signin");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f131c] text-white overflow-x-hidden font-sans">

      {/* FIXED TOGGLE BUTTON - Stays in place, does not shift */}
      <div className= {`
        ${open? '':'w-20 bg-black/30 transition-transform duration-300 ease-out' }
        `} >
        <button
          onClick={() => setOpen(!open)}
          className="fixed top-6 left-6 z-50 p-1.5 text-white/60 backdrop-blur-sm bg-black/40 border rounded-md hover:text-white transition-all duration-300"
        >
          <Menu size={18} />
        </button>

      </div>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-40
          bg-[#0e1116]
          transition-[width] duration-500 ease-in-out
          ${open ? "w-64" : "w-0"}
          overflow-hidden
          border-r border-white/5
        `}
      >
        {/* Fixed Width Inner Wrapper to maintain structure during slide */}
        <div className="w-64 h-full flex flex-col pt-20">

          {/* Navigation - Extremely Tight Spacing */}
          <nav className="flex-1 space-y-4 text-sm px-4 custom-scrollbar overflow-y-auto">

            {/* Show Dashboard for all */}
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase text-white/20 font-bold tracking-[0.2em] px-3 mb-1">
                {(['teacher', 'mentor'].includes(role.toLowerCase())) ? "Mentor" :
                  (['counsellor', 'counselor'].includes(role.toLowerCase())) ? "Counsellor" : "General"}
              </div>
              <NavItem
                icon={LayoutDashboard}
                label={
                  ['teacher', 'mentor'].includes(role.toLowerCase()) ? "Mentor Panel" :
                    ['counsellor', 'counselor'].includes(role.toLowerCase()) ? "Counsellor Panel" :
                      "Dashboard"
                }
                href={
                  ['teacher', 'mentor'].includes(role.toLowerCase()) ? "mentor" :
                    ['counsellor', 'counselor'].includes(role.toLowerCase()) ? "counselor-dashboard" :
                      "dashboard"
                }
              />
              {/* Only show these for students */}
              {role.toLowerCase() === 'student' && (
                <>
                  <NavItem icon={MessageSquare} label="AI Dost" href="chat" />
                  <NavItem icon={CheckSquare} label="Tasks" href="tasks-manager" />
                </>
              )}
            </div>

            {/* Only show Therapy for students */}
            {role.toLowerCase() === 'student' && (
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase text-white/20 font-bold tracking-[0.2em] px-3 mb-1">Therapy</div>
                <NavItem icon={Wind} label="Venting" href="private-venting" />
                <NavItem icon={Brain} label="Meditation" href="meditation-hub" />
              </div>
            )}

            {/* Clinical - students and counsellors only */}
            {(role.toLowerCase() === 'student' || ['counsellor', 'counselor'].includes(role.toLowerCase())) && (
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase text-white/20 font-bold tracking-[0.2em] px-3 mb-1">Clinical</div>
                {role.toLowerCase() === 'student' && (
                  <>
                    <NavItem icon={ClipboardList} label="Assessments" href="assessments" />
                    <NavItem icon={Eye} label="Inkblot" href="inkblot" />
                     <NavItem icon={UserCog} label="Consult" href="consultation" />
                  </>
                )}
               
              </div>
            )}

            {/* Only show Community for students */}
            {role.toLowerCase() === 'student' && (
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase text-white/20 font-bold tracking-[0.2em] px-3 mb-1">Community</div>
                <NavItem icon={Users} label="Hall" href="community" />
                <NavItem icon={BookOpen} label="Library" href="resources" />
              </div>
            )}
          </nav>

          {/* User Section - Compressed */}
          <div className="mt-auto px-4 pb-6 pt-3 border-t border-white/5 bg-[#0e1116]">
            <div
              onClick={() => navigate("/app/profile")}
              className="flex items-center gap-3 mb-4 px-2"
            >

              <div className="w-10 h-10 rounded-full bg-[#8e74ff] flex items-center justify-center text-white text-sm font-bold shadow-lg border border-white/10 overflow-hidden">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate leading-tight">{username}</span>
                <span className="text-[11px] text-white/40 capitalize tracking-tight">{role}</span>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2
               hover:bg-white/5 text-white/80 text-[11px] font-bold uppercase tracking-widest
               py-2.5 rounded-xl transition-all duration-300 border border-white/40 group"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className={`
    flex-1 transition-[margin] duration-500 ease-in-out
    ${open ? "ml-64" : "ml-0"}
    min-h-screen
  `}
      >

        <Outlet />

      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a1f2e] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Confirm Logout</h3>
            <p className="text-white/50 text-center mb-8">Are you sure you want to exit? You will need to sign in again to access your dashboard.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-medium transition-colors"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon: Icon, label, href }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/app/${href}`)}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-all duration-300 group"
    >
      <Icon size={20} className="text-white/30 group-hover:text-white transition-colors duration-300" />
      <span className="text-[15px] text-white/50 group-hover:text-white font-medium transition-all duration-300">{label}</span>
      <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-white/20" />
    </button>
  );
}

export default SideBar;