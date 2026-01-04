import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { ClipboardCheck, Activity, Brain, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';

const Assessments = () => {
    const [activeTab, setActiveTab] = useState('PHQ-9'); // PHQ-9, GAD-7, GHQ
    const [questions, setQuestions] = useState([]);
    const [options, setOptions] = useState({});
    const [responses, setResponses] = useState({});
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

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
                // Options usually come as a map {value: "Label"}, we need to format it for display
                // Backend returns: "0": "Not at all", "1": "Several days", etc.
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
        // Validate all questions answered
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
                fetchHistory(); // refresh history
            }
        } catch (e) {
            console.error("Submission failed", e);
        } finally {
            setLoading(false);
        }
    };

    // Calculate progress
    const progress = Math.round((Object.keys(responses).length / (questions.length || 1)) * 100);

    return (
        <div className="min-h-screen bg-[#0f131c] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Sidebar / Selection */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <ClipboardCheck className="text-blue-500" /> Assessment Type
                        </h2>
                        <div className="space-y-3">
                            {[
                                { id: 'PHQ-9', label: 'Depression Scale', desc: 'Monitor depression severity' },
                                { id: 'GAD-7', label: 'Anxiety Scale', desc: 'Screen for generalized anxiety' },
                                { id: 'GHQ', label: 'General Health', desc: 'General psychological well-being' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left p-4 rounded-lg transition-all border border-transparent ${activeTab === item.id
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                                        : 'bg-white/5 hover:bg-white/10 text-neutral-400'
                                        }`}
                                >
                                    <div className="font-medium text-white">{item.id} - {item.label}</div>
                                    <div className="text-xs opacity-70 mt-1">{item.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Simple History Widget */}
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-green-500" /> Recent Results
                        </h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {history.length === 0 ? (
                                <p className="text-neutral-500 text-sm">No assessments taken yet.</p>
                            ) : (
                                history.map(h => (
                                    <div key={h.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-semibold text-white">{h.type}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs ${h.severity === 'Normal' || h.severity === 'Minimal' ? 'bg-green-500/20 text-green-400' :
                                                h.severity === 'Severe' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {h.score} pts
                                            </span>
                                        </div>
                                        <div className="text-neutral-500 text-xs flex justify-between">
                                            <span>{h.severity}</span>
                                            <span>{new Date(h.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Assessment Form OR Report */}
                <div className="lg:col-span-2">
                    {result ? (
                        /* RESULT VIEW */
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden animate-fade-in-up">
                            <div className={`p-8 ${result.analysis.severity_category?.includes('Severe') ? 'bg-red-900/20' :
                                result.analysis.severity_category?.includes('Normal') ? 'bg-green-900/20' : 'bg-blue-900/20'
                                }`}>
                                <h1 className="text-3xl font-light mb-2">Assessment Complete</h1>
                                <div className="text-5xl font-bold my-6">{result.score} <span className="text-xl font-normal opacity-50">/ Total</span></div>
                                <div className="text-xl uppercase tracking-widest font-semibold">{result.analysis.severity_category}</div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Interpretation</h3>
                                    <p className="text-neutral-300 leading-relaxed">{result.analysis.interpretation}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 p-4 rounded-lg">
                                        <h4 className="font-medium text-white mb-3">Implications</h4>
                                        <p className="text-sm text-neutral-400">{result.analysis.implication}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-lg">
                                        <h4 className="font-medium text-white mb-3">Recommendations</h4>
                                        <ul className="list-disc list-inside text-sm text-neutral-400 space-y-2">
                                            {result.analysis.recommendations?.map((rec, i) => (
                                                <li key={i}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setResult(null)}
                                    className="w-full py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Take Another Assessment
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* QUESTIONNAIRE VIEW */
                        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-8 relative min-h-[600px]">
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-3xl font-light">{activeTab} Questionnaire</h1>
                                <div className="text-sm text-neutral-500">
                                    {Object.keys(responses).length} / {questions.length} answered
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {questions.map((q, idx) => {
                                        const qId = idx.toString();
                                        return (
                                            <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <p className="text-lg text-neutral-200 mb-4">
                                                    <span className="text-blue-500 mr-2">{idx + 1}.</span>
                                                    {q}
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {Object.entries(options).map(([val, label]) => (
                                                        <button
                                                            key={val}
                                                            onClick={() => handleOptionSelect(qId, val)}
                                                            className={`
                                                            px-4 py-3 rounded-lg text-sm transition-all border
                                                            ${responses[qId] === parseInt(val)
                                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50'
                                                                    : 'bg-black/20 border-white/10 hover:border-white/30 text-neutral-400 hover:text-white'}
                                                        `}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="mt-12 pt-8 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || Object.keys(responses).length < questions.length}
                                    className={`
                                        flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all
                                        ${Object.keys(responses).length < questions.length
                                            ? 'bg-white/10 text-neutral-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30'}
                                    `}
                                >
                                    Submit Assessment
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Assessments;
