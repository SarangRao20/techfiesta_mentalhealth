import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_URL } from "../config";

export default function Dashboard() {
  const [stats, setStats] = useState({
    login_streak: 0,
    username: "",
    full_name: "",
    meditation_streak: 0,
    tasks: { completed: 0, total: 0, progress: 0 },
    meditation_minutes: 0,
    consultations: [],
    recent_meditation_logs: [],
    profile_picture: ""
  });
  const [ignite, setIgnite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCrisisMenu, setShowCrisisMenu] = useState(false);

  useEffect(() => {
    setTimeout(() => setIgnite(true), 300);

    const cachedDash = localStorage.getItem("initial_dash");
    const cachedUser = localStorage.getItem("user");
    if (cachedDash) {
      const dash = JSON.parse(cachedDash);
      const user = cachedUser ? JSON.parse(cachedUser) : {};
      setStats({
        ...stats,
        ...dash,
        username: user.username || dash.username,
        full_name: user.full_name || dash.full_name,
        meditation_minutes: dash.total_minutes_meditated || 0,
        profile_picture: user.profile_picture || dash.profile_picture || ""
      });
      setLoading(false);
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const response = await fetch(`${API_URL}/api/dashboard`, {
          credentials: 'include'
        });

        let profilePic = "";
        let dashData = {};

        if (response.ok) {
          dashData = await response.json();
          profilePic = dashData.profile_picture || "";
          localStorage.setItem("initial_dash", JSON.stringify(dashData));
        }

        // If profile pic is missing, or just to be safe, fetch user info
        const userRes = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.profile_picture) profilePic = userData.profile_picture;
          localStorage.setItem("user", JSON.stringify(userData));
        }

        setStats({
          login_streak: dashData.login_streak || 0,
          username: dashData.username || "",
          full_name: dashData.full_name || "",
          meditation_streak: dashData.meditation_streak || 0,
          tasks: dashData.tasks || { completed: 0, total: 0, progress: 0 },
          meditation_minutes: dashData.total_minutes_meditated || 0,
          consultations: dashData.consultations || [],
          recent_meditation_logs: dashData.recent_meditation_logs || [],
          profile_picture: profilePic
        });

      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Listen for profile updates from other components
    const handleProfileUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('userProfileUpdate', handleProfileUpdate);

    return () => {
      window.removeEventListener('userProfileUpdate', handleProfileUpdate);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f131c] p-8 text-white">
        <div className="h-24 w-full bg-white/5 animate-pulse rounded-2xl mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="lg:row-span-2 h-full bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="lg:col-span-2 h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 text-white relative font-sans">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl ml-8 font-bold tracking-tight text-white">
            {getGreeting()}, {stats.username || "Friend"}
          </h1>
          <p className="text-white/50 mt-1.5  ml-9 text-base font-normal">
            Your progress overview for today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white/80">{formatDate()}</p>
          </div>
          <Link to="/app/profile" className="w-12 h-12 rounded-full bg-gradient-to-b from-white/10 to-white/5 border border-white/5 flex items-center justify-center text-lg shadow-sm overflow-hidden hover:opacity-80 transition">
            {stats.profile_picture ? (
              <img src={stats.profile_picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              stats.username ? stats.username[0].toUpperCase() : "U"
            )}
          </Link>
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(180px,auto)]">

        {/* RECENT ACTIVITY - Wide Card (col-span-2) */}
        <Card className="lg:col-span-2 bg-[#151a23]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="card-title">Recent Activity</h3>
            <Link to="/app/meditation-hub" className="text-xs font-medium text-white/40 hover:text-white transition-colors">View All</Link>
          </div>

          <div className="flex flex-col gap-3 h-full">
            {stats.recent_meditation_logs && stats.recent_meditation_logs.length > 0 ? (
              stats.recent_meditation_logs.slice(0, 3).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1c212c] flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 transition-colors border border-white/5">
                      {log.type.includes('breathing') ? '🌬️' : '🧘'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90 capitalize">{log.type.replace('_', ' ')}</p>
                      <p className="text-xs text-white/40">{log.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-1 rounded-md">{Math.floor(log.duration / 60)}m</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
                <span className="text-2xl mb-2 opacity-30">🏔️</span>
                <p className="text-sm text-white/40">No activity yet.</p>
                <Link to="/app/meditation" className="mt-3 text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-white/80 transition font-medium">Start Session</Link>
              </div>
            )}
          </div>
        </Card>

        {/* LOGIN STREAK - Standard Card (col-span-1) */}
        <Card className="lg:col-span-1 flex flex-col justify-between bg-[linear-gradient(145deg,#151a23,#12161f)]">
          <h3 className="card-title">Streak</h3>
          <div className="flex flex-col gap-1 items-start mt-2">
            <span className={`text-6xl font-bold tracking-tighter transition-all duration-1000 ${ignite ? 'text-white blur-none translate-y-0 opacity-100' : 'text-white/0 blur-xl translate-y-4 opacity-0'}`}>
              {stats.login_streak}
            </span>
            <span className="text-sm text-white/40 font-medium">days active</span>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 w-full">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40">Best Record</span>
              <span className="text-emerald-400 font-mono font-medium">{Math.max(stats.login_streak, 1)} d</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500/50 h-full w-3/4 rounded-full"></div>
            </div>
          </div>
        </Card>

        {/* QUICK ACTIONS - Tall Card (row-span-2) */}
        <Card className="lg:col-span-1 lg:row-span-2 h-full flex flex-col bg-[#151a23]">
          <h3 className="card-title mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3 flex-1">
            <QuickActionTile icon="🌬️" label="Breathe" sub="1/2 min" to="/app/meditation" state={{ autoStartId: 1 }} delay="0" />
            <QuickActionTile icon="🔒" label="Venting Hall" sub="Private Space" to="/app/private-venting" delay="100" />
            <QuickActionTile icon="💬" label="Community" sub="Realtime Chat" to="/app/community" delay="200" />
            <QuickActionTile icon="📝" label="Assess" sub="Check-in" to="/app/assessments" delay="300" />
            <div className="mt-auto pt-4 border-t border-white/5">
              <button
                onClick={() => setShowCrisisMenu(!showCrisisMenu)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition group cursor-pointer"
              >
                <span className="text-sm font-semibold text-red-400">SOS Support</span>
                <span className="text-red-400 group-hover:translate-x-1 transition">→</span>
              </button>
            </div>
          </div>
        </Card>

        {/* SCHEDULE - Wide Card (col-span-2) */}
        <Card className="lg:col-span-2 bg-[#151a23]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="card-title">Schedule</h3>
            {stats.consultations?.length > 0 && <span className="text-xs bg-white/5 px-2 py-1 rounded text-white/50">{stats.consultations.length} upcoming</span>}
          </div>

          <div className="space-y-3">
            {stats.consultations && stats.consultations.length > 0 ? (
              stats.consultations.slice(0, 2).map((consult, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#1c212c] rounded-lg border border-white/5">
                    <span className="text-xs font-bold text-white/90">{new Date(consult.date).getDate()}</span>
                    <span className="text-[10px] uppercase text-white/30">{new Date(consult.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate">{consult.counsellor_name}</p>
                    <p className="text-xs text-white/40 truncate">Video Consultation • {new Date(consult.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {consult.meeting_link ? (
                    <a
                      href={consult.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition shadow-lg shadow-indigo-500/20"
                    >
                      Join
                    </a>
                  ) : (
                    <button disabled className="px-4 py-2 bg-white/5 text-white/30 text-xs font-medium rounded-lg cursor-not-allowed border border-white/5">
                      Waiting for Link
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-white/40 mb-3">No upcoming sessions.</p>
                <Link to="/app/consultation" className="text-xs border border-white/10 hover:border-white/30 hover:bg-white/5 px-3 py-1.5 rounded-lg text-white/70 transition">Schedule Now</Link>
              </div>
            )}
          </div>
        </Card>

        {/* WEEKLY GOALS - Standard Card (col-span-1) */}
        <Card className="lg:col-span-1 bg-[#151a23]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="card-title">Goals</h3>
            <span className="text-[10px] font-mono text-emerald-400/80">+12%</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 relative">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-white/[0.03]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path className="text-indigo-400" strokeDasharray={`${Math.max(stats.tasks.progress, 5)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{Math.round(stats.tasks.progress)}%</span>
              <span className="text-[10px] uppercase tracking-wider text-white/30">Completed</span>
            </div>
          </div>
        </Card>

      </div>

      {/* CRISIS MENU OVERLAY (If needed, separate from Quick Actions or redundant) */}
      {/* Kept minimal as integrated in Quick Actions card now, but kept absolute logic if user needs global access */}
      {showCrisisMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCrisisMenu(false)}>
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Emergency Support</h3>
            <div className="space-y-3">
              <button onClick={() => window.location.href = 'tel:14416'} className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-left transition">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-bold text-red-400">Helpline: 14416</p>
                  <p className="text-xs text-red-400/60">24/7 Crisis Support</p>
                </div>
              </button>
              <button onClick={() => window.location.href = '/app/chat'} className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-bold text-white">Chat Support</p>
                  <p className="text-xs text-white/50">Talk to a counselor</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowCrisisMenu(false)} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/60 transition">Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.02em;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

/* ---------- Components ---------- */

function Card({ children, className = "" }) {
  return (
    <div className={`border border-white/5 rounded-3xl p-6 shadow-2xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

function QuickActionTile({ icon, label, sub, to, delay, state }) {
  return (
    <Link
      to={to}
      state={state}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/10 border border-transparent transition-all duration-300 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-xl bg-[#1c212c] flex items-center justify-center text-xl group-hover:scale-110 transition duration-300 border border-white/5 shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white/90 group-hover:text-white">{label}</p>
        <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{sub}</p>
      </div>
      <span className="text-white/20 group-hover:translate-x-1 transition text-sm">→</span>
    </Link>
  );
}