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
  Clock,
  Brain,
  BookOpen,
  Wind,
  Eye,
  ClipboardList,
  Glasses,
  ChevronDown,
  ChevronRight
} from "lucide-react";

function SideBar() {
  const [open, setOpen] = useState(true);
  const [username, setUsername] = useState("User");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user profile
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
        }
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };
    fetchProfile();
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
    <div className="flex min-h-screen bg-[#0f131c] text-white">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-black/30 hover:bg-black"
      >
        <Menu size={18} />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-40
          bg-[#0e1116]
          transition-all duration-300 ease-in-out
          ${open ? "w-72" : "w-0"}
          overflow-hidden
          border-r border-white/10
        `}
      >
        <div className="flex flex-col h-full px-4 py-12 custom-scrollbar overflow-y-auto">

          {/* Main Nav */}
          <nav className="mt-6 space-y-6 text-sm">

            {/* Group 1: General */}
            <div className="space-y-1">
              <div className="text-xs uppercase text-white/40 font-semibold tracking-wider px-2 mb-2">General</div>
              <NavItem icon={LayoutDashboard} label="Dashboard" href="dashboard" />
              <NavItem icon={MessageSquare} label="AI Companion" href="chat" />
              <NavItem icon={CheckSquare} label="Tasks & Goals" href="tasks-manager" />
            </div>

            {/* Group 2: Immersion & Therapy */}
            <div className="space-y-1">
              <div className="text-xs uppercase text-white/40 font-semibold tracking-wider px-2 mb-2">Immersive Therapy</div>
              <NavItem icon={Wind} label="Private Venting" href="private-venting" />
              <NavItem icon={Brain} label="Meditation" href="meditation" />
              <NavItem icon={Glasses} label="VR Space" href="vr-meditation" />
              <NavItem icon={Wind} label="AR Breathing" href="ar-breathing" />
            </div>

            {/* Group 3: Clinical & Support */}
            <div className="space-y-1">
              <div className="text-xs uppercase text-white/40 font-semibold tracking-wider px-2 mb-2">Clinical</div>
              <NavItem icon={ClipboardList} label="Assessments" href="assessments" />
              <NavItem icon={Eye} label="Inkblot Test" href="inkblot" />
              <NavItem icon={UserCog} label="Consultation" href="consultation" />
            </div>

            {/* Group 4: Community */}
            <div className="space-y-1">
              <div className="text-xs uppercase text-white/40 font-semibold tracking-wider px-2 mb-2">Community</div>
              <NavItem icon={Users} label="Community Hall" href="community" />
              <NavItem icon={BookOpen} label="Resources Library" href="resources" />
            </div>

            {role === 'counsellor' && (
              <div className="space-y-1">
                <div className="text-xs uppercase text-white/40 font-semibold tracking-wider px-2 mb-2">Professional</div>
                <NavItem icon={UserCog} label="Counselor Dashboard" href="counselor-dashboard" />
              </div>
            )}

          </nav>

          {/* User Section */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-bold">{username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{username}</span>
                <span className="text-xs text-white/50 capitalize">{role}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2
               bg-white/5 hover:bg-red-900/40 hover:text-red-400
               text-white/70 text-sm
               py-2.5 rounded-lg transition border border-white/5"
            >
              Log Out
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${open ? "ml-72" : "ml-0"}
          p-6
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, href }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/app/${href}`)}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group"
    >
      <Icon size={18} className="text-white/50 group-hover:text-white transition-colors" />
      <span className="text-white/80 group-hover:text-white font-light group-hover:font-normal transition-all">{label}</span>
      <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-white/30" />
    </button>
  );
}

export default SideBar;
