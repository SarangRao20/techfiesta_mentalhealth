import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    //get chat sessions' messages from db, using useEffect and display them in ChatItem components by mapping through the sessions array
    return (
        <>
            {/* Hamburger */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed top-4 left-4 z-50 p-2 rounded-md bg-black/30 hover:bg-black text-white"
            >
                <Menu size={18} />
            </button>

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-screen
          bg-[#0e1116] text-white
          transition-all duration-300 ease-in-out
          ${open ? "w-72" : "w-0"}
          overflow-hidden
          border-r border-white/10
        `}
            >
                <div className="flex flex-col  h-full px-4 py-12">


                    {/* Main Nav */}
                    <nav className="mt-6 space-y-2 text-sm">
                        <NavItem icon={LayoutDashboard} label="Dashboard" />
                        <NavItem icon={MessageSquare} label="Chat" />
                        <NavItem icon={CheckSquare} label="Tasks Manager" />
                        <NavItem icon={UserCog} label="Consultation" />
                        <NavItem icon={Users} label="Community" />
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

                    {/* Bottom spacing */}
                    <div className="mt-auto" />
                </div>
            </aside>
        </>
    );
}

function NavItem({ icon: Icon, label }) {
    return (
        <button className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-white/5 transition">
            <Icon size={18} className="text-white/70" />
            <span>{label}</span>
        </button>
    );
}

function ChatItem({ label, sessionId }) {
    const navigate = useNavigate();
    return (
        <button onClick={() => { navigate(`/app/chat/${sessionId}`) }} className="w-full text-left px-2 py-1 rounded-md hover:bg-white/5 truncate">
            {label}
        </button>
    );
}

export default SideBar;
