import { useState, useEffect } from "react";
import { API_URL } from "../config";

export default function CounselorDashboard() {
    const [requests, setRequests] = useState([]);
    const [slots, setSlots] = useState([]);
    const [newSlot, setNewSlot] = useState({ start: "", end: "" });

    useEffect(() => {
        loadRequests();
        loadSlots();
    }, []);

    const loadRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/api/consultation/counsellor/requests`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }, // Assuming generic token handling, usually cookies in this project?
                credentials: 'include'
            });
            // Note: Project uses Flask-Login sessions, so likely don't need Bearer token if credentials: include is used or proxy.
            // But looking at previous files, they just fetch. I'll assume standard fetch with credentials or existing setup.
            // Actually `Register.jsx` used simple fetch. `SignIn.jsx` likely sets cookie.
            // I should check if `credentials: 'include'` is needed.
            // The `Register.jsx` didn't use `credentials: 'include'`, but `SignIn` does login.
            // Usually fetch doesn't send cookies by default cross-origin. If on same origin (proxy), it's fine.
            // I'll add `credentials: 'include'` to be safe if it's a separate port, or just fetch if proxy.
            // Given `API_URL` usage, likely separate.
            // Let's check `Consultant.jsx` again... it just does fetch(`${API_URL}/...`).
            // If it works for Consultant, I'll stick to that style.
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (e) {
            console.error("Failed to load requests", e);
        }
    };

    const loadSlots = async () => {
        try {
            const res = await fetch(`${API_URL}/api/consultation/counsellor/slots`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setSlots(data);
            }
        } catch (e) {
            console.error("Failed to load slots", e);
        }
    };

    const handleAction = async (requestId, action) => {
        try {
            const res = await fetch(`${API_URL}/api/consultation/request/${requestId}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
                credentials: 'include'
            });
            if (res.ok) {
                loadRequests();
            } else {
                alert("Action failed");
            }
        } catch (e) {
            console.error("Action error", e);
        }
    };

    const addSlot = async () => {
        try {
            const res = await fetch(`${API_URL}/api/consultation/counsellor/slots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_time: new Date(newSlot.start).toISOString(),
                    end_time: new Date(newSlot.end).toISOString()
                }),
                credentials: 'include'
            });
            if (res.ok) {
                setNewSlot({ start: "", end: "" });
                loadSlots();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) {
            console.error("Add slot error", e);
        }
    };

    const deleteSlot = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`${API_URL}/api/consultation/counsellor/slots/${id}`, {
                method: "DELETE",
                credentials: 'include'
            });
            if (res.ok) {
                loadSlots();
            }
        } catch (e) {
            console.error("Delete slot error", e);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f131c] text-white px-6 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold flex items-center gap-2">
                    🧘 Counsellor Dashboard
                </h1>
                <p className="text-white/60">Manage your consultations and availability</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column: Requests */}
                <div className="lg:col-span-2">
                    <div className="bg-[#141923] rounded-2xl border border-white/10 p-6">
                        <h2 className="text-lg font-semibold mb-4">Incoming Requests</h2>

                        <div className="space-y-4">
                            {requests.length === 0 ? (
                                <p className="text-white/40 text-center py-4">No requests found.</p>
                            ) : (
                                requests.map(req => (
                                    <div key={req.id} className="bg-[#0f131c] rounded-xl p-4 border border-white/10">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">{req.user.full_name}</h3>
                                                <div className="text-sm text-white/60">@{req.user.username}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${req.urgency === 'high' ? 'bg-red-500/20 text-red-300' :
                                                req.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    'bg-green-500/20 text-green-300'
                                                }`}>
                                                {req.urgency.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/80 mb-4">
                                            <div><span className="text-white/40">Contact:</span> {req.contact_preference}</div>
                                            <div><span className="text-white/40">Time:</span> {req.time_slot || 'Flexible'}</div>
                                            <div className="col-span-2"><span className="text-white/40">Notes:</span> {req.notes || 'None'}</div>
                                            <div className="col-span-2"><span className="text-white/40">Status:</span>
                                                <span className={`ml-2 ${req.status === 'booked' ? 'text-green-400' :
                                                    req.status === 'rejected' ? 'text-red-400' :
                                                        'text-yellow-400'
                                                    }`}>{req.status.toUpperCase()}</span>
                                            </div>
                                            {/* Display all attachments */}
                                            {req.attachments && req.attachments.length > 0 && (
                                                <div className="col-span-2 mt-2 space-y-2">
                                                    <p className="text-white/40 text-xs font-semibold">Attached Reports:</p>
                                                    {req.attachments.map((attachment, idx) => (
                                                        <div key={idx} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-indigo-400 text-lg">📄</span>
                                                                <div className="text-xs">
                                                                    <p className="font-semibold text-indigo-300">
                                                                        {attachment.type === 'assessment' ? 'Clinical Assessment' : 'Inkblot Test'}
                                                                    </p>
                                                                    <p className="text-white/40">Attachment {idx + 1} of {req.attachments.length}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => window.open(`${API_URL}/api/${attachment.type === 'assessment' ? 'assessments' : 'inkblot'}/export/${attachment.id}`, '_blank')}
                                                                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg"
                                                            >
                                                                Download PDF
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Fallback for legacy single attachment (backward compatibility) */}
                                            {(!req.attachments || req.attachments.length === 0) && req.attachment_id && (
                                                <div className="col-span-2 mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-indigo-400 text-lg">📄</span>
                                                        <div className="text-xs">
                                                            <p className="font-semibold text-indigo-300">Shared {req.attachment_type === 'assessment' ? 'Clinical Assessment' : 'Inkblot Test'}</p>
                                                            <p className="text-white/40">Student shared this report for review</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => window.open(`${API_URL}/api/${req.attachment_type === 'assessment' ? 'assessments' : 'inkblot'}/export/${req.attachment_id}`, '_blank')}
                                                        className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg"
                                                    >
                                                        Download PDF
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className="flex gap-3 mt-3">
                                                <button
                                                    onClick={() => handleAction(req.id, 'accept')}
                                                    className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-300 py-2 rounded-lg transition text-sm font-medium"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 py-2 rounded-lg transition text-sm font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Side Column: Availability */}
                <div className="lg:col-span-1">
                    <div className="bg-[#141923] rounded-2xl border border-white/10 p-6 sticky top-6">
                        <h2 className="text-lg font-semibold mb-4">Manage Availability</h2>

                        {/* Add Slot */}
                        <div className="mb-6 p-4 bg-[#0f131c] rounded-xl border border-white/10">
                            <h3 className="text-sm font-medium mb-3">Add New Slot</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={newSlot.start}
                                        onChange={e => setNewSlot({ ...newSlot, start: e.target.value })}
                                        className="w-full bg-[#141923] border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={newSlot.end}
                                        onChange={e => setNewSlot({ ...newSlot, end: e.target.value })}
                                        className="w-full bg-[#141923] border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white"
                                    />
                                </div>
                                <button
                                    onClick={addSlot}
                                    disabled={!newSlot.start || !newSlot.end}
                                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm transition"
                                >
                                    Add Slot
                                </button>
                            </div>
                        </div>

                        {/* List Slots */}
                        <h3 className="text-sm font-medium mb-3">Your Slots</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {slots.map(slot => (
                                <div key={slot.id} className="flex justify-between items-center bg-[#0f131c] p-3 rounded-lg border border-white/10 text-xs">
                                    <div>
                                        <div className="text-white/90">
                                            {new Date(slot.start).toLocaleDateString()}
                                        </div>
                                        <div className="text-white/50">
                                            {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteSlot(slot.id)}
                                        className="text-red-400 hover:text-red-300 p-1"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                            {slots.length === 0 && <p className="text-white/30 text-xs text-center">No slots added.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
