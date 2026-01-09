import React, { useEffect, useState } from 'react';
import { 
    TrendingUp, TrendingDown, Activity, Brain, Heart, 
    AlertCircle, CheckCircle, Download, ChevronLeft, 
    Sparkles, Target, Shield, Calendar, Flame, MessageCircle,
    Clock, Award
} from 'lucide-react';

const API_URL = 'http://localhost:5000'; // Replace with your actual API URL

const AssessmentResults = ({ result, onBack }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserInsights();
    }, []);

    const fetchUserInsights = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setInsights(data);
            }
        } catch (e) {
            console.error("Failed to fetch insights", e);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityConfig = (severity) => {
        const lower = severity?.toLowerCase() || '';
        if (lower.includes('severe') || lower.includes('high')) {
            return {
                color: 'red',
                gradient: 'from-red-500 to-rose-500',
                bgGradient: 'from-red-500/20 to-rose-500/20',
                textColor: 'text-red-400',
                icon: AlertCircle
            };
        }
        if (lower.includes('moderate') || lower.includes('medium')) {
            return {
                color: 'yellow',
                gradient: 'from-yellow-500 to-orange-500',
                bgGradient: 'from-yellow-500/20 to-orange-500/20',
                textColor: 'text-yellow-400',
                icon: AlertCircle
            };
        }
        if (lower.includes('mild') || lower.includes('low')) {
            return {
                color: 'blue',
                gradient: 'from-blue-500 to-cyan-500',
                bgGradient: 'from-blue-500/20 to-cyan-500/20',
                textColor: 'text-blue-400',
                icon: CheckCircle
            };
        }
        return {
            color: 'green',
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-500/20 to-teal-500/20',
            textColor: 'text-green-400',
            icon: CheckCircle
        };
    };

    const severityConfig = getSeverityConfig(result?.analysis?.severity_category);
    const SeverityIcon = severityConfig.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f131c] to-[#1a1025] text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group"
                >
                    <ChevronLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Assessments</span>
                </button>

                {/* Hero Score Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${severityConfig.bgGradient} opacity-50`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    <div className="relative z-10 p-8 md:p-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${severityConfig.gradient} flex items-center justify-center shadow-xl`}>
                                    <Brain size={32} />
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                                        Assessment Complete
                                    </h1>
                                    <p className="text-lg text-neutral-300">
                                        {result?.assessment_type || 'Mental Health'} Screening Results
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-center bg-black/30 backdrop-blur-xl px-10 py-6 rounded-2xl border border-white/10">
                                <div className={`text-7xl font-bold bg-gradient-to-r ${severityConfig.gradient} bg-clip-text text-transparent`}>
                                    {result?.score}
                                </div>
                                <div className="text-sm uppercase tracking-wider mt-2 text-neutral-400 font-semibold">
                                    Total Score
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-6 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${severityConfig.gradient} flex items-center justify-center`}>
                                <SeverityIcon size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-neutral-400 mb-1">Severity Level</div>
                                <div className={`text-3xl font-bold ${severityConfig.textColor}`}>
                                    {result?.analysis?.severity_category}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column - Detailed Analysis */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Interpretation Card */}
                        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                    <Sparkles size={24} />
                                </div>
                                <h3 className="text-2xl font-bold">What This Means</h3>
                            </div>
                            <p className="text-neutral-300 leading-relaxed text-lg">
                                {result?.analysis?.interpretation || result?.analysis?.user_safe?.interpretation}
                            </p>
                        </div>

                        {/* Two Column Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Implications */}
                            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                                        <Heart size={20} />
                                    </div>
                                    <h4 className="font-semibold text-lg">Impact on Your Life</h4>
                                </div>
                                <p className="text-sm text-neutral-400 leading-relaxed">
                                    {result?.analysis?.implication || result?.analysis?.user_safe?.implication}
                                </p>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                        <Target size={20} />
                                    </div>
                                    <h4 className="font-semibold text-lg">What You Can Do</h4>
                                </div>
                                <ul className="space-y-3">
                                    {(result?.analysis?.recommendations || result?.analysis?.user_safe?.recommendations || []).map((rec, i) => (
                                        <li key={i} className="text-sm text-neutral-300 flex gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <CheckCircle className="text-green-400" size={12} />
                                            </div>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Protective Factors */}
                        {result?.analysis?.user_safe?.protective_factors && (
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-3xl border border-green-500/20 p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                        <Shield size={24} />
                                    </div>
                                    <h4 className="text-2xl font-bold text-green-300">Your Strengths</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.analysis.user_safe.protective_factors.map((factor, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 bg-black/20 rounded-xl border border-green-500/20">
                                            <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Award className="text-green-400" size={14} />
                                            </div>
                                            <span className="text-sm text-neutral-200">{factor}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next Steps */}
                        {result?.analysis?.user_safe?.next_steps && (
                            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <Target size={24} />
                                    </div>
                                    <h4 className="text-2xl font-bold">Recommended Next Steps</h4>
                                </div>
                                <div className="space-y-4">
                                    {result.analysis.user_safe.next_steps.map((step, i) => (
                                        <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 font-bold text-lg`}>
                                                {i + 1}
                                            </div>
                                            <span className="text-neutral-200 leading-relaxed pt-1">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - User Insights & Actions */}
                    <div className="space-y-6">
                        
                        {/* Current Streak */}
                        {insights && (
                            <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-xl rounded-3xl border border-orange-500/30 p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                                        <Flame size={20} />
                                    </div>
                                    <h4 className="font-semibold text-lg text-orange-300">Your Streak</h4>
                                </div>
                                <div className="text-center py-6">
                                    <div className="relative inline-block">
                                        <div className="text-7xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                            {insights.streak || 0}
                                        </div>
                                        <div className="absolute -top-2 -right-2">
                                            <Flame className="text-orange-500 animate-pulse" size={32} />
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-400 mt-3 font-medium">
                                        {insights.streak === 1 ? 'Day Streak' : 'Days Streak'}
                                    </div>
                                </div>
                                <p className="text-xs text-center text-neutral-400 bg-black/20 p-3 rounded-xl">
                                    🎯 Keep checking in daily to maintain your wellness routine!
                                </p>
                            </div>
                        )}

                        {/* Activity Summary */}
                        {insights && (
                            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                        <Activity size={20} />
                                    </div>
                                    <h4 className="font-semibold text-lg">Your Activity</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Brain size={16} className="text-blue-400" />
                                            </div>
                                            <span className="text-sm text-neutral-300">Assessments</span>
                                        </div>
                                        <span className="font-bold text-xl text-blue-400">
                                            {insights.total_assessments || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <MessageCircle size={16} className="text-purple-400" />
                                            </div>
                                            <span className="text-sm text-neutral-300">Chat Sessions</span>
                                        </div>
                                        <span className="font-bold text-xl text-purple-400">
                                            {insights.total_chats || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                <Clock size={16} className="text-green-400" />
                                            </div>
                                            <span className="text-sm text-neutral-300">Meditation Min</span>
                                        </div>
                                        <span className="font-bold text-xl text-green-400">
                                            {insights.meditation_minutes || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mood Trend */}
                        {insights?.mood_trend && (
                            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                                        <Heart size={20} />
                                    </div>
                                    <h4 className="font-semibold text-lg">Recent Trend</h4>
                                </div>
                                <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                                    {insights.mood_trend === 'improving' ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                                <TrendingUp className="text-green-400" size={24} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg text-green-400">Improving</div>
                                                <div className="text-xs text-neutral-400">Keep up the great work! 🌟</div>
                                            </div>
                                        </div>
                                    ) : insights.mood_trend === 'declining' ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                                <TrendingDown className="text-red-400" size={24} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg text-red-400">Needs Attention</div>
                                                <div className="text-xs text-neutral-400">Consider reaching out 💙</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                <Activity className="text-blue-400" size={24} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg text-blue-400">Stable</div>
                                                <div className="text-xs text-neutral-400">Maintaining balance ⚖️</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            <button
                                onClick={() => window.open(`${API_URL}/api/assessments/export/${result.id}`, '_blank')}
                                className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${severityConfig.gradient} hover:shadow-2xl hover:shadow-purple-500/30 transform hover:-translate-y-1`}
                            >
                                <Download size={20} />
                                Download Full Report
                            </button>
                            
                            <button
                                onClick={() => window.location.href = '/app/consultation'}
                                className="w-full py-4 rounded-2xl font-semibold transition-all bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/30 transform hover:-translate-y-1"
                            >
                                💬 Talk to a Counsellor
                            </button>

                            <button
                                onClick={onBack}
                                className="w-full py-4 rounded-2xl font-semibold transition-all bg-white/5 hover:bg-white/10 border border-white/10 transform hover:-translate-y-1"
                            >
                                Take Another Assessment
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    );
};

export default AssessmentResults;