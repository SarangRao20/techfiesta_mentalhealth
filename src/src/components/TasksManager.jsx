import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#F19340", "#2a2f3a"];

function TasksManager() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");

  /* -------------------- DERIVED DATA -------------------- */
  const completed = tasks.filter(t => t.done).length;
  const percent = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const pieData = useMemo(
    () => [
      { name: "Done", value: completed },
      { name: "Pending", value: tasks.length - completed },
    ],
    [tasks]
  );

  /* -------------------- FETCH TASKS -------------------- */
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  /* -------------------- ADD TASK (FormData) -------------------- */
  const addTask = async () => {
    if (!title) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("start", start);
    formData.append("end", end);
    formData.append("notes", notes);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        body: formData,
      });

      const createdTask = await res.json();

      setTasks(prev => [...prev, createdTask]);

      setTitle("");
      setStart("");
      setEnd("");
      setNotes("");
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  /* -------------------- TOGGLE TASK -------------------- */
  const toggle = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, {
        method: "PATCH",
      });

      const updatedTask = await res.json();

      setTasks(tasks.map(t => (t.id === id ? updatedTask : t)));
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  /* -------------------- DELETE TASK -------------------- */
  const remove = async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  /* -------------------- UI -------------------- */
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
        <div className="col-span-6 py-2 rounded-md bg-[#141923] border-white/40 border-1 card">
          <p className="text-md mt-2 text-center text-white/70 mb-3">
            To-do Maker
          </p>

          <input
            className="input"
            placeholder="Task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="flex mt-3 mb-3 gap-4">
            <div className="flex flex-col w-full">
              <label className="text-xs text-white/60 mb-1">Start Time</label>
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="w-full bg-transparent text-white border border-white/40 rounded-lg px-2 py-1"
              />
            </div>

            <div className="flex flex-col w-full">
              <label className="text-xs text-white/60 mb-1">End Time</label>
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="w-full bg-transparent border text-white border-white/40 rounded-lg px-2 py-1"
              />
            </div>
          </div>

          <textarea
            className="input mt-3"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <button
            onClick={addTask}
            className="mt-4 w-full rounded-xl bg-blue-500/80 hover:bg-blue-500 py-2"
          >
            Add Task
          </button>
        </div>

        {/* Tasks Status */}
        <div className="col-span-6 card">
          <p className="text-md text-center text-white mb-3">
            Tasks Status
          </p>

          <div className="space-y-3">
            {tasks.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between border-b border-white/10 pb-2"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggle(t.id)}
                  />
                  <div>
                    <p className={t.done ? "line-through text-white" : "text-white"}>
                      {t.title}
                      <p className="mt-1 text-xs text-white/80">
                        {t.start} - {t.end}
                      </p>
                    </p>

                    <p className="text-xs mt-1 text-white">
                      {t.notes}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => remove(t.id)}
                  className="text-red-400 hover:text-red-500"
                >
                  🗑
                </button>
              </div>
            ))}

            {!tasks.length && (
              <p className="text-white/40 text-sm">No tasks added</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TasksManager;