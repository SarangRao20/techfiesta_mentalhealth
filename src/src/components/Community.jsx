import { useState, useEffect, useRef } from "react";
import { MessageSquare, Heart, Share2, MoreHorizontal, Send, Filter, User, X, Shield, Plus, CornerDownRight, Sparkles, Image as ImageIcon, Smile, Clock, Zap, ArrowRight, Activity, MessageCircle } from "lucide-react";
import { API_URL } from "../config";
import CommunityChat from "./CommunityChat";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat"); // DEFAULT TO CHAT as requested
  const [currentUser, setCurrentUser] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [emotion, setEmotion] = useState(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/venting/posts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error("Failed to fetch posts", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  }

  useEffect(() => {
    fetchPosts();
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newPost.trim()) return;

    setIsPosting(true);
    const content = emotion ? `${newPost} #${emotion}` : newPost;

    try {
      const res = await fetch(`${API_URL}/api/venting/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, anonymous })
      });
      if (res.ok) {
        setNewPost("");
        setEmotion(null);
        fetchPosts();
      }
    } catch (e) {
      console.error("Failed to post", e);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiking = !p.liked_by_me;
        return {
          ...p,
          liked_by_me: isLiking,
          likes: isLiking ? (p.likes + 1) : (p.likes - 1)
        };
      }
      return p;
    }));

    try {
      const res = await fetch(`${API_URL}/api/venting/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        fetchPosts(); // Rollback
      } else {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes, liked_by_me: data.liked } : p));
      }
    } catch (e) {
      console.error("Like failed", e);
      fetchPosts();
    }
  };

  const handleReply = async (postId, content) => {
    try {
      const res = await fetch(`${API_URL}/api/venting/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: postId, content, anonymous: true })
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (e) {
      console.error("Reply failed", e);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'anonymous') return post.anonymous;
    if (filter === 'mine') return post.is_owner;
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-[#08090a] text-[#f0f1f2] overflow-hidden font-sans selection:bg-white selection:text-black">
      {/* Texture Layer */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Bespoke Layout Container */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Nav Strip (Very Modern/Minimalist) */}
        <div className="w-[100px] flex flex-col items-center py-10 border-r border-[#1a1b1c] bg-[#0c0d0e] z-30">
          <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mb-16 shadow-2xl">
            <Activity size={22} strokeWidth={2.5} />
          </div>

          <nav className="flex-1 flex flex-col gap-10">
            {[
              { id: 'chat', icon: <MessageCircle size={24} />, label: 'Lounge' },
              { id: 'venting', icon: <Sparkles size={24} />, label: 'Support' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-2 group transition-all ${activeTab === tab.id ? 'text-white' : 'text-[#444546] hover:text-[#88898a]'
                  }`}
              >
                <div className={`p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-[#1a1b1c] scale-110' : 'group-hover:bg-[#151617]'}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-[#08090a] overflow-hidden">
          {activeTab === 'chat' ? (
            <div className="flex-1">
              <CommunityChat user={currentUser} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-10 py-12 overflow-hidden">
              <header className="mb-12 flex justify-between items-end">
                <div>
                  <h1 className="text-5xl font-black text-white tracking-widest uppercase italic mb-4 leading-none">The Collective</h1>
                  <p className="text-[#6a6b6c] text-[11px] font-black uppercase tracking-[0.4em]">Realtime Human Support Interface</p>
                </div>
                <div className="flex gap-10 mb-2">
                  {['all', 'mine', 'anonymous'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative pb-2 ${filter === f ? 'text-white border-b-2 border-white' : 'text-[#4a4b4c] hover:text-[#88898a]'
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </header>

              {/* Minimalist Composer */}
              <div className="mb-12 bg-[#0c0d0e] border border-[#1a1b1c] rounded-[2.5rem] p-8 shadow-2xl group transition-all hover:border-[#2a2b2c]">
                <div className="flex items-start gap-8">
                  <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black shadow-xl shrink-0">
                    {anonymous ? "?" : (currentUser?.username?.charAt(0).toUpperCase() || "H")}
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={newPost.length > 60 ? 4 : 2}
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-[#3a3b3c] resize-none py-2 text-2xl font-medium leading-relaxed tracking-tight"
                      placeholder="Contribute your current state..."
                    />

                    <div className="flex items-center justify-between pt-8 border-t border-[#1a1b1c] mt-6">
                      <div className="flex gap-3">
                        {["Focus", "Healing", "Grateful"].map(tag => (
                          <button
                            key={tag}
                            onClick={() => setEmotion(emotion === tag ? null : tag)}
                            className={`text-[9px] px-5 py-2 rounded-full font-black uppercase tracking-widest transition-all border ${emotion === tag
                                ? 'bg-white border-white text-black'
                                : 'bg-transparent border-[#1a1b1c] text-[#5a5b5c] hover:border-[#3a3b3c] hover:text-white'
                              }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-8">
                        <label className="flex items-center gap-3 cursor-pointer group/anon">
                          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="hidden" />
                          <div className={`w-10 h-6 rounded-full transition-all relative ${anonymous ? 'bg-white' : 'bg-[#1a1b1c]'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${anonymous ? 'right-1 bg-black' : 'left-1 bg-[#4a4b4c]'}`} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#4a4b4c] group-hover/anon:text-white">Anon</span>
                        </label>

                        <button
                          onClick={handleSubmit}
                          disabled={!newPost.trim() || isPosting}
                          className={`h-14 px-10 rounded-full font-black text-[12px] uppercase tracking-[0.3em] flex items-center gap-3 transition-all ${newPost.trim()
                              ? 'bg-white text-black shadow-2xl hover:scale-105 active:scale-95'
                              : 'bg-[#151617] text-[#3a3b3c] cursor-not-allowed'
                            }`}
                        >
                          {isPosting ? <Clock size={16} className="animate-spin" /> : <ArrowRight size={18} />}
                          Signal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* High-End Feed Flow */}
              <div className="flex-1 overflow-y-auto space-y-8 pb-32 custom-scrollbar-minimal">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
                    <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Calibrating Stream</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <Post
                      key={post.id}
                      post={post}
                      onLike={() => handleLike(post.id)}
                      onReply={(c) => handleReply(post.id, c)}
                    />
                  ))
                ) : (
                  <div className="text-center py-32 opacity-10">
                    <Shield size={100} strokeWidth={0.5} className="mx-auto mb-8" />
                    <p className="text-[20px] font-black uppercase tracking-[0.5em]">System Idle</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar-minimal::-webkit-scrollbar { width: 1px; }
          .custom-scrollbar-minimal::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar-minimal::-webkit-scrollbar-thumb { background: #1a1b1c; }
          
          @keyframes slideInUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-post-v2 { animation: slideInUp 0.8s cubic-bezier(0.2, 1, 0.2, 1) both; }
        `
      }} />
    </div>
  );
}

function Post({ post, onLike, onReply }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(replyContent);
      setReplyContent("");
      setShowReplyInput(false);
    }
  };

  return (
    <div className="bg-transparent border-t border-[#1a1b1c] py-12 group animate-post-v2">
      <div className="flex gap-10">
        <div className="w-14 shrink-0 flex flex-col items-center gap-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border transition-all duration-500 ${post.anonymous
              ? "bg-transparent border-[#1a1b1c] text-[#4a4b4c]"
              : "bg-white border-white text-black"
            }`}>
            {post.anonymous ? "?" : post.author.charAt(0).toUpperCase()}
          </div>
          {post.is_owner && (
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-[#4a4b4c]">Origin</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white">
                {post.anonymous ? "Anonymous" : post.author}
              </span>
              <span className="text-[10px] text-[#4a4b4c] font-black uppercase tracking-widest">
                {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <button className="text-[#2a2b2c] hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <p className="text-[20px] lg:text-[24px] text-[#c0c1c2] leading-tight font-medium tracking-tight mb-8 whitespace-pre-wrap max-w-2xl">
            {post.content}
          </p>

          <div className="flex items-center gap-12 mb-8">
            <button
              onClick={onLike}
              className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all ${post.liked_by_me ? 'text-white' : 'text-[#4a4b4c] hover:text-white'
                }`}
            >
              <Heart size={18} className={`${post.liked_by_me ? 'fill-white text-white' : ''}`} />
              {post.likes || 0}
            </button>

            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all ${showReplyInput ? 'text-white' : 'text-[#4a4b4c] hover:text-white'
                }`}
            >
              <MessageSquare size={18} />
              {post.responses?.length || 0}
            </button>

            <button className="text-[#3a3b3c] hover:text-white transition-colors">
              <Share2 size={16} />
            </button>
          </div>

          {/* Reply Section Integration */}
          {showReplyInput && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex gap-4">
                <input
                  autoFocus
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Offer collective wisdom..."
                  className="flex-1 bg-transparent border-b border-[#1a1b1c] focus:border-white transition-all text-sm py-2 text-white placeholder:text-[#3a3b3c] focus:ring-0"
                  onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                />
                <button onClick={handleReplySubmit} className="text-[10px] font-black uppercase tracking-widest text-white hover:line-through">Submit</button>
              </div>
            </div>
          )}

          {/* Recursive Threads (Cleaned up) */}
          {post.responses && post.responses.length > 0 && (
            <div className="space-y-6 pl-4 border-l border-white/5">
              {post.responses.map(resp => (
                <div key={resp.id} className="pt-2">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-[9px] font-black text-[#5a5b5c] uppercase tracking-widest">{resp.author}</span>
                    <span className="w-1 h-1 bg-[#2a2b2c] rounded-full" />
                    <span className="text-[8px] text-[#3a3b3c] font-black uppercase">{new Date(resp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[14px] text-[#88898a] leading-relaxed max-w-xl">{resp.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
