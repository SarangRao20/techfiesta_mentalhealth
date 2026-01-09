import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight,
  Activity,
  RefreshCw,
  Shield,
  MessageSquare,
  User,
  Bell,
  X
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const MentorDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showActivityDashboard, setShowActivityDashboard] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Helper to map severity to number
  const getSeverityScore = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'severe': return 3;
      case 'moderate': return 2;
      case 'mild': return 1;
      default: return 0;
    }
  };

  // Helper to get status badge color and style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Doing well':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: '✓' };
      case 'Needs attention':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '⚠' };
      case 'Critical':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: '!' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: '○' };
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchNotifications();

    // Poll for notifications every 30 seconds
    const notifInterval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(notifInterval);
  }, []);

  const fetchStudents = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/mentor/students`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError("Failed to load students. Check backend connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mentor/notifications`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      await fetch(`${API_URL}/api/mentor/notifications`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const fetchInsights = async (studentId) => {
    try {
      const response = await fetch(`${API_URL}/api/mentor/student/${studentId}/insights`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
        setSelectedStudent(students.find(s => s.id === studentId));
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0f131c] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  return (
    <div className="h-full bg-[#161b26] text-white overflow-y-auto w-full p-8">
      {!selectedStudent ? (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mb-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center gap-2 mb-3 bg-[#1a1f2e] px-4 py-1.5 rounded-full border border-white/5 shadow-lg shadow-black/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-[0.2em]">Mentor Panel</span>
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight">
                Student Wellness Overview
              </h1>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <button
                onClick={fetchStudents}
                className={`p-3 bg-[#1a1f2e] border border-white/10 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent w-full mb-8"></div>

          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <StatCard
              title="Total Students"
              value={students.length}
              countColor="text-blue-400"
              borderColor="border-white/10"
            />
            <StatCard
              title="Doing Well"
              value={students.filter(s => s.status === 'Doing well').length}
              countColor="text-green-400"
              borderColor="border-white/10"
            />
            <StatCard
              title="Needs Attention"
              value={students.filter(s => s.status === 'Needs attention').length}
              countColor="text-yellow-400"
              borderColor="border-white/10"
            />
            <StatCard
              title="Critical"
              value={students.filter(s => s.status === 'Critical').length}
              countColor="text-red-400"
              borderColor="border-white/10"
            />
            <StatCard
              title="At Risk"
              value={students.filter(s => s.has_risk).length}
              countColor="text-red-500"
              borderColor="border-white/10"
            />
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[400px] bg-transparent border border-white/20 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-white/40 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Student Grid */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStudents.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onClick={() => fetchInsights(student.id)}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 opacity-50">
              <p>No students found matching your search.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-4">
            <button
              onClick={() => setSelectedStudent(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ChevronRight size={16} className="rotate-180" />
              Back to Dashboard
            </button>
          </div>

          {/* Header Stats */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1f2e] to-[#161b26] border border-white/5 p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
                  {selectedStudent.profile_picture ? (
                    <img
                      src={selectedStudent.profile_picture}
                      alt={selectedStudent.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span>{selectedStudent.full_name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">{selectedStudent.full_name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{selectedStudent.email}</span>
                    <span className="flex items-center gap-1.5 font-medium text-teal-400">
                      <Activity size={14} />
                      Active Session
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/app/profile', {
                    state: {
                      studentId: selectedStudent.id,
                      viewAsStudent: true
                    }
                  })}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                >
                  View Full Profile
                  <ExternalLink size={14} />
                </button>
                <button
                  onClick={() => setShowActivityDashboard(true)}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-teal-500/20 flex items-center gap-2"
                >
                  <Activity size={14} />
                  View Activity Dashboard
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5">
              <div className="bg-[#0f131c]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Engagement</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${insights.student_info.engagement === "High" ? "text-green-400" :
                    insights.student_info.engagement === "Medium" ? "text-yellow-400" : "text-gray-400"
                    }`}>{insights.student_info.engagement}</span>
                  <span className="text-xs text-gray-500">Tier</span>
                </div>
              </div>
              <div className="bg-[#0f131c]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Consistency Streak</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{insights.student_info.streak}</span>
                  <span className="text-xs text-gray-500">Days</span>
                </div>
              </div>
              <div className={`bg-[#0f131c]/50 p-4 rounded-xl border backdrop-blur-sm ${insights.student_info.crisis_flags > 0 ? 'border-red-500/30 bg-red-900/10' : 'border-white/5'
                }`}>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Crisis Indicators (30d)</div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${insights.student_info.crisis_flags > 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>{insights.student_info.crisis_flags}</span>
                  {insights.student_info.crisis_flags > 0 && <AlertTriangle size={18} className="text-red-500 animate-pulse" />}
                </div>
              </div>
            </div>

            {/* Emotional State & Status */}
            {(insights.student_info.current_emotional_state || insights.student_info.status) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {insights.student_info.current_emotional_state && (
                  <div className="bg-[#0f131c]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Current Emotional State</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-teal-300 capitalize">
                        {insights.student_info.current_emotional_state}
                      </span>
                      {insights.student_info.current_emotional_intensity && (
                        <span className={`text-xs px-2 py-1 rounded-full ${insights.student_info.current_emotional_intensity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          insights.student_info.current_emotional_intensity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            insights.student_info.current_emotional_intensity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                          }`}>
                          {insights.student_info.current_emotional_intensity}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {insights.student_info.status && (
                  <div className="bg-[#0f131c]/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Overall Status</div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = getStatusBadge(insights.student_info.status);
                        return (
                          <span className={`px-3 py-1 rounded-lg border ${badge.bg} ${badge.border} ${badge.text} font-semibold`}>
                            {badge.icon} {insights.student_info.status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Crisis Alerts Section (if any) */}
          {insights.crisis_alerts && insights.crisis_alerts.length > 0 && (
            <div className="bg-gradient-to-br from-red-900/20 to-red-950/30 rounded-3xl p-6 border border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-400" size={24} />
                <h3 className="text-lg font-bold text-white">Recent Crisis Alerts</h3>
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30">
                  {insights.crisis_alerts.length} alert{insights.crisis_alerts.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {insights.crisis_alerts.map((alert, idx) => (
                  <div key={idx} className="bg-[#0f131c]/50 p-4 rounded-xl border border-red-500/20">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${alert.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
                        alert.severity === 'high' ? 'bg-orange-500/30 text-orange-300' :
                          'bg-yellow-500/30 text-yellow-300'
                        }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{alert.message_snippet}</p>
                    {!alert.acknowledged && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                        Needs acknowledgment
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onboarding Report Section */}
          {selectedStudent?.is_onboarded !== false && (
            <div className="bg-gradient-to-br from-purple-900/20 to-indigo-950/30 rounded-3xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="text-purple-400" size={24} />
                  <h3 className="text-lg font-bold text-white">Onboarding Report</h3>
                  <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">
                    Initial Assessment
                  </span>
                </div>
                <button
                  onClick={() => {
                    window.open(`${API_URL}/api/mentor/student/${selectedStudent.id}/onboarding-report/pdf`, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <ExternalLink size={16} />
                  Download PDF
                </button>
              </div>
              <OnboardingReportView studentId={selectedStudent.id} />
            </div>
          )}

          {/* Activity Stats */}
          {insights.activity_stats && (
            <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="text-teal-400" />
                Activity Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">Meditation</div>
                  <div className="text-2xl font-bold text-teal-400">{insights.activity_stats.meditation_count}</div>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">Assessments</div>
                  <div className="text-2xl font-bold text-blue-400">{insights.activity_stats.assessment_count}</div>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">Chat Sessions</div>
                  <div className="text-2xl font-bold text-purple-400">{insights.activity_stats.chat_count}</div>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">Venting</div>
                  <div className="text-2xl font-bold text-pink-400">{insights.activity_stats.venting_count}</div>
                </div>
              </div>
            </div>
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

            {/* Feed Activity */}
            <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5 flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="text-teal-400" />
                  Activity Timeline
                </h3>
                <span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded-lg border border-white/5">Real-time</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {insights.recent_activity.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                    <Activity size={32} className="mb-2" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  insights.recent_activity.map((l, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-teal-500 ring-4 ring-teal-500/10 mt-2"></div>
                        <div className="flex-1 w-0.5 bg-white/5 my-1 group-last:hidden"></div>
                      </div>
                      <div className="flex-1 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-teal-300 capitalize">{l.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-gray-600 font-mono">{new Date(l.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-400 capitalize">{l.action}</p>
                        {l.duration && (
                          <p className="text-xs text-gray-600 mt-1">Duration: {Math.floor(l.duration / 60)}m {l.duration % 60}s</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wellness Trends (Replacing Clinical Overview) */}
            <div className="bg-[#161b26] rounded-3xl p-6 border border-white/5 h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="text-teal-400" />
                  Wellness Trends
                </h3>
              </div>
              <div className="flex-1 min-h-[300px] w-full">
                {insights.recent_assessments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                    <TrendingUp size={32} className="mb-2" />
                    <p>No assessment data for trends</p>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...insights.recent_assessments].reverse()}>
                        <defs>
                          <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={[0, 4]} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#161b26', borderColor: '#334155', borderRadius: '12px' }}
                          itemStyle={{ color: '#cbd5e1' }}
                        />
                        <Area
                          type="monotone"
                          dataKey={(data) => getSeverityScore(data.severity)}
                          stroke="#2dd4bf"
                          fillOpacity={1}
                          fill="url(#colorSeverity)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Activity Dashboard Modal */}
          {
            showActivityDashboard && insights && selectedStudent && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#1a1f2e] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                  <div className="sticky top-0 bg-[#1a1f2e] border-b border-white/10 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Activity className="text-teal-400" size={28} />
                      Activity Dashboard - {selectedStudent.full_name}
                    </h2>
                    <button
                      onClick={() => setShowActivityDashboard(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Activity Breakdown - Donut Chart */}
                    <div className="bg-[#0f131c]/50 p-6 rounded-xl border border-white/5">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-teal-400" />
                        Activity Breakdown (Last 30 Days)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Meditation', value: insights.activity_stats?.meditation_count || 0, color: '#14b8a6' },
                                  { name: 'Chatbot', value: insights.activity_stats?.chat_count || 0, color: '#8b5cf6' },
                                  { name: 'Assessments', value: insights.activity_stats?.assessment_count || 0, color: '#f59e0b' },
                                  { name: 'Venting', value: insights.activity_stats?.venting_count || 0, color: '#ef4444' }
                                ].filter(item => item.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {[
                                  { name: 'Meditation', value: insights.activity_stats?.meditation_count || 0, color: '#14b8a6' },
                                  { name: 'Chatbot', value: insights.activity_stats?.chat_count || 0, color: '#8b5cf6' },
                                  { name: 'Assessments', value: insights.activity_stats?.assessment_count || 0, color: '#f59e0b' },
                                  { name: 'Venting', value: insights.activity_stats?.venting_count || 0, color: '#ef4444' }
                                ].filter(item => item.value > 0).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                            <span className="text-gray-300 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                              Meditation Sessions
                            </span>
                            <span className="text-white font-bold">{insights.activity_stats?.meditation_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <span className="text-gray-300 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              Chatbot Interactions
                            </span>
                            <span className="text-white font-bold">{insights.activity_stats?.chat_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <span className="text-gray-300 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              Assessments Completed
                            </span>
                            <span className="text-white font-bold">{insights.activity_stats?.assessment_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <span className="text-gray-300 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Venting Posts
                            </span>
                            <span className="text-white font-bold">{insights.activity_stats?.venting_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 mt-2">
                            <span className="text-gray-300 font-semibold">Total Activities</span>
                            <span className="text-teal-400 font-bold text-xl">{insights.activity_stats?.total_activities || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Crisis Timeline */}
                    <div className="bg-[#0f131c]/50 p-6 rounded-xl border border-white/5">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-400" />
                        Crisis Timeline (Last 30 Days)
                      </h3>
                      {insights.crisis_alerts && insights.crisis_alerts.length > 0 ? (
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-orange-500 to-yellow-500"></div>
                          <div className="space-y-4">
                            {insights.crisis_alerts.map((alert, index) => {
                              const severityColors = {
                                critical: { bg: 'bg-red-500/20', border: 'border-red-500', dot: 'bg-red-500', text: 'text-red-400' },
                                high: { bg: 'bg-orange-500/20', border: 'border-orange-500', dot: 'bg-orange-500', text: 'text-orange-400' },
                                moderate: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-400' },
                                low: { bg: 'bg-blue-500/20', border: 'border-blue-500', dot: 'bg-blue-500', text: 'text-blue-400' }
                              };
                              const colors = severityColors[alert.severity] || severityColors.moderate;

                              return (
                                <div key={alert.id} className="relative pl-12">
                                  <div className={`absolute left-2.5 w-3 h-3 rounded-full ${colors.dot} ring-4 ring-[#0f131c]`}></div>
                                  <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs font-semibold rounded-md uppercase border ${colors.border}`}>
                                          {alert.severity}
                                        </span>
                                        <span className="text-sm text-gray-400">{alert.alert_type?.replace('_', ' ')}</span>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {new Date(alert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    {alert.message_snippet && (
                                      <p className="text-gray-300 text-sm italic">"{alert.message_snippet}"</p>
                                    )}
                                    {alert.acknowledged && (
                                      <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Acknowledged
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Shield size={48} className="mx-auto mb-3 opacity-50" />
                          <p>No crisis alerts in the last 30 days - Great progress! 🎉</p>
                        </div>
                      )}
                    </div>

                    {/* Emotional Trend Line Chart */}
                    <div className="bg-[#0f131c]/50 p-6 rounded-xl border border-white/5">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-purple-400" />
                        Emotional Intensity Trend (Last 30 Days)
                      </h3>
                      {insights.emotional_trends && insights.emotional_trends.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={insights.emotional_trends.map(trend => ({
                              date: new Date(trend.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                              intensity: trend.emotional_intensity === 'critical' ? 4 :
                                trend.emotional_intensity === 'high' ? 3 :
                                  trend.emotional_intensity === 'moderate' ? 2 : 1,
                              state: trend.emotional_state,
                              fullDate: trend.timestamp
                            })).reverse()}>
                              <defs>
                                <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis
                                stroke="#6b7280"
                                domain={[0, 4]}
                                ticks={[1, 2, 3, 4]}
                                tickFormatter={(value) => ['Low', 'Moderate', 'High', 'Critical'][value - 1]}
                                style={{ fontSize: '12px' }}
                              />
                              <RechartsTooltip
                                contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                labelStyle={{ color: '#fff' }}
                                formatter={(value, name, props) => [
                                  `${props.payload.state} (${['Low', 'Moderate', 'High', 'Critical'][value - 1]})`,
                                  'Emotional State'
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="intensity"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="url(#emotionGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No emotional data available yet</p>
                        </div>
                      )}
                    </div>

                    {/* Recent Activity List */}
                    <div className="bg-[#0f131c]/50 p-6 rounded-xl border border-white/5">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-blue-400" />
                        Recent Activity Feed
                      </h3>
                      {insights.recent_activity && insights.recent_activity.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                          {insights.recent_activity.slice(0, 15).map((activity, index) => {
                            const activityIcons = {
                              meditation: { icon: '🧘', color: 'text-teal-400', bg: 'bg-teal-500/10' },
                              chat: { icon: '💬', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                              assessment: { icon: '📊', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                              venting: { icon: '🗨️', color: 'text-red-400', bg: 'bg-red-500/10' },
                              default: { icon: '✨', color: 'text-gray-400', bg: 'bg-gray-500/10' }
                            };
                            const config = activityIcons[activity.type] || activityIcons.default;

                            return (
                              <div key={index} className={`${config.bg} border border-white/5 rounded-lg p-3 flex items-center justify-between hover:border-white/10 transition`}>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{config.icon}</span>
                                  <div>
                                    <p className={`${config.color} font-medium capitalize`}>{activity.type}</p>
                                    <p className="text-sm text-gray-400">{activity.action}</p>
                                    {activity.duration && (
                                      <p className="text-xs text-gray-500 mt-1">Duration: {activity.duration} min</p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No recent activity</p>
                        </div>
                      )}
                    </div>
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
      `}} />
        </div>
      )}
    </div>
  );
};

// OnboardingReportView Component
const OnboardingReportView = ({ studentId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_URL}/api/mentor/student/${studentId}/onboarding-report`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setReport(data);
        }
      } catch (error) {
        console.error('Error fetching onboarding report:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchReport();
    }
  }, [studentId]);

  const questionLabels = {
    'adjustment': 'Adjustment to New Environment',
    'social': 'Social Connections',
    'academic': 'Academic Pressure',
    'support': 'Support System',
    'anxiety': 'Mental Well-being'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="animate-spin text-purple-400" size={24} />
      </div>
    );
  }

  if (!report || !report.onboarding_data) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No onboarding data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 mb-2">
        Completed: {new Date(report.onboarding_data.completed_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
      {Object.entries(report.onboarding_data.responses).map(([key, value]) => (
        <div key={key} className="bg-[#0f131c]/50 p-4 rounded-xl border border-purple-500/10">
          <div className="text-sm font-semibold text-purple-300 mb-2">
            {questionLabels[key] || key.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-gray-300 text-sm italic">
            "{value}"
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentorDashboard;

// Helper Components
const StatCard = ({ title, value, countColor, borderColor }) => (
  <div className={`bg-[#0f131c] px-6 py-6 rounded-3xl border ${borderColor} flex flex-col justify-center h-32 hover:bg-white/5 transition-colors`}>
    <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
    <div className={`text-4xl font-bold ${countColor} mt-2`}>{value}</div>
  </div>
);

const StudentCard = ({ student, onClick, getStatusBadge }) => {
  const statusBadge = getStatusBadge(student.status);

  // Custom badge styling based on design
  let badgeStyle = "bg-white/5 text-gray-400 border-white/5";
  if (student.status === 'Doing well') badgeStyle = "bg-green-500/10 text-green-400 border-transparent";
  if (student.status === 'Needs attention') badgeStyle = "bg-yellow-500/10 text-yellow-500 border-transparent";
  if (student.status === 'Critical') badgeStyle = "bg-red-500/10 text-red-500 border-transparent";

  // Simulate stats (since they aren't in the base list payload, we'll placeholder or use real if avail)
  // Just placeholders for visual match as per instructions "rest keep all the logic same"
  // If the backend doesn't provide these, we show "-"

  return (
    <div
      onClick={onClick}
      className={`bg-[#0f131c] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer relative group ${student.status === 'Critical' ? 'border-red-500/30' : ''
        }`}
    >
      {/* Risk Indicator if any */}
      {student.has_risk && (
        <div className="absolute top-4 left-4 z-10 w-fit">
          <div className="absolute top-0 right-0 -mr-1 -mt-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden ${student.status === 'Doing well' ? 'bg-blue-500 text-white' :
            student.status === 'Critical' ? 'bg-red-500 text-white' : 'bg-blue-400 text-white'
            }`}>
            {student.profile_picture ? (
              <img src={student.profile_picture} alt={student.full_name} className="w-full h-full object-cover" />
            ) : (
              <span>{student.full_name.charAt(0)}</span>
            )}
          </div>
          {student.has_risk && (
            <div className="absolute -top-1 -right-2 bg-red-500/20 border border-red-500 text-red-300 text-[10px] px-1.5 py-0.5 rounded-full">
              Risk
            </div>
          )}
        </div>

        <h3 className="text-white font-bold text-lg mb-1">{student.full_name}</h3>
        <p className="text-gray-500 text-xs text-center">@{student.username || student.full_name.split(' ')[0]}</p>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-6">
        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${badgeStyle}`}>
          {student.status || 'Unknown'}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Engagement</div>
          <div className="text-white text-sm font-medium">-</div>
        </div>
        <div className="text-center border-l border-white/5">
          <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Streak</div>
          <div className="text-white text-sm font-medium">-</div>
        </div>
        <div className="text-center border-l border-white/5">
          <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Flags</div>
          <div className="text-white text-sm font-medium">
            {student.has_risk ? '!' : '0'}
          </div>
        </div>
      </div>
    </div>
  );
};