import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    login_streak: 0,
    username: "",
    full_name: "",
    meditation_streak: 0,
    tasks: { completed: 0, total: 0, progress: 0 },
    meditation_minutes: 0,
    consultations: [],
    recent_meditation_logs: []
  });
  const [ignite, setIgnite] = useState(false);
  const [moodIndex, setMoodIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const[mood,setMood]=useState();
  const moods = ["😔", "🙂", "😄", "🤩"];
  const moodLabels = ["Low", "Okay", "Happy", "Great"];
  localStorage.setItem("mood",mood);
  
  useEffect(() => {
    // Check onboarding status for students
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role === 'student' && !user.is_onboarded) {
      navigate("/start-journey");
      return;
    }

    // Fire ignites on page refresh
    setTimeout(() => setIgnite(true), 300);

    // Quick Hydration from LocalStorage
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
        meditation_minutes: dash.total_minutes_meditated || 0
      });
      setLoading(false);
    }
    
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          let username = data.username || "";
          let full_name = data.full_name || "";

          // No fallback needed if data is provided in dashboard itself

          setStats({
            login_streak: data.login_streak || 0,
            username: username,
            full_name: full_name,
            meditation_streak: data.meditation_streak || 0,
            tasks: data.tasks || { completed: 0, total: 0, progress: 0 },
            meditation_minutes: data.total_minutes_meditated || 0,
            consultations: data.consultations || [],
            recent_meditation_logs: data.recent_meditation_logs || []
          });

          // Persistent Cache: Save for next instant-load
          localStorage.setItem("initial_dash", JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f131c] to-[#141923] p-8 text-white">
        <h1 className="text-3xl font-semibold mb-8 tracking-wide">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f131c] to-[#141923] p-8 text-white">
      <h1 className="text-3xl font-semibold mb-8 tracking-wide">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SET MOOD */}
        <Card>
          <h3 className="card-title">Set Mood</h3>

          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={() => setMoodIndex((moodIndex - 1 + moods.length) % moods.length)}
              className="text-2xl text-white/40 hover:text-white transition"
            >
              ‹
            </button>

            <div className="text-center">
              <div onClick={() => setMood(moodLabels[moodIndex])} className="text-6xl mb-2 cursor-pointer">{moods[moodIndex]}</div>
              <p className="text-white/70">{moodLabels[moodIndex]}</p>
            </div>

            <button
              onClick={() => setMoodIndex((moodIndex + 1) % moods.length)}
              className="text-2xl text-white/40 hover:text-white transition"
            >
              ›
            </button>
          </div>

          <p className="text-xs text-white/50 text-center mt-4">
            Click emoji to set your current mood
          </p>
        </Card>

        {/* LOGIN STREAK */}
        <Card>
          <h3 className="card-title">Login Streak</h3>

          <div className="relative flex items-center justify-center mt-6">
            <div
              className={`text-6xl transition-all duration-700 ${ignite ? "animate-flame" : "opacity-0 scale-50"
                }`}
            >
              🔥
            </div>
          </div>

          <p className="text-center text-xl font-semibold mt-3">
            {stats.login_streak} days
          </p>

          <p className="text-xs text-white/50 text-center mt-1">
            Keep the fire alive
          </p>
        </Card>

        {/* DAILY INSPIRATION */}
        <Card>
          <h3 className="card-title">Daily Inspiration</h3>

          <p className="text-white/80 text-sm leading-relaxed mt-4">
            Every experience of the past year — pleasant or unpleasant —
            has shaped you into someone wiser and stronger.
            Step forward knowing you are here to give back.
          </p>

          <p className="text-xs text-white/40 mt-4 text-right">
            — by you
          </p>
        </Card>

        {/* RECENT MEDITATION LOGS */}
        <Card>
          <h3 className="card-title">Recent Mindfulness</h3>
          <div className="mt-4 space-y-3">
            {stats.recent_meditation_logs && stats.recent_meditation_logs.length > 0 ? (
              stats.recent_meditation_logs.map((log, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <div>
                    <p className="text-white/90 capitalize">{log.type.replace('_', ' ')}</p>
                    <p className="text-xs text-white/50">{log.date}</p>
                  </div>
                  <span className="text-indigo-300">{Math.floor(log.duration / 60)}m {log.duration % 60}s</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40 italic">No recent sessions.</p>
            )}
          </div>
          <div className="mt-4 pt-2 border-t border-white/10 flex justify-between text-xs text-white/60">
            <span>Total Time</span>
            <span>{stats.meditation_minutes} min</span>
          </div>
        </Card>

        {/* TASK COMPLETION */}
        <Card>
          <h3 className="card-title">Task Completion</h3>

          <div className="flex items-center justify-center mt-8">
            <div className="relative w-24 h-24 rounded-full border-4 border-indigo-500/30">
              <div
                className="absolute inset-2 rounded-full border-4 border-indigo-500"
                style={{ clipPath: `polygon(50% 0%, 100% 0%, 100% ${stats.tasks.progress}%, 50% 100%)` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                {Math.round(stats.tasks.progress)}%
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-white/70 mt-4">
            {stats.tasks.completed}/{stats.tasks.total} completed
          </p>
        </Card>

        {/* UPCOMING SCHEDULE (Consultations) */}
        <Card>
          <h3 className="card-title">Upcoming Schedule</h3>

          <div className="mt-4 space-y-4">
            {stats.consultations && stats.consultations.length > 0 ? (
              stats.consultations.map((consult, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-300/30 flex items-center justify-center text-xs">
                      🩺
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{consult.counsellor_name}</p>
                      <p className="text-white/60 text-xs">
                        {new Date(consult.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <ActionBtn>Join</ActionBtn>
                    <ActionBtn danger>Reschedule</ActionBtn>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-white/50 text-sm">No upcoming sessions.</p>
                <button className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline">Book a session</button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function Card({ children }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-white/10 pb-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ActionBtn({ children, danger }) {
  return (
    <button
      className={`flex-1 py-2 rounded-lg text-sm transition ${danger
        ? "bg-red-500/80 hover:bg-red-500"
        : "bg-indigo-500/80 hover:bg-indigo-500"
        }`}
    >
      {children}
    </button>
  );
}
