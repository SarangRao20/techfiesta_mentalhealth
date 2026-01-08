import { useState, useEffect } from "react";
import { API_URL } from "../config";

export default function Consultant() {
  const [requests, setRequests] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [openSlots, setOpenSlots] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalView, setModalView] = useState("form"); // 'form' | 'confirm' | 'success'
  const [selectedSlotCounsellor, setSelectedSlotCounsellor] = useState("");

  // Form state
  // Custom Time Picker State
  const [dateInput, setDateInput] = useState("");
  const [timeHour, setTimeHour] = useState("09");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timeAmPm, setTimeAmPm] = useState("AM");

  // Custom Picker Visibility & Calendar State
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Calendar Helpers
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day) => {
    const monthStr = (calMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    setDateInput(`${calYear}-${monthStr}-${dayStr}`);
    setShowDatePicker(false);
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (offset) => {
    let newMonth = calMonth + offset;
    let newYear = calYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setCalMonth(newMonth);
    setCalYear(newYear);
  };

  const [start, setStart] = useState("");

  const [formData, setFormData] = useState({
    counsellor_id: "",
    urgency: "",
    contact_preference: "",
    notes: "",
    attachments: [] // Array of {type, id, label}
  });

  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [inkblotHistory, setInkblotHistory] = useState([]);

  useEffect(() => {
    loadRequests();
    loadCounsellors();
    loadSlots();
    loadReportHistory();
  }, []);

  const loadReportHistory = async () => {
    try {
      const aRes = await fetch(`${API_URL}/api/assessments`, { credentials: 'include' });
      if (aRes.ok) setAssessmentHistory(await aRes.json());

      const iRes = await fetch(`${API_URL}/api/inkblot/results`, { credentials: 'include' });
      if (iRes.ok) setInkblotHistory(await iRes.json());
    } catch (e) {
      console.error("Failed to load report history", e);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [selectedSlotCounsellor]);

  const loadRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/consultation/my_requests`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error("Failed to load requests", e);
    }
  };

  const loadCounsellors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/consultation/counsellors`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCounsellors(data);
      }
    } catch (e) {
      console.error("Failed to load counsellors", e);
    }
  };

  const loadSlots = async () => {
    try {
      const res = await fetch(`${API_URL}/api/consultation/slots`, { credentials: 'include' });
      const data = await res.json();
      setOpenSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load slots", e);
      setOpenSlots([]);
    }
  };

  const resetForm = () => {
    setFormData({
      counsellor_id: "",
      urgency: "",
      contact_preference: "",
      notes: "",
      attachments: []
    });
    setDateInput("");
    setTimeHour("09");
    setTimeMinute("00");
    setTimeAmPm("AM");
    setStart("");
    setModalView("form");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Show confirmation dialog first
    setModalView("confirm");
  };

  const handleConfirmSubmit = async () => {
    // Combine date and time from custom picker
    let preferred_time = "";
    if (dateInput) {
      // Convert 12h to 24h for storage/API
      let hour = parseInt(timeHour, 10);
      if (timeAmPm === "PM" && hour < 12) hour += 12;
      if (timeAmPm === "AM" && hour === 12) hour = 0;

      const hourStr = hour.toString().padStart(2, '0');
      preferred_time = `${dateInput}T${hourStr}:${timeMinute}`;
    }

    // Process attachments - send all attachments as an array
    let finalNotes = formData.notes;
    if (formData.attachments.length > 0) {
      const attachmentText = formData.attachments.map(a => `[Attached: ${a.label}]`).join(", ");
      finalNotes = `${finalNotes}\n\n${attachmentText}`;
    }

    const payload = {
      ...formData,
      preferred_time,
      notes: finalNotes,
      attachments: formData.attachments.map(a => ({ type: a.type, id: parseInt(a.id) }))
    };

    try {
      const res = await fetch(`${API_URL}/api/consultation/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModalView("success"); // Show Success View
        loadRequests();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit request");
        setModalView("form"); // Go back to form on error
      }
    } catch (e) {
      console.error("Submit error", e);
      alert("Network error. Please try again.");
      setModalView("form"); // Go back to form on error
    }
  };

  const handleCancelConfirmation = () => {
    // User cancelled, go back to form without submitting
    setModalView("form");
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addAttachment = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [type, id] = val.split(':');
    const exists = formData.attachments.find(a => a.type === type && a.id === id);
    if (exists) return;

    // Find label
    let label = "Report";
    if (type === 'assessment') {
      const item = assessmentHistory.find(a => a.id.toString() === id);
      if (item) label = `Assessment ${item.date}`;
    } else if (type === 'inkblot') {
      const item = inkblotHistory.find(i => i.id.toString() === id);
      if (item) label = `Inkblot ${new Date(item.date).toLocaleDateString()}`;
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, { type, id, label }]
    }));
    // Reset select
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  const bookSlot = async (slotId) => {
    try {
      const res = await fetch(`${API_URL}/api/consultation/slots/${slotId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      if (res.ok) {
        alert("Slot booked successfully!");
        loadSlots();
        loadRequests();
        setOpenModal(false);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to book slot");
      }
    } catch (e) {
      console.error("Failed to book slot", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-white px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            🧑‍⚕️ Professional Consultation
          </h1>
          <p className="text-white/60">
            Connect with qualified mental health professionals
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setOpenModal(true); }}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition"
        >
          📅 Request Consultation
        </button>
      </div>

      {/* Crisis Banner */}
      <div className="bg-pink-100 text-gray-800 rounded-2xl p-6 text-center shadow mb-10">
        <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center justify-center gap-2">
          🔔 Need Immediate Support?
        </h3>
        <p className="mb-4 text-gray-600">
          Crisis support is available 24/7
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href="tel:988" className="px-4 py-2 rounded-full border-2 border-gray-300 hover:bg-gray-200 transition">
            Call 988
          </a>
          <a href="sms:741741" className="px-4 py-2 rounded-full border-2 border-gray-300 hover:bg-gray-200 transition">
            Text HOME to 741741
          </a>
          <a href="/app/chat" className="px-4 py-2 rounded-full border-2 border-gray-300 hover:bg-gray-200 transition">
            Chat Support
          </a>
        </div>
      </div>

      {/* Professional Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            title: "Counsellors",
            desc: "Connect with licensed professionals specializing in student counseling.",
            icon: "🧑‍⚕️",
            features: ["Licensed & Certified", "Student-focused", "Confidential"]
          },
          {
            title: "Psychiatrists",
            desc: "Consult with psychiatrists for medication and clinical care.",
            icon: "🧠",
            features: ["Medical doctors", "Medication expertise", "Clinical care"]
          },
          {
            title: "Peer Counselors",
            desc: "Talk with trained peer counselors who understand student life.",
            icon: "🤝",
            features: ["Student peers", "Relatable experience", "Immediate availability"]
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[#141923] rounded-2xl p-6 border border-white/10 hover:border-white/30 transition hover:-translate-y-1"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-white/60 text-sm mb-4">{item.desc}</p>
            <ul className="space-y-1 text-xs text-white/50">
              {item.features.map((f, j) => (
                <li key={j} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-[#141923] rounded-2xl border border-white/10 p-6 mb-12">
        <h2 className="text-lg font-semibold mb-4">
          📜 Your Consultation Requests
        </h2>

        {requests.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">📅</div>
            <h5 className="text-white/60 mb-2">No Consultation Requests Yet</h5>
            <p className="text-white/40 mb-4">
              Request your first consultation to start getting professional support.
            </p>
            <button
              onClick={() => { resetForm(); setOpenModal(true); }}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition"
            >
              📅 Request Your First Consultation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/60 border-b border-white/10">
                <tr>
                  <th className="py-2 text-left">Date Requested</th>
                  <th className="py-2 text-left">Urgency</th>
                  <th className="py-2 text-left">Preferred Time</th>
                  <th className="py-2 text-left">Contact Method</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Session Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${r.urgency === 'high' ? 'bg-red-500/20 text-red-300' :
                        r.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td>{r.timeSlot || "Any time"}</td>
                    <td>
                      {r.contactPreference === 'phone' && '📞'}
                      {r.contactPreference === 'email' && '✉️'}
                      {r.contactPreference === 'video' && '🎥'}
                      {' '}{r.contactPreference}
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs ${r.status === 'pending' ? 'bg-yellow-200 text-gray-800' :
                        r.status === 'booked' ? 'bg-green-200 text-gray-800' :
                          r.status === 'rejected' ? 'bg-red-200 text-gray-800' :
                            'bg-gray-200 text-gray-800'
                        }`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.sessionDateTime || <span className="text-white/40">Not scheduled</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Re-designed Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"> {/* High z-index */}
          <div className="bg-[#141923] rounded-2xl w-full max-w-3xl border border-white/20 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"> {/* Constrained height & overflow hidden for container */}

            {/* Modal Header - Sticky */}
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0 bg-[#141923] z-10">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                  {modalView === 'form' ? 'Request Consultation' :
                    modalView === 'confirm' ? 'Confirm Your Request' :
                      'Request Submitted!'}
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  {modalView === 'form' ? 'Book a session with our mental health pros' :
                    modalView === 'confirm' ? 'Please review your booking details before submitting' :
                      'Your request has been sent successfully'}
                </p>
              </div>
              <button
                onClick={() => {
                  setOpenModal(false);
                  // Reset to form view if user closes during confirmation
                  if (modalView === 'confirm') {
                    setModalView('form');
                  }
                }}
                className="text-white/40 hover:text-white transition p-2 rounded-full hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            {/* Added relative and overflow-y-auto w/ custom scrollbar */}
            <div className="overflow-y-auto custom-scrollbar grow relative">
              {modalView === 'form' ? (
                <div className="p-6 space-y-8">

                  {/* Top Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Select Counsellor <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="counsellor_id"
                          value={formData.counsellor_id}
                          onChange={handleInputChange}
                          className="w-full bg-[#0f131c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none"
                          required
                        >
                          <option value="">Choose expert...</option>
                          {counsellors.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-white/30">▼</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Urgency Level <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="urgency"
                          value={formData.urgency}
                          onChange={handleInputChange}
                          className="w-full bg-[#0f131c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none"
                          required
                        >
                          <option value="">Select level...</option>
                          <option value="low">Low (General)</option>
                          <option value="medium">Medium (Moderate)</option>
                          <option value="high">High (Immediate)</option>
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-white/30">▼</div>
                      </div>
                    </div>
                  </div>

                  {/* Second Row: Contact & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Contact Method <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-2">
                        {['video', 'phone', 'email'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setFormData({ ...formData, contact_preference: method })}
                            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${formData.contact_preference === method
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                              : 'bg-[#0f131c] border-white/10 text-white/60 hover:border-white/20'
                              }`}
                          >
                            {method === 'video' && '🎥 Video'}
                            {method === 'phone' && '📞 Phone'}
                            {method === 'email' && '✉️ Email'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Preferred Time <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* CUSTOM DATE PICKER */}
                        <div className="relative">
                          <div
                            onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
                            className={`w-full bg-[#0f131c] border ${showDatePicker ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm text-white flex justify-between items-center cursor-pointer hover:border-indigo-500 transition group`}
                          >
                            <span className={dateInput ? "text-white" : "text-white/40"}>
                              {dateInput ? new Date(dateInput).toLocaleDateString('en-GB') : "dd-mm-yyyy"}
                            </span>
                            <span className="text-white/30 group-hover:text-white/60">📅</span>
                          </div>

                          {showDatePicker && (
                            <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setShowDatePicker(false)} />
                              <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a202c] border border-white/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[101] p-4 animate-in fade-in zoom-in-95 duration-200">
                                {/* Calendar Header */}
                                <div className="flex justify-between items-center mb-4">
                                  <button onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition">◀</button>
                                  <span className="font-semibold text-sm">{months[calMonth]} {calYear}</span>
                                  <button onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition">▶</button>
                                </div>
                                {/* Days Header */}
                                <div className="grid grid-cols-7 text-center text-xs text-white/40 mb-2 font-medium">
                                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                                </div>
                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({ length: firstDayOfMonth(calMonth, calYear) }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                  ))}
                                  {Array.from({ length: daysInMonth(calMonth, calYear) }).map((_, i) => {
                                    const day = i + 1;
                                    const isSelected = dateInput === `${calYear}-${(calMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                    return (
                                      <div
                                        key={day}
                                        onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
                                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs cursor-pointer transition-all ${isSelected
                                          ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50'
                                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                                          }`}
                                      >
                                        {day}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="w-full bg-[#0f131c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white flex justify-between items-center cursor-pointer hover:border-indigo-500 transition group">
                          <input
                            type="time"
                            value={start}
                            onChange={e => setStart(e.target.value)}
                            style={{ colorScheme: "dark" }}
                          />
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                        Attach Clinical Reports <span className="text-white/30 font-normal normal-case">(Multi-select enabled)</span>
                      </label>
                      <div className="relative">
                        <select
                          onChange={addAttachment}
                          className="w-full bg-[#0f131c] border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 appearance-none"
                        >
                          <option value="">Select a report to attach...</option>
                          <optgroup label="Assessments">
                            {assessmentHistory.map(a => (
                              <option key={a.id} value={`assessment:${a.id}`}>
                                Result ({a.date}) - {a.clinical_analysis?.severity_level}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Inkblot Tests">
                            {inkblotHistory.map(i => (
                              <option key={i.id} value={`inkblot:${i.id}`}>
                                Inkblot Test ({new Date(i.date).toLocaleDateString()}) - {i.blot_count} plates
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-white/30">▼</div>
                      </div>

                      {/* Tags Display */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.attachments.map((att, idx) => (
                          <div key={`${att.type}-${att.id}`} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 animate-in zoom-in-90 duration-200">
                            <span>📎 {att.label}</span>
                            <button
                              onClick={() => removeAttachment(idx)}
                              className="hover:text-white w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20"
                            >×</button>
                          </div>
                        ))}
                        {formData.attachments.length === 0 && (
                          <span className="text-white/20 text-xs italic ml-1">No reports attached</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Slot Booking - Vertical List (Pic 2 Style) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📅</span>
                      <label className="text-sm font-medium text-white/90">
                        Or pick an available slot <span className="text-white/40">(Optional)</span>
                      </label>
                    </div>

                    {/* Filter and Refresh Row */}
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <select
                          value={selectedSlotCounsellor}
                          onChange={(e) => setSelectedSlotCounsellor(e.target.value)}
                          className="w-full bg-[#0f131c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none"
                        >
                          <option value="">All counsellors</option>
                          {counsellors.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none text-white/30">▼</div>
                      </div>

                      <button
                        type="button"
                        onClick={loadSlots}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        🔄 Refresh
                      </button>
                    </div>

                    {/* Slots List */}
                    <div className="border border-white/10 rounded-xl overflow-hidden">
                      {openSlots.filter(slot => !selectedSlotCounsellor || slot.counsellor_id?.toString() === selectedSlotCounsellor).length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {openSlots
                            .filter(slot => !selectedSlotCounsellor || slot.counsellor_id?.toString() === selectedSlotCounsellor)
                            .map(slot => {
                              const startDate = new Date(slot.start);
                              const endDate = new Date(slot.end);
                              const dateTimeStr = `${startDate.toLocaleDateString('en-US')}, ${startDate.toLocaleTimeString('en-US')} - ${endDate.toLocaleTimeString('en-US')}`;

                              return (
                                <div key={slot.id} className="p-4 bg-[#0f131c] hover:bg-[#141923] transition flex items-center justify-between border border-white/10 rounded-lg m-3">
                                  <div>
                                    <div className="font-semibold text-base text-white mb-1">
                                      {slot.counsellor?.full_name || 'Counsellor'}
                                    </div>
                                    <div className="text-sm text-indigo-300/80">
                                      {dateTimeStr}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => bookSlot(slot.id)}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-indigo-500/30"
                                  >
                                    Book
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-white/30 text-sm">
                          No slots available right now.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 pb-4">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-[#0f131c] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                      placeholder="Briefly describe what you'd like to discuss..."
                      maxLength={500}
                    />
                  </div>
                </div>
              ) : modalView === 'confirm' ? (
                /* Confirmation View - Are you sure? */
                <div className="p-8 grow flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <span className="text-4xl">⚠️</span>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-3">Confirm Your Booking</h2>
                  <p className="text-white/60 max-w-md mb-8 text-sm leading-relaxed">
                    Once you confirm, we'll send an email to the counsellor and process your request.
                    Please make sure all details are correct.
                  </p>

                  {/* Booking Summary */}
                  <div className="w-full max-w-lg bg-[#0f131c] border border-white/10 rounded-xl p-6 text-left space-y-4 mb-8">
                    <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      📋 Booking Summary
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-white/50">Counsellor:</span>
                        <span className="text-white font-medium text-right">
                          {counsellors.find(c => c.id.toString() === formData.counsellor_id)?.name || 'Not selected'}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-white/50">Urgency:</span>
                        <span className={`font-medium text-right px-2 py-0.5 rounded ${formData.urgency === 'high' ? 'bg-red-500/20 text-red-300' :
                          formData.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                          {formData.urgency ? formData.urgency.charAt(0).toUpperCase() + formData.urgency.slice(1) : 'Not set'}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-white/50">Contact:</span>
                        <span className="text-white font-medium text-right">
                          {formData.contact_preference ? formData.contact_preference.charAt(0).toUpperCase() + formData.contact_preference.slice(1) : 'Not set'}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-white/50">Preferred Time:</span>
                        <span className="text-white font-medium text-right">
                          {dateInput && timeHour && timeMinute ?
                            `${dateInput} at ${timeHour}:${timeMinute} ${timeAmPm}` :
                            'Flexible'}
                        </span>
                      </div>

                      {formData.attachments.length > 0 && (
                        <div className="flex justify-between items-start">
                          <span className="text-white/50">Attachments:</span>
                          <span className="text-white font-medium text-right">
                            {formData.attachments.length} report{formData.attachments.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                      {formData.notes && (
                        <div className="pt-2 border-t border-white/10">
                          <span className="text-white/50 block mb-2">Notes:</span>
                          <p className="text-white/70 text-xs bg-white/5 rounded-lg p-3 italic">
                            "{formData.notes.substring(0, 100)}{formData.notes.length > 100 ? '...' : ''}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 w-full max-w-md">
                    <button
                      onClick={handleCancelConfirmation}
                      className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition font-medium border border-white/20"
                    >
                      ← Go Back
                    </button>
                    <button
                      onClick={handleConfirmSubmit}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition font-bold shadow-lg shadow-indigo-500/30"
                    >
                      ✓ Confirm & Send
                    </button>
                  </div>

                  <p className="text-xs text-white/40 mt-6">
                    By confirming, you agree that this information will be shared with your selected counsellor.
                  </p>
                </div>
              ) : (
                /* Success View */
                <div className="p-8 grow flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <span className="text-5xl">✅</span>
                  </div>

                  <h2 className="text-3xl font-bold text-white mb-2">Request Sent!</h2>
                  <p className="text-white/60 max-w-sm mb-10 text-sm leading-relaxed">
                    We have received your consultation request using the credentials provided. A counsellor will review it and confirm your slot shortly via email.
                  </p>

                  {/* Info Alerts moved here with better styling */}
                  <div className="w-full space-y-4 text-left max-w-md">
                    <div className="bg-[#1a2130] border-l-4 border-blue-500 rounded-r-xl p-4 shadow-lg">
                      <h6 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-400">
                        ℹ️ Before Your Session
                      </h6>
                      <ul className="text-xs space-y-2 text-white/70 list-disc list-inside">
                        <li>Check your email for the meeting link</li>
                        <li>Find a quiet, private space</li>
                        <li>Test your microphone and camera beforehand</li>
                      </ul>
                    </div>

                    <div className="bg-[#1a2130] border-l-4 border-yellow-500 rounded-r-xl p-4 shadow-lg">
                      <h6 className="font-semibold text-sm mb-2 flex items-center gap-2 text-yellow-400">
                        ⚠️ In Crisis?
                      </h6>
                      <p className="text-xs text-white/70 leading-relaxed">
                        If this is an emergency, please call <strong>988</strong> or text <strong>HOME</strong> to <strong>741741</strong> immediately.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setOpenModal(false)}
                    className="mt-10 px-10 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition font-medium border border-white/10"
                  >
                    Close Window
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer - Sticky */}
            {modalView === 'form' && (
              <div className="p-5 border-t border-white/10 bg-[#141923] shrink-0 flex justify-between items-center z-10 rounded-b-2xl">
                <div className="text-[10px] text-white/40 max-w-[200px] hidden md:block">
                  Your request is confidential and secure.
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/20 transition transform active:scale-95 grow md:grow-0"
                  >
                    Review & Submit →
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}