import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import {
    Users,
    AlertTriangle,
    TrendingUp,
    Search,
    Inbox,
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    RefreshCw,
    Shield,
    MessageSquare,
    BarChart3,
    Brain,
    Heart,
    Calendar,
    Link as LinkIcon
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const CounsellorDashboardNew = () => {
    const [inbox, setInbox] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Link Modal State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkRequestId, setLinkRequestId] = useState(null);
    const [linkUrl, setLinkUrl] = useState('');

    const navigate = useNavigate();

    const COLORS = ['#818cf8', '#2dd4bf', '#fb7185', '#fbbf24', '#a78bfa', '#60a5fa'];

    useEffect(() => {
        fetchInbox();
        fetchPatients();
    }, []);

    const fetchInbox = async () => {
        setRefreshing(true);
        try {
            const response = await fetch(`${API_URL}/api/counsellor/inbox`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setInbox(data);
            }
        } catch (error) {
            console.error('Error fetching inbox:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch(`${API_URL}/api/counsellor/patients`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchPatientInsights = async (patientId) => {
        try {
            const response = await fetch(`${API_URL}/api/counsellor/patient/${patientId}/insights`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setInsights(data);
                setSelectedPatient(patients.find(p => p.id === patientId));
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
        }
    };

    const handleAddLink = (requestId, currentLink) => {
        setLinkRequestId(requestId);
        setLinkUrl(currentLink || '');
        setShowLinkModal(true);
    };

    const saveLink = async () => {
        if (!linkUrl.trim()) return;
        try {
            const response = await fetch(`${API_URL}/api/consultation/request/${linkRequestId}/link`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ link: linkUrl })
            });

            if (response.ok) {
                setShowLinkModal(false);
                setLinkRequestId(null);
                setLinkUrl('');
                fetchInbox(); // Refresh to see updated link
            }
        } catch (error) {
            console.error('Error saving link:', error);
        }
    }

    const handleInboxAction = async (requestId, action) => {
        try {
            const response = await fetch(`${API_URL}/api/counsellor/inbox/${requestId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action })
            });
            if (response.ok) {
                fetchInbox();
                fetchPatients();
            }
        } catch (error) {
            console.error('Error handling request:', error);
        }
    };

    const pendingRequests = inbox.filter(r => r.status === 'pending');
    const upcomingSessions = inbox.filter(r => r.status === 'booked' || r.status === 'accepted');
    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-[#0f131c] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
    );

    return (

        <div className="flex h-screen bg-[#0f131c] text-gray-100 font-sans overflow-hidden flex-col">
            {/* Top Header - Centered */}
            <div className="h-20 bg-[#161b26] border-b border-white/5 flex flex-col items-center justify-center shrink-0 z-20 shadow-md">
                <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                    <Shield className="text-indigo-400" size={28} />
                    Counsellor Portal
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-[0.2em]">Clinical Operations Control</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 bg-[#0f131c] overflow-y-auto custom-scrollbar">
                    {selectedPatient && insights ? (
                        <div className="p-8 max-w-6xl mx-auto space-y-6">
                            {/* Back Button */}
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                            >
                                <Users size={16} />
                                Back to Patient Directory
                            </button>

                            {/* Patient Header */}
                            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#161b26] rounded-3xl p-8 border border-white/5 shadow-2xl">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
                                        {selectedPatient.profile_picture ? (
                                            <img
                                                src={selectedPatient.profile_picture}
                                                alt={selectedPatient.full_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span>{selectedPatient.full_name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold text-white mb-1">{selectedPatient.full_name}</h1>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{selectedPatient.email}</span>
                                            <span className={`px-3 py-1 rounded-full font-medium ${insights.patient_info.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                insights.patient_info.risk_level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                    insights.patient_info.risk_level === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {insights.patient_info.risk_level} risk
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                                    <div className="bg-[#0f131c]/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-500 mb-1">Login Streak</div>
                                        <div className="text-2xl font-bold text-white">{insights.patient_info.login_streak}</div>
                                    </div>
                                    <div className="bg-[#0f131c]/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-500 mb-1">Assessments</div>
                                        <div className="text-2xl font-bold text-teal-400">{insights.statistics.total_assessments}</div>
                                    </div>
                                    <div className="bg-[#0f131c]/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-500 mb-1">Activities</div>
                                        <div className="text-2xl font-bold text-blue-400">{insights.statistics.total_activities}</div>
                                    </div>
                                    <div className="bg-[#0f131c]/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-500 mb-1">Crisis Alerts</div>
                                        <div className="text-2xl font-bold text-red-400">{insights.statistics.total_crisis_alerts}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Emotional State Dashboard */}
                            {insights.patient_info.current_emotional_state && (
                                <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Brain className="text-teal-400" />
                                        Current Emotional State
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-bold text-teal-300 capitalize">
                                            {insights.patient_info.current_emotional_state}
                                        </span>
                                        <span className={`px-4 py-2 rounded-xl font-medium ${insights.patient_info.current_emotional_intensity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            insights.patient_info.current_emotional_intensity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                insights.patient_info.current_emotional_intensity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-green-500/20 text-green-400'
                                            }`}>
                                            {insights.patient_info.current_emotional_intensity} intensity
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Visualizations Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Emotional State Distribution */}
                                {Object.keys(insights.statistics.emotional_state_distribution).length > 0 && (
                                    <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Heart className="text-pink-400" />
                                            Emotional State Distribution
                                        </h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(insights.statistics.emotional_state_distribution).map(([key, value]) => ({
                                                        name: key,
                                                        value: value
                                                    }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {Object.entries(insights.statistics.emotional_state_distribution).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Activity Breakdown */}
                                {Object.keys(insights.statistics.activity_breakdown).length > 0 && (
                                    <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Activity className="text-teal-400" />
                                            Activity Breakdown
                                        </h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={Object.entries(insights.statistics.activity_breakdown).map(([key, value]) => ({
                                                name: key,
                                                count: value
                                            }))}>
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Bar dataKey="count" fill="#2dd4bf" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Assessment Trends */}
                                {insights.assessments.length > 0 && (
                                    <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5 col-span-2">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <TrendingUp className="text-blue-400" />
                                            Assessment Score Trends
                                        </h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <AreaChart data={[...insights.assessments].reverse()}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="time_ago" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Area
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#3b82f6"
                                                    fillOpacity={1}
                                                    fill="url(#colorScore)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Assessment Results */}
                            {insights.assessments.length > 0 && (
                                <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <BarChart3 className="text-purple-400" />
                                        Assessment Results
                                    </h3>
                                    <div className="space-y-3">
                                        {insights.assessments.map((assessment, idx) => (
                                            <div key={idx} className="bg-[#0f131c] p-4 rounded-xl border border-white/10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="font-semibold text-teal-300">{assessment.type}</span>
                                                        <span className="text-xs text-gray-500 ml-2">{assessment.time_ago}</span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${assessment.severity === 'severe' ? 'bg-red-500/20 text-red-400' :
                                                        assessment.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'
                                                        }`}>
                                                        {assessment.severity}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    <span className="font-medium">Score:</span> {assessment.score}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Crisis Alerts */}
                            {insights.crisis_alerts.length > 0 && (
                                <div className="bg-gradient-to-br from-red-900/20 to-red-950/30 rounded-3xl p-6 border border-red-500/20">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <AlertTriangle className="text-red-400" />
                                        Crisis Alerts
                                    </h3>
                                    <div className="space-y-3">
                                        {insights.crisis_alerts.map((alert, idx) => (
                                            <div key={idx} className="bg-[#0f131c]/50 p-4 rounded-xl border border-red-500/20">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${alert.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
                                                        'bg-orange-500/30 text-orange-300'
                                                        }`}>
                                                        {alert.severity}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{alert.time_ago}</span>
                                                </div>
                                                <p className="text-sm text-gray-300">{alert.message_snippet}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Shared Documents Section */}
                            {insights.shared_documents && insights.shared_documents.length > 0 && (
                                <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <MessageSquare className="text-blue-400" />
                                        Shared Documents
                                    </h3>
                                    <div className="space-y-3">
                                        {insights.shared_documents.map((doc, idx) => (
                                            <div key={idx} className="bg-[#0f131c] p-4 rounded-xl border border-white/10 hover:border-teal-500/30 transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${doc.type === 'assessment'
                                                                ? 'bg-purple-500/20 text-purple-400'
                                                                : 'bg-blue-500/20 text-blue-400'
                                                                }`}>
                                                                {doc.type === 'assessment' ? 'Assessment' : 'Inkblot Test'}
                                                            </span>
                                                            {doc.type === 'assessment' && (
                                                                <>
                                                                    <span className="text-sm font-semibold text-teal-300">
                                                                        {doc.assessment_type}
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs ${doc.severity === 'severe' ? 'bg-red-500/20 text-red-400' :
                                                                        doc.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            'bg-green-500/20 text-green-400'
                                                                        }`}>
                                                                        {doc.severity}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {doc.type === 'assessment' && (
                                                            <div className="text-sm text-gray-400 mb-1">
                                                                <span className="font-medium">Score:</span> {doc.score}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-500">
                                                            Created: {doc.time_ago} • Shared: {new Date(doc.shared_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {doc.type === 'assessment' && (
                                                            <a
                                                                href={`${API_URL}/api/assessments/${doc.id}/pdf`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                View PDF
                                                            </a>
                                                        )}
                                                        {doc.type === 'inkblot' && (
                                                            <a
                                                                href={`${API_URL}/api/inkblot/${doc.id}/pdf`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                View PDF
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Patient Directory</h2>
                                <p className="text-gray-400">Manage and view insights for your patients</p>
                            </div>

                            {/* Search Bar */}
                            <div className="relative mb-8 max-w-2xl">
                                <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search patients by name or username..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#161b26] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all placeholder:text-gray-600"
                                />
                            </div>

                            {/* Patient Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredPatients.map(patient => (
                                    <div
                                        key={patient.id}
                                        onClick={() => fetchPatientInsights(patient.id)}
                                        className="bg-[#161b26] p-6 rounded-2xl border border-white/10 hover:border-teal-500/30 hover:bg-[#1a1f2e] transition-all cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/10 transition-colors"></div>

                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden relative">
                                                {patient.profile_picture ? (
                                                    <img
                                                        src={patient.profile_picture}
                                                        alt={patient.full_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <span>{patient.full_name.charAt(0)}</span>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-white mb-1">{patient.full_name}</h3>
                                            <p className="text-sm text-gray-500 mb-4">@{patient.username}</p>

                                            {patient.has_crisis ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20">
                                                    <AlertTriangle size={12} />
                                                    Crisis Alert
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                                                    <CheckCircle size={12} />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredPatients.length === 0 && (
                                <div className="text-center py-20 opacity-50">
                                    <Users size={48} className="mx-auto mb-4 text-gray-600" />
                                    <p className="text-gray-400">No patients found matching your search</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Inbox Only */}
                <div className="w-80 bg-[#161b26] border-l border-white/5 flex flex-col z-10 shadow-lg shrink-0">
                    <div className="p-4 border-b border-white/5 flex items-center gap-2">
                        <Inbox size={20} className="text-teal-400" />
                        <h3 className="font-bold text-lg text-white">Inbox</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        <div className="flex justify-between items-center px-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Pending Requests ({pendingRequests.length})
                            </span>
                            <button
                                onClick={fetchInbox}
                                disabled={refreshing}
                                className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-teal-400 ${refreshing ? 'animate-spin' : ''}`}
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-6 opacity-50 px-4">
                                <p className="text-xs">No pending requests</p>
                            </div>
                        ) : (
                            pendingRequests.map(request => (
                                <div
                                    key={request.id}
                                    className="bg-[#0f131c] p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                            {request.patient_name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm">{request.patient_name}</div>
                                            <div className="text-xs text-gray-500">{request.time_ago}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${request.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
                                            request.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                            {request.urgency}
                                        </span>
                                    </div>

                                    {request.notes && (
                                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{request.notes}</p>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleInboxAction(request.id, 'accept')}
                                            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle size={12} />
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleInboxAction(request.id, 'reject')}
                                            className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <XCircle size={12} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Upcoming Sessions Section */}
                        <div className="mt-6 px-2 mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Upcoming Sessions
                            </span>
                        </div>
                        {upcomingSessions.length === 0 ? (
                            <div className="text-center py-6 opacity-50 px-4">
                                <p className="text-xs">No upcoming sessions</p>
                            </div>
                        ) : (
                            upcomingSessions.map(request => (
                                <div
                                    key={request.id}
                                    className="bg-[#0f131c] p-3 rounded-xl border border-teal-500/20 hover:bg-white/5 transition-all"
                                >
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold border border-teal-500/20">
                                            {request.patient_name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-sm text-teal-100">{request.patient_name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={10} />
                                                {request.time_slot || 'Time TBD'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        {request.meeting_link ? (
                                            <div className="bg-teal-900/20 rounded p-2 mb-2 break-all text-[10px] text-teal-300 border border-teal-500/20">
                                                {request.meeting_link}
                                            </div>
                                        ) : (
                                            <div className="bg-yellow-500/10 rounded p-2 mb-2 text-[10px] text-yellow-500 border border-yellow-500/10 flex items-center gap-1">
                                                <AlertTriangle size={10} />
                                                Link not set
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleAddLink(request.id, request.meeting_link)}
                                            className="w-full py-1.5 bg-[#161b26] hover:bg-[#1f2937] text-gray-300 hover:text-white rounded text-xs font-medium transition-colors border border-white/10 flex items-center justify-center gap-1"
                                        >
                                            <LinkIcon size={12} />
                                            {request.meeting_link ? 'Update Link' : 'Add Meeting Link'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#161b26] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Meeting Link</h3>
                        <p className="text-sm text-gray-400 mb-4">Paste the video consultation link (Google Meet, Zoom, etc.)</p>

                        <input
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="w-full bg-[#0f131c] border border-white/10 rounded-lg p-3 text-white mb-4 focus:outline-none focus:border-teal-500"
                            placeholder="https://meet.google.com/..."
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveLink}
                                className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
                            >
                                Save Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                `
            }} />
        </div>
    );
};

export default CounsellorDashboardNew;
