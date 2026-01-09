import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { Send, Hash, MessageSquare, Shield, Info, MoreHorizontal, User, Users, Search } from 'lucide-react';

const ROOMS = [
    { id: 'Anxiety Support', name: 'Anxiety Support', icon: '😰', description: 'Real-time support for anxiety management.' },
    { id: 'Depression Support', name: 'Depression Support', icon: '😔', description: 'A safe space for depression discussions.' },
    { id: 'Mindfulness', name: 'Mindfulness', icon: '🧘', description: 'Co-meditation and wellness.' },
    { id: 'General Wellness', name: 'General Wellness', icon: '🌱', description: 'Share wellness tips and stories.' },
];

export default function CommunityChat({ user }) {
    const [socket, setSocket] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(ROOMS[0].id);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    // Use ref to avoid stale room state in socket listeners
    const currentRoomRef = useRef(currentRoom);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        currentRoomRef.current = currentRoom;
    }, [currentRoom]);

    useEffect(() => {
        const newSocket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join', { room: currentRoomRef.current });
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('message', (msg) => {
            // Only add message if it belongs to the current room
            // This prevents "vanishing" or "leaking" issues when switching rooms
            if (msg.room === currentRoomRef.current) {
                setMessages((prev) => [...prev, msg]);
                scrollToBottom();
            }
        });

        newSocket.on('history', (history) => {
            setMessages(history);
            setTimeout(scrollToBottom, 50);
        });

        newSocket.on('error', (err) => {
            console.error("Socket Error:", err);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) newSocket.close();
        };
    }, []); // Only run once on mount

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Clean switch
        socket.emit('leave', { room: messages.length > 0 ? messages[0].room : '' });
        setMessages([]); // Clear locally while waiting for history
        socket.emit('join', { room: currentRoom });
    }, [currentRoom]);

    const scrollToBottom = () => {
        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !isConnected) return;

        socket.emit('message', {
            room: currentRoom,
            msg: newMessage.trim()
        });
        setNewMessage("");
    };

    const activeRoomData = ROOMS.find(r => r.id === currentRoom);

    return (
        <div className="flex h-full w-full bg-[#151a23] text-white overflow-hidden font-sans border border-white/5 rounded-3xl shadow-2xl relative">

            {/* Sidebar */}
            <div className="w-72 md:w-80 bg-[#1c212c]/50 flex flex-col border-r border-white/5 hidden lg:flex">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Channels</h3>
                        <button className="text-white/20 hover:text-white transition-colors">
                            <Search size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar-chat">
                    {ROOMS.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => setCurrentRoom(room.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-4 group ${currentRoom === room.id
                                ? 'bg-indigo-600/10 text-white border border-indigo-600/20 shadow-lg shadow-indigo-600/5'
                                : 'hover:bg-white/5 text-white/30 hover:text-white/60 border border-transparent'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all shadow-inner ${currentRoom === room.id ? 'bg-indigo-600 text-white shadow-indigo-600/40' : 'bg-[#1c212c] text-white/20'
                                }`}>
                                {room.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate tracking-tight ${currentRoom === room.id ? 'text-white' : ''}`}>
                                    {room.name}
                                </p>
                                <p className="text-[10px] text-white/20 truncate font-semibold uppercase tracking-tight">Active Now</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Status Section */}
                <div className="p-6 border-t border-white/5 bg-[#1c212c]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-sm font-bold text-indigo-400 border border-indigo-500/10">
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{user?.username || 'Guest'}</p>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full shadow-sm animate-pulse ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">{isConnected ? 'Connected' : 'Connecting...'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col bg-[#0f131c]">
                <header className="h-[72px] px-8 flex items-center justify-between border-b border-white/5 bg-[#151a23]/40 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1c212c] border border-white/5 flex items-center justify-center text-2xl shadow-inner">
                            {activeRoomData?.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white tracking-tight">{currentRoom}</h3>
                                <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${isConnected ? 'bg-indigo-600/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {isConnected ? 'Sync Local' : 'Offline'}
                                </div>
                            </div>
                            <p className="text-[10px] text-white/30 font-medium tracking-wide mt-0.5">{activeRoomData?.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-white/20 hover:text-white transition-colors">
                            <Info size={18} />
                        </button>
                        <button className="p-2.5 rounded-xl border border-white/5 text-white/20 hover:text-white hover:bg-white/5 transition-all">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </header>

                {/* Messages Hub */}
                <main className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar-chat relative">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10">
                            <Users size={48} className="mb-4" />
                            <p className="text-xs font-bold tracking-[0.4em] uppercase">This room is waiting for your voice</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.username === user?.username;
                            const showMeta = idx === 0 || messages[idx - 1].username !== msg.username;

                            return (
                                <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    {showMeta && (
                                        <div className={`flex items-center gap-2 mb-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.1em]">{isMe ? 'You' : msg.username}</span>
                                            <span className="text-[8px] text-white/20 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )}

                                    <div className={`relative px-5 py-3 rounded-2xl border transition-all duration-300 max-w-[85%] lg:max-w-[70%] shadow-lg ${isMe
                                        ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none shadow-indigo-600/10'
                                        : 'bg-[#1c212c] border-white/5 text-white/80 rounded-tl-none'
                                        }`}>
                                        <p className="text-[14px] leading-relaxed font-medium tracking-tight whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </main>

                {/* Input Hub */}
                <footer className="p-6 border-t border-white/5 bg-[#151a23]/20">
                    <form onSubmit={handleSendMessage} className="max-w-[1000px] mx-auto flex items-center gap-3">
                        <div className="flex-1 bg-[#1c212c]/60 border border-white/5 rounded-[1.25rem] px-5 py-4 focus-within:border-indigo-500/40 transition-all shadow-inner relative group">
                            <input
                                autoFocus
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Say something in #${currentRoom.toLowerCase().replace(' ', '-')}`}
                                className="w-full bg-transparent border-none text-white text-[14px] focus:ring-0 placeholder:text-white/10 font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !isConnected}
                            className={`h-[56px] px-8 rounded-2xl transition-all flex items-center justify-center gap-3 ${newMessage.trim()
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                }`}
                        >
                            <span className="text-xs font-bold uppercase tracking-[0.2em] hidden sm:inline">Send</span>
                            <Send size={16} />
                        </button>
                    </form>
                    <div className="flex items-center justify-center gap-3 mt-4 opacity-10">
                        <Shield size={10} className="text-indigo-400" />
                        <p className="text-[8px] font-bold text-white uppercase tracking-[0.3em]">Secure Peer-to-Peer Subsystem</p>
                    </div>
                </footer>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .custom-scrollbar-chat::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar-chat::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar-chat::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                `
            }} />
        </div>
    );
}
