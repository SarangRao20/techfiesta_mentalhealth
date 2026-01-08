// Add this to your MentorDashboard.jsx at the top after imports

// Notification Bell Component - paste this before your main return statement
{/* Notification Bell - Add this in your header section */}
<div className="relative">
    <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
    >
        <Bell size={20} className="text-gray-300" />
        {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
        )}
    </button>
    
    {/* Notification Dropdown */}
    {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-[#161b26] border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#161b26]">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-teal-400" />
                    <h3 className="font-bold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                <button 
                    onClick={clearNotifications} 
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                    <X size={14} />
                    Clear
                </button>
            </div>
            <div className="overflow-y-auto max-h-80 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                    </div>
                ) : (
                    notifications.map((notif, idx) => (
                        <div
                            key={idx}
                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                                notif.type === 'crisis_alert' ? 'bg-red-900/10 border-l-2 border-l-red-500' : ''
                            }`}
                            onClick={() => {
                                if (notif.student_id) {
                                    fetchInsights(notif.student_id);
                                    setShowNotifications(false);
                                }
                            }}
                        >
                            <div className="flex items-start gap-3">
                                {notif.type === 'crisis_alert' && (
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <AlertTriangle size={18} className="text-red-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white mb-1">{notif.message}</p>
                                    {notif.student_name && (
                                        <p className="text-xs text-teal-300 mb-1">Student: {notif.student_name}</p>
                                    )}
                                    {notif.details && (
                                        <p className="text-xs text-gray-400 italic mt-1 line-clamp-2">"{notif.details}"</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(notif.timestamp * 1000).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )}
</div>
