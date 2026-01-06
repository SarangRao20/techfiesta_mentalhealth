import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import {
    Users,
    AlertTriangle,
    TrendingUp,
    Search,
    ExternalLink,
    ChevronRight,
    Activity
} from 'lucide-react';

const MentorDashboard = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/mentor/students`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching students:', error);
            setLoading(false);
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

    if (loading) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 bg-gray-900 min-h-screen text-gray-100">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                    Mentor Insights Dashboard
                </h1>
                <p className="text-gray-400 mt-2">Oversee student progress and provide timely support.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Student List Sidebar */}
                <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl overflow-hidden flex flex-col h-[70vh]">
                    <div className="flex items-center gap-2 mb-6 text-teal-400 font-semibold border-b border-gray-700 pb-4">
                        <Users size={20} />
                        <h2>My Students ({students.length})</h2>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {students.map(student => (
                            <button
                                key={student.id}
                                onClick={() => fetchInsights(student.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between group ${selectedStudent?.id === student.id
                                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg'
                                    : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                    }`}
                            >
                                <div>
                                    <div className="font-medium">{student.full_name}</div>
                                    <div className="text-xs opacity-60">@{student.username}</div>
                                </div>
                                <ChevronRight size={16} className={`transition-transform ${selectedStudent?.id === student.id ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Student Detail View */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    {selectedStudent && insights ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Header Info */}
                            <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 flex flex-wrap justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{selectedStudent.full_name}</h2>
                                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                                        <span className="flex items-center gap-1"><Activity size={14} className="text-teal-400" /> {selectedStudent.login_streak} Day Streak</span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                        <span>{selectedStudent.email}</span>
                                    </div>
                                </div>
                                <button className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors flex items-center gap-2 border border-gray-600">
                                    Initiate Message <ExternalLink size={14} />
                                </button>
                            </div>

                            {/* Insights Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Recent Assessments */}
                                <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-xl">
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                        <TrendingUp size={20} className="text-blue-400" />
                                        Clinical Assessments
                                    </h3>
                                    <div className="space-y-4">
                                        {insights.recent_assessments.map((a, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                                                <div>
                                                    <div className="text-sm font-medium text-blue-400">{a.type}</div>
                                                    <div className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString()}</div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${a.severity.toLowerCase().includes('severe') ? 'bg-red-500/20 text-red-400' :
                                                    a.severity.toLowerCase().includes('moderate') ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                    {a.severity}
                                                </div>
                                            </div>
                                        ))}
                                        {insights.recent_assessments.length === 0 && <p className="text-gray-500 italic text-center py-4">No recent assessments recorded.</p>}
                                    </div>
                                </div>

                                {/* Activity Feed */}
                                <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-xl">
                                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                        <Activity size={20} className="text-teal-400" />
                                        Universal Activity Log
                                    </h3>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {insights.recent_activity.map((l, i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 border-l-2 border-teal-500/30 bg-gray-900/30 rounded-r-2xl">
                                                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5"></div>
                                                <div>
                                                    <div className="text-sm text-gray-200 capitalize">{l.type.replace('_', ' ')}: {l.action}</div>
                                                    <div className="text-xs text-gray-500">{new Date(l.date).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Crisis Alerts Area */}
                            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
                                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                                    <AlertTriangle size={20} />
                                    Risk Indicators & Alerts
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-4 bg-gray-800 rounded-2xl border border-gray-700">
                                        <div className="text-xs text-gray-500 mb-1">Crisis Flags (30d)</div>
                                        <div className="text-2xl font-bold text-white">0</div>
                                    </div>
                                    <div className="p-4 bg-gray-800 rounded-2xl border border-gray-700">
                                        <div className="text-xs text-gray-500 mb-1">Consistency Score</div>
                                        <div className="text-2xl font-bold text-teal-400">85%</div>
                                    </div>
                                    <div className="p-4 bg-gray-800 rounded-2xl border border-gray-700">
                                        <div className="text-xs text-gray-500 mb-1">Engagement Level</div>
                                        <div className="text-2xl font-bold text-blue-400">High</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-gray-800 rounded-3xl border border-gray-700 border-dashed flex flex-col items-center justify-center text-gray-500 p-12 min-h-[60vh]">
                            <Users size={64} className="mb-4 opacity-10" />
                            <p className="text-lg">Select a student from the list to view detailed wellness insights</p>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}} />
        </div>
    );
};

export default MentorDashboard;
