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
    Calendar
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const CounsellorDashboardNew = () => {
    const [view, setView] = useState('inbox'); // 'inbox' or 'patients'
    const [inbox, setInbox] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    const COLORS = ['#2dd4bf', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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
        <div className="flex h-screen bg-[#0f131c] text-gray-100 font-sans overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-80 bg-[#161b26] border-r border-white/5 flex flex-col z-10 shadow-2xl">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Shield className="text-teal-400" size={24} />
                        Counsellor Panel
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Professional patient management</p>

                    {/* View Switcher */}
                    <div className="mt-6 flex gap-2">
                        <button
                            onClick={() => setView('inbox')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                view === 'inbox'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            <Inbox size={16} className="inline mr-1" />
                            Inbox {pendingRequests.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setView('patients')}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                view === 'patients'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            <Users size={16} className="inline mr-1" />
                            Patients
                        </button>
                    </div>

                    {view === 'patients' && (
                        <div className="mt-4 relative group">
                            <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-teal-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0f131c] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all placeholder:text-gray-600"
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {view === 'inbox' ? (
                        <>
                            <div className="flex justify-between items-center px-2 mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Consultation Requests ({inbox.length})
                                </span>
                                <button
                                    onClick={fetchInbox}
                                    disabled={refreshing}
                                    className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-teal-400 ${refreshing ? 'animate-spin' : ''}`}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>

                            {inbox.length === 0 ? (
                                <div className="text-center py-10 opacity-50 px-4">
                                    <Inbox size={40} className="mx-auto mb-3" />
                                    <p className="text-sm">No requests found</p>
                                </div>
                            ) : (
                                inbox.map(request => (
                                    <div
                                        key={request.id}
                                        className="bg-[#0f131c] p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                                {request.patient_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">{request.patient_name}</div>
                                                <div className="text-xs text-gray-500">{request.time_ago}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                request.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
                                                request.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                                {request.urgency}
                                            </span>
                                        </div>

                                        {request.notes && (
                                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{request.notes}</p>
                                        )}

                                        {request.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleInboxAction(request.id, 'accept')}
                                                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <CheckCircle size={14} />
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleInboxAction(request.id, 'reject')}
                                                    className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <XCircle size={14} />
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`text-xs font-medium px-3 py-1.5 rounded-lg text-center ${
                                                request.status === 'booked' ? 'bg-green-500/20 text-green-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {request.status === 'booked' ? '✓ Accepted' : '✗ Rejected'}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center px-2 mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    My Patients ({filteredPatients.length})
                                </span>
                            </div>

                            {filteredPatients.length === 0 ? (
                                <div className="text-center py-10 opacity-50 px-4">
                                    <Users size={40} className="mx-auto mb-3" />
                                    <p className="text-sm">No patients found</p>
                                </div>
                            ) : (
                                filteredPatients.map(patient => (
                                    <button
                                        key={patient.id}
                                        onClick={() => fetchPatientInsights(patient.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                                            selectedPatient?.id === patient.id
                                                ? 'bg-gradient-to-r from-teal-600/20 to-teal-900/20 border-teal-500/30 shadow-lg'
                                                : 'bg-[#0f131c] border-white/10 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                                {patient.full_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{patient.full_name}</div>
                                                <div className="text-xs text-gray-500">@{patient.username}</div>
                                            </div>
                                            {patient.has_crisis && (
                                                <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-[#0f131c] overflow-y-auto custom-scrollbar">
                {selectedPatient && insights ? (
                    <div className="p-8 max-w-6xl mx-auto space-y-6">
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
                                        <span className={`px-3 py-1 rounded-full font-medium ${
                                            insights.patient_info.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' :
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
                                    <span className={`px-4 py-2 rounded-xl font-medium ${
                                        insights.patient_info.current_emotional_intensity === 'critical' ? 'bg-red-500/20 text-red-400' :
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
                                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                                    assessment.severity === 'severe' ? 'bg-red-500/20 text-red-400' :
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
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                    alert.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
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
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                            {view === 'inbox' ? <Inbox size={40} className="opacity-50" /> : <Users size={40} className="opacity-50" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-300 mb-2">
                            {view === 'inbox' ? 'Manage Consultation Requests' : 'Select a Patient'}
                        </h3>
                        <p className="max-w-md text-center text-gray-500">
                            {view === 'inbox' 
                                ? 'Review and respond to consultation requests from the inbox'
                                : 'Select a patient from the sidebar to view their comprehensive insights and assessment results'
                            }
                        </p>
                    </div>
                )}
            </div>

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
