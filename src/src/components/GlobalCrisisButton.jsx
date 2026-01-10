import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone, MessageCircle, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GlobalCrisisButton = () => {
    const [showCrisisMenu, setShowCrisisMenu] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleToggle = () => setShowCrisisMenu(prev => !prev);
        window.addEventListener('toggle-crisis-menu', handleToggle);
        return () => window.removeEventListener('toggle-crisis-menu', handleToggle);
    }, []);

    return (
        <div className="fixed bottom-20 right-6 z-[100]">
            {/* MENU (absolute, does NOT shift button) */}
            {showCrisisMenu && (
                <div
                    className="
                absolute bottom-16 right-0

                bg-white
                rounded-xl
                shadow-2xl
                border border-gray-200/60
                p-2.5
                w-64
                animate-in slide-in-from-bottom-2 duration-200
              "
                >
                    <div className="space-y-1">

                        {/* Call Crisis */}
                        <button
                            onClick={() => (window.location.href = "tel:14416")}
                            className="
                    w-full flex items-center gap-3
                    px-3 py-2.5
                    rounded-lg
                    hover:bg-red-50
                    transition-colors
                    min-w-0
                    group
                  "
                        >
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                <Phone size={16} fill="currentColor" />
                            </div>

                            <div className="text-left">
                                <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
                                    Crisis Support
                                </p>
                                <p className="text-xs text-red-500 font-semibold">14416</p>
                            </div>
                        </button>

                        {/* Chat Support */}
                        <button
                            onClick={() => navigate("/app/chat")}
                            className="
                    w-full flex items-center gap-3
                    px-3 py-2.5
                    rounded-lg
                    hover:bg-purple-50
                    transition-colors
                    min-w-0
                    group
                  "
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <MessageCircle size={16} />
                            </div>

                            <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                                Chat Support
                            </p>
                        </button>

                        {/* Professional Help */}
                        <button
                            onClick={() => navigate("/app/consultation")}
                            className="
                    w-full flex items-center gap-3
                    px-3 py-2.5
                    rounded-lg
                    hover:bg-blue-50
                    transition-colors
                    min-w-0
                    group
                  "
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <UserPlus size={16} />
                            </div>

                            <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                                Get Professional Help
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {/* SOS BUTTON (Round, Compact) */}
            <button
                onClick={() => setShowCrisisMenu(!showCrisisMenu)}
                className={`
              w-14 h-14
              rounded-full
              bg-gradient-to-br from-red-500 to-pink-600
              text-white
              shadow-xl shadow-red-500/20
              hover:shadow-red-500/40
              border border-white/10
              transition-all duration-300
              hover:scale-110
              flex items-center justify-center
              group
              relative
            `}
            >
                {/* Ping animation behind */}
                {!showCrisisMenu && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
                )}

                {showCrisisMenu ? (
                    <X size={24} className="text-white" />
                ) : (
                    <span className="text-2xl filter drop-shadow-md">🆘</span>
                )}
            </button>
        </div>
    );
};

export default GlobalCrisisButton;
