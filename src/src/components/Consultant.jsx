import { useState, useEffect } from "react";
import { API_URL } from "../config";

export default function Consultant() {
  const [requests, setRequests] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [openSlots, setOpenSlots] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSlotCounsellor, setSelectedSlotCounsellor] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    counsellor_id: "",
    urgency: "",
    contact_preference: "",
    preferred_time: "",
    notes: "",
    attachment_type: "",
    attachment_id: ""
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
      // Backend doesn't support filtering by counsellor_id yet in /slots, but keeping logic for future
      const res = await fetch(`${API_URL}/api/consultation/slots`, { credentials: 'include' });
      const data = await res.json();
      setOpenSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load slots", e);
      setOpenSlots([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/consultation/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Request submitted successfully!");
        setOpenModal(false);
        loadRequests();
        setFormData({
          counsellor_id: "",
          urgency: "",
          contact_preference: "",
          preferred_time: "",
          notes: ""
        });
      } else {
        const err = await res.json();
        alert(err.message || "Failed to submit request");
      }
    } catch (e) {
      console.error("Submit error", e);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      } else {
        const err = await res.json();
        alert(err.message || "Failed to book slot");
      }
    } catch (e) {
      console.error("Failed to book slot", e);
    }
  };

  const urgencyInfo = {
    low: "General support and guidance. Response within 24-48 hours.",
    medium: "Moderate distress requiring prompt attention. Response within 12-24 hours.",
    high: "Severe distress requiring immediate attention. Response within 1-4 hours."
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
          onClick={() => setOpenModal(true)}
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
          <a href="/chat" className="px-4 py-2 rounded-full border-2 border-gray-300 hover:bg-gray-200 transition">
            Chat Support
          </a>
        </div>
      </div>

      {/* Professional Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          {
            title: "Counsellors - Licensed Therapists",
            desc: "Connect with licensed mental health professionals who specialize in student counseling and therapy.",
            icon: "🧑‍⚕️",
            features: ["Licensed & Certified", "Student-focused", "Confidential sessions"]
          },
          {
            title: "Psychiatrists",
            desc: "Consult with psychiatrists for medication management and comprehensive mental health treatment.",
            icon: "🧠",
            features: ["Medical doctors", "Medication expertise", "Comprehensive care"]
          },
          {
            title: "Peer Counselors",
            desc: "Talk with trained peer counselors who understand the unique challenges of student life.",
            icon: "🤝",
            features: ["Student peers", "Relatable experience", "Immediate availability"]
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[#141923] rounded-2xl p-6 border border-white/10 hover:border-white/30 transition hover:transform hover:-translate-y-1"
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
              Request your first consultation to start getting professional mental health support.
            </p>
            <button
              onClick={() => setOpenModal(true)}
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
                  <th className="py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3">{r.createdAt}</td>
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
                    <td>
                      <button className="text-indigo-400 hover:text-indigo-300 text-xs">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAQ & What to Expect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141923] rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🛡️ What to Expect
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">🕐</span>
              <span className="text-white/80">Response within 24-48 hours for standard requests</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">⚡</span>
              <span className="text-white/80">Immediate response for high-urgency requests</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">🔒</span>
              <span className="text-white/80">Complete confidentiality and privacy protection</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">🎓</span>
              <span className="text-white/80">Specialized in student mental health issues</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#141923] rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            ❓ Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            <details className="text-sm">
              <summary className="cursor-pointer text-white/80 font-medium">Is this service free for students?</summary>
              <p className="mt-2 text-white/60 pl-4">Yes, all consultation services are provided free of charge to registered students as part of our mental health support program.</p>
            </details>
            <details className="text-sm">
              <summary className="cursor-pointer text-white/80 font-medium">Will my information be kept confidential?</summary>
              <p className="mt-2 text-white/60 pl-4">Absolutely. All consultations are strictly confidential and protected by professional ethics and privacy laws.</p>
            </details>
            <details className="text-sm">
              <summary className="cursor-pointer text-white/80 font-medium">How quickly can I get an appointment?</summary>
              <p className="mt-2 text-white/60 pl-4">For high-urgency requests, we aim to connect you within a few hours. Standard requests are typically scheduled within 24-48 hours.</p>
            </details>
          </div>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#141923] rounded-xl w-full max-w-2xl border border-white/20 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  📅 Request Professional Consultation
                </h3>
                <button
                  onClick={() => setOpenModal(false)}
                  className="text-white/80 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Counsellor Selection */}
                <div>
                  <label className="   text-xs font-medium mb-1.5 flex items-center gap-1.5">
                    🧑‍⚕️ Select Counsellor <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="counsellor_id"
                    value={formData.counsellor_id}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f131c] border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white"
                    required
                  >
                    <option value="">Choose counsellor...</option>
                    {counsellors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="   text-xs font-medium mb-1.5 flex items-center gap-1.5">
                    ⚠️ Urgency Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f131c] border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white"
                    required
                  >
                    <option value="">Select urgency...</option>
                    <option value="low">Low - General support</option>
                    <option value="medium">Medium - Moderate distress</option>
                    <option value="high">High - Severe distress</option>
                  </select>
                  {formData.urgency && urgencyInfo[formData.urgency] && (
                    <p className="text-xs text-blue-400 mt-1">
                      ℹ️ {urgencyInfo[formData.urgency]}
                    </p>
                  )}
                </div>

                {/* Contact Preference */}
                <div>
                  <label className="   text-xs font-medium mb-1.5 flex items-center gap-1.5">
                    📞 Preferred Contact Method <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="contact_preference"
                    value={formData.contact_preference}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f131c] border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white"
                    required
                  >
                    <option value="">Select method...</option>
                    <option value="phone">Phone call</option>
                    <option value="video">Video call</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                {/* Preferred Time */}
                <div>
                  <label className="   text-xs font-medium mb-1.5 flex items-center gap-1.5">
                    🕐 Preferred Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="preferred_time"
                    value={formData.preferred_time}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f131c] border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white"
                    required
                  />
                  <p className="text-xs text-white/40 mt-1">Select a date and time for your talk</p>
                </div>

                {/* Report Attachment */}
                <div className="md:col-span-2">
                  <label className="   text-xs font-medium mb-1.5 flex items-center gap-1.5">
                    📎 Attach Clinical Report <span className="text-white/40">(Optional)</span>
                  </label>
                  <select
                    name="attachment"
                    onChange={(e) => {
                      const [type, id] = e.target.value.split(':');
                      setFormData(prev => ({ ...prev, attachment_type: type || "", attachment_id: id || "" }));
                    }}
                    className="w-full bg-[#0f131c] border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white"
                  >
                    <option value="">None</option>
                    <optgroup label="Clinical Assessments">
                      {assessmentHistory.map(a => (
                        <option key={a.id} value={`assessment:${a.id}`}>
                          Assessment ({a.date}) - Risk: {a.clinical_analysis?.severity_level || 'N/A'}
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
                  <p className="text-xs text-white/40 mt-1">Sharing your recent results helps the counsellor prepare for your session.</p>
                </div>
              </div>

              {/* Available Slots */}
              <div>
                <label className="   text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  📅 Or pick an available slot <span className="text-white/40">(Optional)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={selectedSlotCounsellor}
                    onChange={(e) => setSelectedSlotCounsellor(e.target.value)}
                    className="flex-1 bg-[#0f131c] border border-white/30 rounded-lg px-3 py-1.5 text-white text-xs"
                  >
                    <option value="">All counsellors</option>
                    {counsellors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={loadSlots}
                    className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/30 transition text-xs"
                  >
                    🔄 Refresh
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 bg-[#0f131c] rounded-lg p-2.5 border border-white/10">
                  {openSlots.length === 0 ? (
                    <p className="text-white/40 text-xs text-center py-3">No open slots available</p>
                  ) : (
                    openSlots.map(slot => (
                      <div key={slot.id} className="flex justify-between items-center bg-[#141923] rounded-lg p-2.5 border border-white/10">
                        <div className="text-xs">
                          <div className="font-medium">{slot.counsellor?.full_name || 'Counsellor'}</div>
                          <div className="text-white/60 text-xs">
                            {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleTimeString()}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => bookSlot(slot.id)}
                          className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded text-xs transition"
                        >
                          Book
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="   text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  📝 Additional Notes <span className="text-white/40">(Optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-[#0f131c] border border-white/30 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  placeholder="Share any specific concerns, topics you'd like to discuss, or other relevant information..."
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-white/40">This information helps us match you with the most appropriate professional</span>
                  <span className={formData.notes.length > 450 ? 'text-yellow-400' : 'text-white/40'}>
                    {formData.notes.length}/500
                  </span>
                </div>
              </div>

              {/* Information Alerts */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <h6 className="font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                  ℹ️ Before Your Session
                </h6>
                <ul className="text-xs space-y-0.5 text-white/70">
                  <li>• You'll receive a confirmation with session details</li>
                  <li>• Prepare any questions or topics you'd like to discuss</li>
                  <li>• Find a private, comfortable space for your session</li>
                  <li>• Have a notebook ready if you'd like to take notes</li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <h6 className="font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                  ⚠️ Crisis Situations
                </h6>
                <p className="text-xs text-white/70">
                  If you're having thoughts of suicide or self-harm, please don't wait for a consultation.
                  Call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 for immediate support.
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-5 py-1.5 rounded-lg border border-white/30 hover:bg-white/5 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition flex items-center gap-2 text-sm"
                >
                  ✉️ Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}