import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Menu,
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  UserCog,
  Users,
  Clock,
} from "lucide-react";

function SideBar() {
  const [open, setOpen] = useState(true);

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
        <div className="flex flex-col h-full px-4 py-12">
          {/* Main Nav */}
          <nav className="mt-6 space-y-2 text-sm">
            <NavItem icon={LayoutDashboard} label="Dashboard" href="dashboard" />
            <NavItem icon={MessageSquare} label="Chat" href="chat" />
            <NavItem icon={CheckSquare} label="Tasks Manager" href="tasks-manager" />
            <NavItem icon={UserCog} label="Consultation" href="consultation" />
            <NavItem icon={Users} label="Community" href="community" />
          </nav>

          {/* Divider */}
          <div className="mt-6 border-t border-white/10" />

          {/* Chat History */}
          <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
            <Clock size={16} />
            <span>Recent Chats</span>
          </div>

          <div className="mt-2 space-y-1 text-sm text-white/70 overflow-y-auto">
            <ChatItem sessionId={10} label="Chat interface with file upload" />
            <ChatItem sessionId={11} label="Compliance automation tool" />
            <ChatItem sessionId={12} label="Login page design" />
            <ChatItem sessionId={13} label="React personalization config" />
            <ChatItem sessionId={14} label="Dynamic UI Chat" />
          </div>

          {/* User Section (BOTTOM) */}
<div className="mt-auto pt-4 border-t border-white/10">
  <div className="flex items-center gap-3 mb-3">
    {/* Avatar */}
    <div className="w-10 h-10 rounded-full bg-purple-300/30 flex items-center justify-center">
      <span className="text-lg">👤</span>
    </div>

    {/* Username */}
    <span className="text-sm font-medium text-white">
      Username
    </span>
  </div>

  {/* Logout */}
  <button
    onClick={() => {
      // TODO: logout logic
      console.log("logout");
    }}
    className="w-full flex items-center justify-center gap-2
               bg-red-600 hover:bg-red-700
               text-white text-sm
               py-2 rounded-lg transition"
  >
    Logout
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

/* -------------------- */

function NavItem({ icon: Icon, label, href }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/app/${href}`)}
      className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-white/5 transition"
    >
      <Icon size={18} className="text-white/70" />
      <span>{label}</span>
    </button>
  );
}

function ChatItem({ label, sessionId }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/app/chat/${sessionId}`)}
      className="w-full text-left px-2 py-1 rounded-md hover:bg-white/5 truncate"
    >
      {label}
    </button>
  );
}

export default SideBar;
