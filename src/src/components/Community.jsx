import { useState, useEffect } from "react";
import { MessageSquare, Heart, Share2, MoreHorizontal, Send, Filter, User } from "lucide-react";
import { API_URL } from "../config";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [filter, setFilter] = useState("all"); // all, anonymous, mine
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const addEmotionTag = (tag) => {
    if (!newPost.includes(`#${tag}`)) {
      setNewPost((p) => (p ? `${p} #${tag}` : `#${tag}`));
    }
  };

  // Fetch posts
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/venting/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newPost, anonymous })
      });
      if (res.ok) {
        setNewPost("");
        setShowModal(false);
        fetchPosts(); // Refresh
      }
    } catch (e) {
      console.error("Failed to post", e);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'anonymous') return post.anonymous;
    if (filter === 'mine') return post.is_owner;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0f131c] text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-white/60">A safe space to share your thoughts anonymously</p>
        </div>
        <div className="flex bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md transition text-sm ${filter === 'all' ? 'bg-indigo-600' : 'hover:bg-white/5'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('anonymous')}
            className={`px-4 py-2 rounded-md transition text-sm ${filter === 'anonymous' ? 'bg-indigo-600' : 'hover:bg-white/5'}`}
          >
            Anonymous Only
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-4 py-2 rounded-md transition text-sm ${filter === 'mine' ? 'bg-indigo-600' : 'hover:bg-white/5'}`}
          >
            My Posts
          </button>
        </div>
      </div>

      {/* Create Post */}
      <div className="bg-[#1a1f2b] rounded-xl p-6 mb-8 border border-white/10">
        <form onSubmit={handleSubmit}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none outline-none text-lg placeholder:text-white/30 min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setAnonymous(!anonymous)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition ${anonymous ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/60"
                }`}
            >
              {anonymous ? "👻 Anonymous" : "👤 Public"}
            </button>
            <button
              type="submit"
              disabled={!newPost.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={18} />
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-white/50">Loading community...</p>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Post key={post.id} post={post} />
          ))
        ) : (
          <p className="text-center text-white/50 py-10">No posts found in this filter.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#141923] border border-white/20 rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Share your thoughts
            </h3>

            <textarea
              rows={5}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="w-full bg-transparent border border-white/20 rounded-lg p-3 mb-3"
              placeholder="Write here..."
            />

            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "anxious",
                "overwhelmed",
                "lonely",
                "stressed",
                "hopeful",
                "grateful",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => addEmotionTag(tag)}
                  className="text-xs px-3 py-1 rounded-full border border-white/20 hover:bg-white/5"
                >
                  #{tag}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm mb-4">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              Post anonymously
            </label>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-white/20 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-500 rounded-lg"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Post({ post }) {
  return (
    <div className="bg-[#1a1f2b] rounded-xl p-6 border border-white/5 hover:border-white/10 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${post.anonymous ? "bg-emerald-500/20" : "bg-purple-500/20"
            }`}>
            {post.anonymous ? "👻" : "👤"}
          </div>
          <div>
            <h3 className="font-medium text-white/90">
              {post.author}
              {post.is_owner && <span className="ml-2 text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">You</span>}
            </h3>
            <p className="text-sm text-white/40">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <button className="text-white/20 hover:text-white transition">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="text-white/80 leading-relaxed mb-6 whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-white/40 hover:text-red-400 transition group">
            <Heart size={20} className="group-hover:scale-110 transition" />
            <span className="text-sm">{post.likes}</span>
          </button>
          <button className="flex items-center gap-2 text-white/40 hover:text-indigo-400 transition group">
            <MessageSquare size={20} className="group-hover:scale-110 transition" />
            <span className="text-sm">{post.responses_count}</span>
          </button>
        </div>
        <button className="text-white/40 hover:text-white transition">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}
