import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { ClipboardCheck, Activity, Brain, CheckCircle, ChevronRight, AlertCircle, Download, Share2, Heart, Zap, Shield } from 'lucide-react';
import AssessmentResults from './AssessmentResults';

const Assessments = () => {
    const [activeTab, setActiveTab] = useState('PHQ-9');
    const [questions, setQuestions] = useState([]);
    const [options, setOptions] = useState({});
    const [responses, setResponses] = useState({});
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const logActivity = async (action, metadata = {}) => {
        try {
            await fetch(`${API_URL}/api/activity/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    activity_type: 'assessment',
                    action: action,
                    extra_data: metadata
                })
            });
        } catch (e) {
            console.error("Logging failed", e);
        }
    };

    useEffect(() => {
        setResponses({});
        setResult(null);
        fetchQuestions(activeTab);
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/api/assessments`, { credentials: 'include' });
            if (res.ok) setHistory(await res.json());
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    };

    const fetchQuestions = async (type) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/assessments/questions/${type}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions);
                setOptions(data.options);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (qId, value) => {
        setResponses(prev => ({ ...prev, [qId]: parseInt(value) }));
    };

    const handleSubmit = async () => {
        if (Object.keys(responses).length < questions.length) {
            alert("Please answer all questions");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    assessment_type: activeTab,
                    responses: responses
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data);
                fetchHistory();
                logActivity('complete', {
                    assessment_type: activeTab,
                    score: data.score,
                    severity: data.analysis?.severity_level
                });
            }
        } catch (e) {
            console.error("Submission failed", e);
        } finally {
            setLoading(false);
        }
    };

    const progress = Math.round((Object.keys(responses).length / (questions.length || 1)) * 100);

    const assessmentTypes = [
        { 
            id: 'PHQ-9', 
            label: 'Depression Assessment', 
            desc: 'Patient Health Questionnaire - 9 items for depression screening',
            icon: Heart,
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-500/10 to-pink-500/10'
        },
        { 
            id: 'GAD-7', 
            label: 'Anxiety Assessment', 
            desc: 'Generalized Anxiety Disorder - 7 item scale for anxiety evaluation',
            icon: Zap,
            gradient: 'from-blue-500 to-cyan-500',
            bgGradient: 'from-blue-500/10 to-cyan-500/10'
        },
        { 
            id: 'GHQ', 
            label: 'General Health Assessment', 
            desc: 'General Health Questionnaire for overall psychological wellbeing',
            icon: Shield,
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-500/10 to-teal-500/10'
        }
    ];

    const currentAssessment = assessmentTypes.find(a => a.id === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f131c] to-[#1a1025] text-white">
            {result ? (
                <AssessmentResults 
                    result={result} 
                    onBack={() => setResult(null)} 
                />
            ) : (
                <div className="p-6 md:p-12">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                                Mental Health Assessments
                            </h1>
                            <p className="text-neutral-400 text-lg">
                                Select an assessment below to begin your evaluation
                            </p>
                        </div>

                        {/* Assessment Type Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {assessmentTypes.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`relative group text-left p-8 rounded-3xl transition-all duration-300 border-2 overflow-hidden
                                            ${isActive 
                                                ? 'border-white/30 scale-105 shadow-2xl' 
                                                : 'border-white/10 hover:border-white/20 hover:scale-102'}`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-50 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}></div>
                                        
                                        <div className="relative z-10">
                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 transform transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                                <Icon size={28} />
                                            </div>
                                            
                                            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                                {item.id}
                                                {isActive && <CheckCircle size={20} className="text-green-400" />}
                                            </h3>
                                            <p className="text-white/90 font-medium mb-2">{item.label}</p>
                                            <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Questionnaire */}
                            <div className="lg:col-span-2">
                                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl">
                                    {/* Header with Progress */}
                                    <div className="mb-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-3xl font-bold">{activeTab} Questionnaire</h2>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                                    {Object.keys(responses).length}/{questions.length}
                                                </div>
                                                <div className="text-xs text-neutral-500 uppercase tracking-wider">Completed</div>
                                            </div>
                                        </div>

                                        {/* Animated Progress Bar */}
                                        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${currentAssessment.gradient} rounded-full transition-all duration-700 ease-out`}
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-purple-500"></div>
                                            <p className="mt-4 text-neutral-400">Loading questions...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {questions.map((q, idx) => {
                                                const qId = idx.toString();
                                                const isAnswered = responses[qId] !== undefined;
                                                
                                                return (
                                                    <div key={idx} className="space-y-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isAnswered ? `bg-gradient-to-br ${currentAssessment.gradient}` : 'bg-white/10'}`}>
                                                                {isAnswered ? <CheckCircle size={20} /> : idx + 1}
                                                            </div>
                                                            <p className="text-lg text-neutral-200 leading-relaxed pt-2">
                                                                {q}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="ml-14 space-y-2">
                                                            {Object.entries(options).map(([val, label]) => {
                                                                const isSelected = responses[qId] === parseInt(val);
                                                                return (
                                                                    <label
                                                                        key={val}
                                                                        className={`
                                                                            flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200
                                                                            ${isSelected
                                                                                ? `bg-gradient-to-r ${currentAssessment.gradient} shadow-lg`
                                                                                : 'bg-white/5 hover:bg-white/10 border border-white/10'}
                                                                        `}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={`question-${qId}`}
                                                                            value={val}
                                                                            checked={isSelected}
                                                                            onChange={() => handleOptionSelect(qId, val)}
                                                                            className="hidden"
                                                                        />
                                                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                                            ${isSelected ? 'border-white bg-white' : 'border-white/30'}`}
                                                                        >
                                                                            {isSelected && (
                                                                                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${currentAssessment.gradient}`}></div>
                                                                            )}
                                                                        </div>
                                                                        <span className={`text-base ${isSelected ? 'text-white font-medium' : 'text-neutral-300'}`}>
                                                                            {label}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="mt-8 pt-6 border-t border-white/10">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading || Object.keys(responses).length < questions.length}
                                            className={`
                                                w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300
                                                ${Object.keys(responses).length < questions.length
                                                    ? 'bg-white/5 text-neutral-500 cursor-not-allowed'
                                                    : `bg-gradient-to-r ${currentAssessment.gradient} hover:shadow-2xl hover:shadow-purple-500/30 transform hover:-translate-y-1`}
                                            `}
                                        >
                                            Submit Assessment
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* History Sidebar */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <Activity size={20} className="text-green-400" />
                                        Assessment History
                                    </h3>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {history.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                                    <ClipboardCheck size={24} className="text-neutral-500" />
                                                </div>
                                                <p className="text-neutral-500 text-sm">No assessments yet</p>
                                            </div>
                                        ) : (
                                            history.map(h => {
                                                const assessment = assessmentTypes.find(a => a.id === h.type);
                                                return (
                                                    <div 
                                                        key={h.id} 
                                                        className="group p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all duration-300 hover:shadow-lg"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${assessment?.gradient || 'from-gray-500 to-gray-600'} flex items-center justify-center text-xs font-bold`}>
                                                                    {h.type}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-white">{h.type}</div>
                                                                    <div className="text-xs text-neutral-500">
                                                                        {new Date(h.date).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                h.severity === 'Normal' || h.severity === 'Minimal' 
                                                                    ? 'bg-green-500/20 text-green-400' 
                                                                    : h.severity === 'Severe' 
                                                                    ? 'bg-red-500/20 text-red-400' 
                                                                    : 'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                                {h.score}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-neutral-400 mb-3">{h.severity}</div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => window.open(`${API_URL}/api/assessments/export/${h.id}`, '_blank')}
                                                                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
                                                            >
                                                                <Download size={12} />
                                                                Report
                                                            </button>
                                                            <button
                                                                onClick={() => window.location.href = '/app/consultation'}
                                                                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all"
                                                            >
                                                                <Share2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

export default Assessments;