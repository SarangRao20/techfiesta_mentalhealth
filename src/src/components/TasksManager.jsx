import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { API_URL } from "../config";

const COLORS = ["#F19340", "#2a2f3a"];

function TasksManager() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");

  // Calculate completion stats - fixed to check for both 'done' and 'completed' status
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
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
        setTasks([]);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      setTasks([]);
    }
  };

  const addTask = async () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }
    
    if (!start) {
      alert("Please select a start time");
      return;
    }
    
    if (!end) {
      alert("Please select an end time");
      return;
    }

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
        console.error("Failed to add task:", errorText);
        alert("Failed to add task. Please try again.");
      }
    } catch (err) {
      console.error("Failed to add task", err);
      alert("Failed to add task. Please check your connection.");
    }
  };

  const toggle = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/routine/${id}/toggle`, {
        method: "POST",
        credentials: 'include'
      });

      if (res.ok) {
        const updatedTask = await res.json();
        // Update the task in state
        setTasks(prevTasks => 
          prevTasks.map(t => (t.id === id ? updatedTask : t))
        );
      } else {
        console.error("Failed to toggle task");
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/routine/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });

      if (res.ok) {
        setTasks(prevTasks => prevTasks.filter(t => t.id !== id));
      } else {
        console.error("Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <h1 className="text-2xl font-semibold mb-6">Daily Routine</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Completion Status */}
        <div className="col-span-4 py-4 rounded-md bg-[#141923] border-white/60 border-2 card">
          <p className="text-md text-white/70 mb-1 text-center">
            Tasks completion status
          </p>

          <div className="flex justify-center relative">
            <PieChart width={180} height={180}>
              <Pie
                data={pieData}
                innerRadius={65}
                outerRadius={80}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>

            <span className="absolute inset-0 flex items-center justify-center text-white text-2xl font-semibold">
              {percent}%
            </span>
          </div>
          
          <div className="mt-4 text-center text-sm text-white/60">
            {completed} of {tasks.length} tasks completed
          </div>
        </div>

        {/* Suggestions */}
        <div className="col-span-8 card py-4 rounded-md bg-[#141923] border-white/60 border-2">
          <p className="text-md text-center text-white/70 mb-3">
            Suggestions for tasks
          </p>
          <ul className="space-y-2 text-left ml-6 text-white/90">
            <li>• Meditation for 15 min</li>
            <li>• Go for a walk</li>
            <li>• Turn off devices</li>
          </ul>
        </div>

        {/* To-do Maker */}
        <div className="col-span-6 py-4 px-4 rounded-md bg-[#141923] border-white/40 border-1 card">
          <p className="text-md text-center text-white/70 mb-4">
            To-do Maker
          </p>

          <input
            className="input w-full bg-transparent text-white border border-white/40 rounded-lg px-3 py-2 mb-3"
            placeholder="Task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="flex mb-3 gap-4">
            <div className="flex flex-col w-full">
              <label className="text-xs text-white/60 mb-1">Start Time</label>
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full bg-transparent text-white border border-white/40 rounded-lg px-3 py-2"
                style={{ colorScheme: "dark" }}
              />
            </div>

            <div className="flex flex-col w-full">
              <label className="text-xs text-white/60 mb-1">End Time</label>
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full bg-transparent border text-white border-white/40 rounded-lg px-3 py-2"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <textarea
            className="w-full bg-transparent text-white border border-white/40 rounded-lg px-3 py-2 mb-4 resize-none"
            placeholder="Notes (optional)"
            rows="3"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <button
            onClick={addTask}
            className="w-full rounded-xl bg-blue-500/80 hover:bg-blue-500 py-2.5 font-medium transition-colors"
          >
            Add Task
          </button>
        </div>

        {/* Tasks Status */}
        <div className="col-span-6 py-4 px-4 rounded-md bg-[#141923] border-white/40 border-1 card">
          <p className="text-md text-center text-white mb-4">
            Tasks Status
          </p>

          <div className="space-y-3">
            {tasks.map(t => {
              const isCompleted = t.done === true || t.status === 'completed';
              
              return (
                <div
                  key={t.id}
                  className={`flex items-start justify-between border-b border-white/10 pb-3 transition-opacity ${
                    isCompleted ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggle(t.id)}
                      className="mt-1 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className={`text-white ${isCompleted ? 'line-through text-white/50' : ''}`}>
                        {t.title}
                      </div>
                      <p className={`mt-1 text-xs ${isCompleted ? 'text-white/30' : 'text-white/60'}`}>
                        {t.start_time} - {t.end_time}
                      </p>
                      {t.notes && (
                        <p className={`text-xs mt-1 ${isCompleted ? 'text-white/30' : 'text-white/50'}`}>
                          {t.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => remove(t.id)}
                    className="text-red-400 hover:text-red-500 ml-2 transition-colors"
                    title="Delete task"
                  >
                    🗑
                  </button>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <p className="text-white/40 text-sm text-center py-8">No tasks added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TasksManager;