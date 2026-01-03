import { useEffect, useState } from "react";

export default function Dashboard() {
  const [streak, setStreak] = useState(7);
  const [ignite, setIgnite] = useState(false);
  const [moodIndex, setMoodIndex] = useState(1);

  const moods = ["😔", "🙂", "😄", "🤩"];
  const moodLabels = ["Low", "Okay", "Happy", "Great"];

  useEffect(() => {
    // Fire ignites on page refresh
    setTimeout(() => setIgnite(true), 300);
  }, []);

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
              <div className="text-6xl mb-2">{moods[moodIndex]}</div>
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
              className={`text-6xl transition-all duration-700 ${
                ignite ? "animate-flame" : "opacity-0 scale-50"
              }`}
            >
              🔥
            </div>
          </div>

          <p className="text-center text-xl font-semibold mt-3">
            {streak} days
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

        {/* MEDITATION */}
        <Card>
          <h3 className="card-title">Meditation Minutes</h3>

          <div className="space-y-2 text-sm mt-4 text-white/80">
            <Row label="Today" value="15 min" />
            <Row label="Yesterday" value="10 min" />
            <Row label="2 days ago" value="20 min" />
          </div>
        </Card>

        {/* TASK COMPLETION */}
        <Card>
          <h3 className="card-title">Task Completion</h3>

          <div className="flex items-center justify-center mt-8">
            <div className="relative w-24 h-24 rounded-full border-4 border-indigo-500/30">
              <div
                className="absolute inset-2 rounded-full border-4 border-indigo-500"
                style={{ clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)" }}
              />
            </div>
          </div>

          <p className="text-center text-sm text-white/70 mt-4">
            50% completed
          </p>
        </Card>

        {/* UPCOMING SCHEDULE */}
        <Card>
          <h3 className="card-title">Upcoming Schedule</h3>

          <div className="flex items-center gap-4 mt-4">
            <div className="w-12 h-12 rounded-full bg-purple-300/30 flex items-center justify-center">
              👤
            </div>

            <div className="text-sm">
              <p>Name: X</p>
              <p className="text-white/60">Role</p>
              <p className="text-white/60 text-xs mt-1">
                Scheduled at: 15:30
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <ActionBtn>Join</ActionBtn>
            <ActionBtn>Reschedule</ActionBtn>
            <ActionBtn danger>Delete</ActionBtn>
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
      className={`flex-1 py-2 rounded-lg text-sm transition ${
        danger
          ? "bg-red-500/80 hover:bg-red-500"
          : "bg-indigo-500/80 hover:bg-indigo-500"
      }`}
    >
      {children}
    </button>
  );
}
