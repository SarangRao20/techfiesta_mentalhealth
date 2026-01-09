import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { Send, MessageSquare, Shield, Users, Hash, MoreHorizontal, Clock, Zap, ArrowRight, Circle } from 'lucide-react';

const ROOMS = [
    { id: 'Anxiety Support', name: 'Anxiety', icon: '😰', description: 'Real-time support for anxiety and panic.' },
    { id: 'Depression Support', name: 'Depression', icon: '😔', description: 'A safe space for those facing depression.' },
    { id: 'Mindfulness', name: 'Mindfulness', icon: '🧘', description: 'Collective meditation discussions.' },
    { id: 'General Wellness', name: 'Wellness', icon: '🌱', description: 'General health and wellbeing journey.' },
];

export default function CommunityChat({ user }) {
    const [socket, setSocket] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(ROOMS[0].id);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join', { room: currentRoom });
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
        });

        newSocket.on('history', (history) => {
            setMessages(history);
            setTimeout(scrollToBottom, 50);
        });

        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (!socket || !isConnected) return;
        socket.emit('leave', { room: currentRoom });
        setMessages([]);
        socket.emit('join', { room: currentRoom });
    }, [currentRoom]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;
        socket.emit('message', { room: currentRoom, msg: newMessage });
        setNewMessage("");
    };

    const activeRoomData = ROOMS.find(r => r.id === currentRoom);

    return (
        <div className="flex h-full w-full bg-[#08090a] text-[#c0c1c2] overflow-hidden font-sans relative">
            {/* Grain/Texture Overlay to avoid "Flat AI" look */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

            {/* Custom Vertical Channel Nav (Less Generic) */}
            <div className="w-[70px] flex flex-col items-center py-6 border-r border-[#1a1b1c] bg-[#0c0d0e] z-20">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-600/40">
                    <Zap size={20} fill="currentColor" />
                </div>

                <div className="flex-1 space-y-4">
                    {ROOMS.map((room) => (
                        <button
                            key={room.id}
                            onClick={() => setCurrentRoom(room.id)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 relative group ${currentRoom === room.id
                                    ? 'bg-[#1a1b1c] text-white shadow-xl scale-105'
                                    : 'text-slate-600 hover:text-white hover:bg-[#1a1b1c]'
                                }`}
                        >
                            {room.icon}
                            {currentRoom === room.id && (
                                <div className="absolute -left-1 w-1 h-6 bg-indigo-500 rounded-full" />
                            )}
                            <div className="absolute left-[70px] px-3 py-2 bg-[#1a1b1c] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-white/5">
                                {room.name}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chat Hub */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#08090a] relative">
                {/* Minimalist Header */}
                <header className="h-[72px] px-8 flex items-center justify-between border-b border-[#1a1b1c] bg-[#08090a]/90 backdrop-blur-md z-10">
                    <div className="flex items-center gap-6">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase italic">{activeRoomData?.name} Hub</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-indigo-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4a4b4c]">
                                    {isConnected ? 'Realtime Verified' : 'Sync Interrupted'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-[10px] bg-[#1a1b1c] px-3 py-1.5 rounded-full font-black text-[#6a6b6c] uppercase tracking-widest border border-white/5">
                            {user?.username || 'Guest'}
                        </div>
                        <button className="text-[#3a3b3c] hover:text-white transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </header>

                {/* Message Flow */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center grayscale opacity-20">
                            <span className="text-6xl mb-4">💬</span>
                            <p className="text-[12px] font-black uppercase tracking-[0.4em]">The lounge is quiet</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.username === user?.username;
                            const prevMessage = idx > 0 ? messages[idx - 1] : null;
                            const isGroupStart = !prevMessage || prevMessage.username !== msg.username;

                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {isGroupStart && (
                                            <span className="text-[9px] font-black text-[#5a5b5c] uppercase tracking-widest mb-2 px-1">
                                                {isMe ? 'You' : msg.username} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        <div className={`px-5 py-3.5 rounded-3xl text-[15px] font-medium leading-relaxed tracking-tight ${isMe
                                                ? 'bg-white text-black rounded-tr-none shadow-[4px_4px_20px_-5px_rgba(255,255,255,0.2)]'
                                                : 'bg-[#151617] text-[#e0e1e2] rounded-tl-none border border-[#252627]'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Matrix */}
                <div className="px-8 pb-8 pt-4">
                    <form
                        onSubmit={handleSendMessage}
                        className="relative flex items-center bg-[#111213] rounded-3xl border border-[#252627] focus-within:border-[#3a3b3c] transition-all p-2 pr-4 shadow-2xl"
                    >
                        <div className="w-10 h-10 flex items-center justify-center text-[#4a4b4c]">
                            <Hash size={18} />
                        </div>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Speak your mind in #${activeRoomData?.name.toLowerCase()}...`}
                            className="flex-1 bg-transparent border-none text-white text-[15px] focus:ring-0 placeholder:text-[#3a3b3c] font-medium py-3"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !isConnected}
                            className={`px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${newMessage.trim()
                                    ? 'bg-white text-black shadow-xl scale-105 active:scale-95'
                                    : 'text-[#3a3b3c] cursor-not-allowed'
                                }`}
                        >
                            Send
                        </button>
                    </form>
                    <div className="flex items-center justify-center gap-4 mt-4 opacity-30">
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-[#252627] to-transparent" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Encrypted Data Stream</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#252627] to-transparent" />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #252627; }
                `
            }} />
        </div>
    );
}
