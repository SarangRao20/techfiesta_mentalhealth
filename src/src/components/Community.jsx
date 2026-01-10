import { useState, useEffect } from "react";
import { MessageSquare, Heart, Share2, MoreHorizontal, Send, Shield, Clock, MessageCircle, Sparkles, User, Users, Hash } from "lucide-react";
import { API_URL } from "../config";
import CommunityChat from "./CommunityChat";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat"); // Default to chat as requested
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
    <div className="min-h-screen bg-[#0f131c] text-white p-4 md:p-8 font-sans relative flex flex-col items-center">

      {/* Header Container - Clean & Integrated */}
      <div className="w-full max-w-[1400px] flex flex-col md:flex-row justify-between items-center mb-8 gap-6 shrink-0 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white/95 uppercase">Community Lounge</h1>
            <p className="text-white/40 text-sm font-medium">Real-time support and shared perspectives.</p>
          </div>
        </div>

        {/* Tab Switcher - Dashboard Style */}
        <div className="bg-[#151a23] p-1.5 rounded-2xl flex gap-1 border border-white/5 shadow-2xl">
          {[
            { id: 'chat', label: 'Live Chat', icon: <Hash size={18} /> },
            { id: 'venting', label: 'Support Feed', icon: <Users size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area - Expansive w-full */}
      <div className="w-full max-w-[1400px] flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="flex-1 h-full min-h-[600px]">
            <CommunityChat user={currentUser} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-2 pb-20 custom-scrollbar-hub">
            <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Inline Composer - Premium Dashboard Card Style */}
              <div className="bg-[#151a23] border border-white/5 rounded-3xl p-8 shadow-xl relative group mt-4">
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-2xl text-indigo-400 shrink-0">
                    {anonymous ? "👻" : (currentUser?.username?.charAt(0).toUpperCase() || "U")}
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={newPost.length > 50 ? 4 : 2}
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none py-2 text-lg font-medium transition-all"
                      placeholder="Contribute a thought to the community..."
                    />

                    <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                      <div className="flex gap-3">
                        {["Support", "Healing", "Grateful"].map(tag => (
                          <button
                            key={tag}
                            onClick={() => setEmotion(emotion === tag ? null : tag)}
                            className={`text-[10px] px-4 py-2 rounded-xl font-bold uppercase tracking-widest transition-all border ${emotion === tag
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'bg-white/5 border-white/5 text-white/30 hover:text-white hover:border-white/10'
                              }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-8">
                        <label className="flex items-center gap-3 cursor-pointer group/anon">
                          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="hidden" />
                          <div className={`w-10 h-6 rounded-full transition-all relative ${anonymous ? 'bg-indigo-600 shadow-md' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${anonymous ? 'right-1 bg-white' : 'left-1 bg-white/40'}`} />
                          </div>
                          <span className="text-xs font-bold text-white/40 group-hover/anon:text-white/60">Anonymous</span>
                        </label>

                        <button
                          onClick={handleSubmit}
                          disabled={!newPost.trim() || isPosting}
                          className={`px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${newPost.trim()
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95'
                              : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            }`}
                        >
                          {isPosting ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                          Publish
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Filter Bar */}
              <div className="flex items-center justify-between px-2">
                <div className="flex bg-[#151a23] p-1.5 rounded-2xl border border-white/5 gap-1">
                  {['all', 'mine', 'anonymous'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
                  {filteredPosts.length} Combined Threads
                </div>
              </div>

              {/* Posts Feed Grid - Spacious & Clean */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  <div className="col-span-full py-40 flex flex-col items-center opacity-30">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-xs font-bold uppercase tracking-[0.3em]">Connecting Perspectives</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  filteredPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={() => handleLike(post.id)}
                      onReply={(c) => handleReply(post.id, c)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-40 opacity-10 border-2 border-dashed border-white/5 rounded-[3rem]">
                    <Shield size={64} strokeWidth={1} className="mx-auto mb-6" />
                    <p className="text-lg font-bold tracking-widest uppercase italic">Silence is the first step...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar-hub::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar-hub::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar-hub::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        `
      }} />
    </div>
  );
}

function PostCard({ post, onLike, onReply }) {
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
    <div className="bg-[#151a23] rounded-[2rem] p-8 border border-white/5 hover:border-indigo-500/20 transition-all duration-300 group flex flex-col h-full shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-inner ${post.anonymous ? "bg-white/5 text-white/30" : "bg-indigo-600/10 text-indigo-400 border border-indigo-500/10"
            }`}>
            {post.anonymous ? "👤" : post.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white/95 text-[15px] tracking-tight">
                {post.anonymous ? "Anonymous Space" : post.author}
              </h3>
              {post.is_owner && (
                <span className="text-[9px] bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">You</span>
              )}
            </div>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5">
              {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button className="text-white/10 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="text-[15px] text-white/80 leading-relaxed mb-8 flex-1">
        {post.content}
      </p>

      {/* Recursive Replies Section */}
      {post.responses && post.responses.length > 0 && (
        <div className="mb-6 space-y-4 border-l-2 border-white/5 pl-6">
          {post.responses.slice(0, 3).map((r, i) => (
            <div key={i} className="animate-in fade-in duration-500">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-indigo-400/50 text-[11px] uppercase tracking-wide">{r.author}</span>
                <span className="text-[9px] text-white/10 font-bold">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed">{r.content}</p>
            </div>
          ))}
          {post.responses.length > 3 && (
            <p className="text-[11px] text-indigo-400/30 font-bold italic">+{post.responses.length - 3} more supportive perspectives</p>
          )}
        </div>
      )}

      {/* Inline Reply Input */}
      {showReplyInput && (
        <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3">
            <input
              autoFocus
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Offer support..."
              className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 text-sm text-white focus:border-indigo-500/50 transition-all focus:ring-0 placeholder:text-white/10 shadow-inner"
              onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
            />
            <button
              onClick={handleReplySubmit}
              className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Card Action Hub */}
      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-8">
          <button
            onClick={onLike}
            className={`flex items-center gap-3 transition-all ${post.liked_by_me ? 'text-rose-500' : 'text-white/20 hover:text-rose-500'}`}
          >
            <Heart size={20} className={`${post.liked_by_me ? 'fill-rose-500' : ''}`} />
            <span className="text-xs font-bold tracking-widest">{post.likes || 0}</span>
          </button>

          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className={`flex items-center gap-3 transition-all ${showReplyInput ? 'text-indigo-400' : 'text-white/20 hover:text-indigo-400'}`}
          >
            <MessageSquare size={20} />
            <span className="text-xs font-bold tracking-widest">{post.responses?.length || 0}</span>
          </button>
        </div>

        <button className="text-white/10 hover:text-white transition-all transform hover:scale-110">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}
