import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { 
    TrendingUp, TrendingDown, Activity, Brain, Heart, 
    AlertCircle, CheckCircle, Download, ChevronLeft, 
    Sparkles, Target, Shield, Calendar
} from 'lucide-react';

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

    const getSeverityColor = (severity) => {
        const lower = severity?.toLowerCase() || '';
        if (lower.includes('severe') || lower.includes('high')) return 'red';
        if (lower.includes('moderate') || lower.includes('medium')) return 'yellow';
        if (lower.includes('mild') || lower.includes('low')) return 'blue';
        return 'green';
    };

    const severityColor = getSeverityColor(result?.analysis?.severity_category);
    const colorClasses = {
        red: 'bg-red-900/20 border-red-500/30 text-red-300',
        yellow: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
        blue: 'bg-blue-900/20 border-blue-500/30 text-blue-300',
        green: 'bg-green-900/20 border-green-500/30 text-green-300'
    };

    return (
        <div className="min-h-screen bg-[#0f131c] text-white p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header with Score */}
                <div className={`rounded-2xl border p-8 ${colorClasses[severityColor]}`}>
                    <button
                        onClick={onBack}
                        className="mb-4 flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft size={16} /> Back to Assessments
                    </button>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <Brain className="text-white" size={40} />
                                Assessment Complete
                            </h1>
                            <p className="text-lg opacity-80">
                                {result?.assessment_type || 'Mental Health'} Screening Results
                            </p>
                        </div>
                        
                        <div className="text-center bg-black/20 px-8 py-4 rounded-xl">
                            <div className="text-6xl font-bold">{result?.score}</div>
                            <div className="text-sm uppercase tracking-wider mt-2 opacity-70">
                                Total Score
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={24} />
                            <span className="text-2xl font-semibold">
                                {result?.analysis?.severity_category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column - Analysis */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Interpretation */}
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-400">
                                <Sparkles size={20} /> What This Means
                            </h3>
                            <p className="text-neutral-300 leading-relaxed">
                                {result?.analysis?.interpretation || result?.analysis?.user_safe?.interpretation}
                            </p>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Implications */}
                            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <Heart className="text-pink-400" size={18} />
                                    Impact on Your Life
                                </h4>
                                <p className="text-sm text-neutral-400 leading-relaxed">
                                    {result?.analysis?.implication || result?.analysis?.user_safe?.implication}
                                </p>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <Target className="text-green-400" size={18} />
                                    What You Can Do
                                </h4>
                                <ul className="space-y-2">
                                    {(result?.analysis?.recommendations || result?.analysis?.user_safe?.recommendations || []).map((rec, i) => (
                                        <li key={i} className="text-sm text-neutral-400 flex gap-2">
                                            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={14} />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Protective Factors */}
                        {result?.analysis?.user_safe?.protective_factors && (
                            <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 rounded-xl border border-green-500/20 p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-300">
                                    <Shield className="text-green-400" size={18} />
                                    Your Strengths
                                </h4>
                                <ul className="space-y-2">
                                    {result.analysis.user_safe.protective_factors.map((factor, i) => (
                                        <li key={i} className="text-sm text-neutral-300 flex gap-2">
                                            <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={14} />
                                            <span>{factor}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Next Steps */}
                        {result?.analysis?.user_safe?.next_steps && (
                            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2 text-purple-400">
                                    <Target size={18} />
                                    Recommended Next Steps
                                </h4>
                                <ul className="space-y-3">
                                    {result.analysis.user_safe.next_steps.map((step, i) => (
                                        <li key={i} className="text-sm text-neutral-300 flex gap-3 p-3 bg-white/5 rounded-lg">
                                            <span className="text-purple-400 font-bold">{i + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Right Column - User Insights */}
                    <div className="space-y-6">
                        
                        {/* Current Streak */}
                        {insights && (
                            <div className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 rounded-xl border border-orange-500/20 p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2 text-orange-300">
                                    <Calendar className="text-orange-400" size={18} />
                                    Your Journey
                                </h4>
                                <div className="text-center py-4">
                                    <div className="text-5xl font-bold text-orange-400">
                                        {insights.streak || 0}
                                    </div>
                                    <div className="text-sm opacity-70 mt-2">Day Streak</div>
                                </div>
                                <p className="text-xs text-neutral-400 mt-4 text-center">
                                    Keep checking in to maintain your wellness routine!
                                </p>
                            </div>
                        )}

                        {/* Activity Summary */}
                        {insights && (
                            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <Activity className="text-blue-400" size={18} />
                                    Your Activity
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                        <span className="text-sm">Assessments Taken</span>
                                        <span className="font-bold text-blue-400">
                                            {insights.total_assessments || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                        <span className="text-sm">Chat Sessions</span>
                                        <span className="font-bold text-purple-400">
                                            {insights.total_chats || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                        <span className="text-sm">Meditation Minutes</span>
                                        <span className="font-bold text-green-400">
                                            {insights.meditation_minutes || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mood Trend */}
                        {insights?.mood_trend && (
                            <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                    <Heart className="text-pink-400" size={18} />
                                    Recent Trend
                                </h4>
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                                    {insights.mood_trend === 'improving' ? (
                                        <>
                                            <TrendingUp className="text-green-400" size={24} />
                                            <div>
                                                <div className="font-semibold text-green-400">Improving</div>
                                                <div className="text-xs text-neutral-400">Keep up the great work!</div>
                                            </div>
                                        </>
                                    ) : insights.mood_trend === 'declining' ? (
                                        <>
                                            <TrendingDown className="text-red-400" size={24} />
                                            <div>
                                                <div className="font-semibold text-red-400">Needs Attention</div>
                                                <div className="text-xs text-neutral-400">Consider reaching out for support</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Activity className="text-blue-400" size={24} />
                                            <div>
                                                <div className="font-semibold text-blue-400">Stable</div>
                                                <div className="text-xs text-neutral-400">Maintaining balance</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => window.open(`${API_URL}/api/assessments/export/${result.id}`, '_blank')}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Download Full Report
                            </button>
                            
                            <button
                                onClick={() => window.location.href = '/app/consultation'}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                            >
                                Talk to a Counsellor
                            </button>

                            <button
                                onClick={onBack}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-all"
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
