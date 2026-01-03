import { useState } from "react";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [openResponses, setOpenResponses] = useState({});
  const [openReplyBox, setOpenReplyBox] = useState({});

  const toggleResponses = (id) =>
    setOpenResponses((p) => ({ ...p, [id]: !p[id] }));

  const toggleReply = (id) =>
    setOpenReplyBox((p) => ({ ...p, [id]: !p[id] }));

  const addEmotionTag = (tag) => {
    if (!newPost.includes(`#${tag}`)) {
      setNewPost((p) => (p ? `${p} #${tag}` : `#${tag}`));
    }
  };

  const submitPost = () => {
    if (!newPost.trim()) return;

    setPosts((p) => [
      {
        id: Date.now(),
        content: newPost,
        anonymous,
        username: "User",
        timeAgo: "Just now",
        likes: 0,
        responses: [],
        isOwner: true,
      },
      ...p,
    ]);

    setNewPost("");
    setAnonymous(true);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-white px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Venting Hall</h1>
          <p className="text-white/60">
            A safe space to share your thoughts
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600"
        >
          Share Thoughts
        </button>
      </div>

      {/* Reminder */}
      <div className="bg-[#141923] border border-white/10 rounded-2xl p-6 mb-8 text-center">
        <h3 className="font-semibold mb-1">❤️ You are not alone</h3>
        <p className="text-white/60 mb-4">
          This community exists to support you
        </p>

        <div className="flex justify-center gap-4">
          <a
            href="/chat"
            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5"
          >
            Chat Support
          </a>
          <a
            href="tel:14416"
            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/5"
          >
            Crisis Helpline
          </a>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-3xl mx-auto space-y-6">
        {posts.length === 0 && (
          <div className="text-center text-white/50 py-12">
            No posts yet. Be the first to share.
          </div>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-[#141923] border border-white/10 rounded-2xl p-5"
          >
            {/* Header */}
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-400/30 flex items-center justify-center mr-3">
                👤
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {post.anonymous ? "Anonymous" : post.username}
                </p>
                <p className="text-xs text-white/50">{post.timeAgo}</p>
              </div>

              {post.isOwner && (
                <button className="text-red-400 hover:text-red-500">
                  🗑
                </button>
              )}
            </div>

            {/* Content */}
            <p className="text-white/90 mb-4">{post.content}</p>

            {/* Actions */}
            <div className="flex justify-between items-center text-sm text-white/70">
              <div className="flex gap-4">
                <button>❤️ {post.likes}</button>
                <button onClick={() => toggleResponses(post.id)}>
                  💬 {post.responses.length}
                </button>
                <button>🤝 Support</button>
              </div>

              <button
                onClick={() => toggleReply(post.id)}
                className="text-indigo-400 hover:text-indigo-500"
              >
                Respond
              </button>
            </div>

            {/* Reply box */}
            {openReplyBox[post.id] && (
              <div className="mt-4">
                <textarea
                  rows={3}
                  className="w-full bg-transparent border border-white/20 rounded-lg p-2 text-sm"
                  placeholder="Write a supportive response..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => toggleReply(post.id)}
                    className="px-3 py-1 border border-white/20 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button className="px-3 py-1 bg-indigo-500 rounded-lg">
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Responses */}
            {openResponses[post.id] && post.responses.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3 space-y-2">
                {post.responses.map((r, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">
                      {r.anonymous ? "Anonymous" : r.username}
                    </span>
                    <p className="text-white/70">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
                onClick={submitPost}
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
