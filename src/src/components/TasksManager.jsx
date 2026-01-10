import { useState, useMemo, useEffect, useRef } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { API_URL } from "../config";

const COLORS = ["#F19340", "#2a2f3a"];

// Simple Icons
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

// --- Time Picker Component ---
const TimeSelect = ({ label, value, onChange, placeholder = "Select time" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Generate 15-min intervals
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const hour = i.toString().padStart(2, '0');
        const min = j.toString().padStart(2, '0');
        slots.push(`${hour}:${min}`);
      }
    }
    return slots;
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && value) {
      const el = document.getElementById(`time-slot-${value}`);
      el?.scrollIntoView({ block: 'center' });
    }
  }, [isOpen, value]);

  return (
    <div className="flex flex-col relative" ref={wrapperRef}>
      <label className="text-xs text-white/50 mb-1.5 pl-1">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/5 border ${isOpen ? 'border-blue-500/50 bg-white/10' : 'border-white/10'} rounded-lg px-3 py-2 text-white/90 cursor-pointer flex items-center justify-between transition-all hover:bg-white/10`}
      >
        <span className={!value ? "text-white/30" : ""}>
          {value || placeholder}
        </span>
        <ClockIcon />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-[#1A202C] border border-white/10 rounded-lg shadow-xl z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
          {timeSlots.map(time => (
            <div
              key={time}
              id={`time-slot-${time}`}
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-white/10 ${time === value ? 'bg-blue-600/20 text-blue-300 font-medium' : 'text-white/80'}`}
            >
              {time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


function TasksManager() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Calculate completion stats
  const completed = tasks.filter(t => t.done === true || t.status === 'completed').length;
  const percent = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const pieData = useMemo(
    () => [
      { name: "Done", value: completed || 0 },
      { name: "Pending", value: (tasks.length - completed) || 0 },
    ],
    [completed, tasks.length]
  );

  // Sort tasks by start time
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.start_time < b.start_time) return -1;
      if (a.start_time > b.start_time) return 1;
      return 0;
    });
  }, [tasks]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/routine`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          console.error("Tasks data is not an array:", data);
          setTasks([]);
        }
      } else {
        console.error("Failed to fetch tasks, status:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) return "Please enter a task title";
    if (!start) return "Please select a start time";
    if (!end) return "Please select an end time";
    if (end <= start) return "End time must be after start time";
    return null;
  };

  const addTask = async () => {
    setFormError(null);
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: title.trim(),
      start_time: start,
      end_time: end,
      notes: notes.trim()
    };

    try {
      const res = await fetch(`${API_URL}/api/routine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (res.ok) {
        const createdTask = await res.json();
        setTasks(prev => [...prev, createdTask]);
        // Clear form
        setTitle("");
        setStart("");
        setEnd("");
        setNotes("");
      } else {
        const errorText = await res.text();
        setFormError("Failed to save task.");
        console.error("Failed to add task:", errorText);
      }
    } catch (err) {
      console.error("Failed to add task", err);
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggle = async (id) => {
    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === id ? { ...t, done: !t.done, status: t.done ? 'pending' : 'completed' } : t
      )
    );

    try {
      const res = await fetch(`${API_URL}/api/routine/${id}/toggle`, {
        method: "POST",
        credentials: 'include'
      });

      if (!res.ok) {
        // Revert on failure
        console.error("Failed to toggle task functionality, reverting.");
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
      fetchTasks(); // sync with server
    }
  };

  const remove = async (id) => {
    // Optimistic update
    const taskBackup = tasks.find(t => t.id === id);
    setTasks(prevTasks => prevTasks.filter(t => t.id !== id));

    try {
      const res = await fetch(`${API_URL}/api/routine/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });

      if (!res.ok) {
        // Revert
        if (taskBackup) setTasks(prev => [...prev, taskBackup]);
      }
    } catch (err) {
      console.error("Failed to delete task", err);
      if (taskBackup) setTasks(prev => [...prev, taskBackup]);
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    setTitle(suggestionText);
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        Daily Routine
        {isLoading && <span className="text-xs text-white/40 font-normal ml-2">Syncing...</span>}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* 1. Completion Chart */}
        <div className="md:col-span-4 py-6 rounded-xl bg-[#141923] border border-white/10 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-sm font-medium text-white/70 mb-2 z-10">
            Completion Status
          </p>
          <div className="relative z-10">
            <PieChart width={160} height={160}>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={75}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{percent}%</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/50 z-10">
            {completed}/{tasks.length} Done
          </div>
        </div>

        {/* 2. Suggestions */}
        <div className="md:col-span-8 p-6 rounded-xl bg-[#141923] border border-white/10 shadow-lg">
          <h3 className="text-sm font-medium text-white/70 mb-4">
            Quick Suggestions
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              "Morning Meditation (15 min)",
              "Evening Walk",
              "Read a book",
              "Work Session",
              "Journaling",
              "Digital Detox"
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-sm text-white/80 transition-all active:scale-95"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Add Task Form */}
        <div className="md:col-span-6 p-6 rounded-xl bg-[#141923] border border-white/10 shadow-lg overflow-visible z-20">
          <h3 className="text-sm font-medium text-white/70 mb-4">
            Create New Task
          </h3>

          <div className="space-y-4">
            <div>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                placeholder="What needs to be done?"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TimeSelect
                label="Start Time"
                value={start}
                onChange={setStart}
                placeholder="00:00"
              />
              <TimeSelect
                label="End Time"
                value={end}
                onChange={setEnd}
                placeholder="00:00"
              />
            </div>

            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 resize-none focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
              placeholder="Add notes (optional)..."
              rows="2"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            {formError && (
              <div className="text-red-400 text-xs px-1 py-1 animate-pulse">
                {formError}
              </div>
            )}

            <button
              onClick={addTask}
              disabled={isSubmitting}
              className={`w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSubmitting ? 'Adding...' : 'Add to Schedule'}
            </button>
          </div>
        </div>

        {/* 4. Task List */}
        <div className="md:col-span-6 p-6 rounded-xl bg-[#141923] border border-white/10 shadow-lg flex flex-col max-h-[500px] z-10">
          <h3 className="text-sm font-medium text-white/70 mb-4 flex justify-between items-center">
            <span>Today's Schedule</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-white/10 text-white/50">{tasks.length} items</span>
          </h3>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {sortedTasks.length > 0 ? (
              sortedTasks.map(t => {
                const isCompleted = t.done === true || t.status === 'completed';

                return (
                  <div
                    key={t.id}
                    className={`group flex items-start justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all ${isCompleted ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggle(t.id)}
                        className={`mt-1 flex-shrink-0 w-5 h-5 rounded border ${isCompleted ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/30 hover:border-white/60'} flex items-center justify-center transition-colors`}
                      >
                        {isCompleted && <CheckIcon />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${isCompleted ? 'line-through text-white/40' : 'text-white/90'}`}>
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 whitespace-nowrap">
                            {t.start_time} - {t.end_time}
                          </span>
                        </div>
                        {t.notes && (
                          <p className="mt-1.5 text-xs text-white/40 line-clamp-2 leading-relaxed">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => remove(t.id)}
                      className="ml-2 p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-white/30">
                <p className="text-sm">No tasks for today</p>
                <p className="text-xs mt-1">Add one to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TasksManager;