import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, Play, Video, X } from 'lucide-react';
import { API_URL } from '../config';

const Resources = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Resources');
  const [playingVideo, setPlayingVideo] = useState(null);

  const logActivity = async (action, metadata = {}) => {
    try {
      await fetch(`${API_URL}/api/activity/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activity_type: 'resource',
          action: action,
          extra_data: metadata
        })
      });
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  const categories = [
    'All Resources',
    'Anxiety',
    'Stress',
    'Depression',
    'Wellness'
  ];

  const articles = [
    {
      id: 1,
      category: 'anxiety',
      title: "Understanding Anxiety: A Student's Guide",
      description: "Anxiety is common in students. Learn symptoms, causes, and what actually helps long-term...",
      readTime: '6 min read',
      helpfulFor: ['mild anxiety', 'exam stress', 'social anxiety'],
      url: "https://www.apa.org/topics/anxiety"
    },
    {
      id: 2,
      category: 'stress',
      title: 'Coping with Academic Pressure',
      description: "Academic pressure is real. Here are proven strategies to reduce stress and avoid burnout...",
      readTime: '7 min read',
      helpfulFor: ['exam anxiety', 'perfectionism', 'burnout'],
      url: "https://www.sciencedirect.com/science/article/pii/S2666915323001968"
    },
    {
      id: 3,
      category: 'wellness',
      title: 'Building Healthy Sleep Habits',
      description: "Sleep directly affects mood, memory, and focus. Learn sleep hygiene methods that work...",
      readTime: '6 min read',
      helpfulFor: ['insomnia', 'fatigue', 'mood issues'],
      url: "https://www.sleepfoundation.org/mental-health"
    },
    {
      id: 4,
      category: 'depression',
      title: 'Recognizing Depression Signs',
      description: "Understand the early warning signs of depression and when to seek professional support...",
      readTime: '8 min read',
      helpfulFor: ['low mood', 'loss of interest', 'fatigue'],
      url: "https://www.nimh.nih.gov/health/topics/depression"
    },
    {
      id: 5,
      category: 'wellness',
      title: 'Exercise and Mental Health',
      description: "How movement impacts stress hormones, sleep, and anxiety — backed by evidence...",
      readTime: '5 min read',
      helpfulFor: ['low energy', 'stress relief', 'mood improvement'],
      url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity"
    },
    {
      id: 6,
      category: 'stress',
      title: 'Time Management for Students',
      description: "Realistic time-management methods for students to reduce stress and stop procrastination...",
      readTime: '6 min read',
      helpfulFor: ['overwhelm', 'procrastination', 'deadlines'],
      url: "https://www.mind.org.uk/information-support/tips-for-everyday-living/stress/"
    }
  ];

  // Helper to get YouTube ID
  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videos = [
    {
      id: 101,
      title: "Daily Mindfulness Practice (10 min)",
      category: "Anxiety",
      duration: "10:30",
      url: "https://www.youtube.com/embed/inpok4MKVLM",
    },
    {
      id: 102,
      title: "Managing Stress (BBC)",
      category: "Stress",
      duration: "02:23",
      url: "https://www.youtube.com/embed/5vc-1FhGE9E",
    },
    {
      id: 103,
      title: "Sleep Hygiene Masterclass",
      category: "Wellness",
      duration: "08:20",
      url: "https://www.youtube.com/embed/nm1TxQj9IsQ",
    }
  ].map(v => ({
    ...v,
    thumbnail: `https://img.youtube.com/vi/${getYoutubeId(v.url)}/maxresdefault.jpg`
  }));

  const filteredArticles = selectedCategory === 'All Resources'
    ? articles
    : articles.filter(article => article.category === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Mental Health Resources
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Curated tools and guides to support your mental wellness journey.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12 flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all border ${selectedCategory === category
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Articles Section */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold text-white/90">Must-Read Articles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="group flex flex-col justify-between bg-[#141923] rounded-2xl p-6 border border-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-blue-300 uppercase tracking-wider">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white/90 mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-white/50 text-sm leading-relaxed mb-6 line-clamp-3">
                    {article.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {article.helpfulFor.map(tag => (
                      <span key={tag} className="text-[10px] text-white/30 bg-white/[0.02] px-2 py-1 rounded">#{tag}</span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      window.open(article.url, "_blank", "noopener,noreferrer");
                      logActivity('article_open', { article_id: article.id, title: article.title, url: article.url });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium text-sm transition-all group-hover:border-blue-500/30 group-hover:text-white"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Videos Section */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Video className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold text-white/90">Guided Sessions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos
              .filter(v => selectedCategory === 'All Resources' || v.category === selectedCategory)
              .map(video => (
                <div
                  key={video.id}
                  onClick={() => {
                    setPlayingVideo(video);
                    logActivity('video_watch', { video_id: video.id, title: video.title, url: video.url });
                  }}
                  className="cursor-pointer group bg-[#141923] rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 group-hover:bg-purple-500 group-hover:border-purple-400 group-hover:text-white transition-colors">
                        <Play className="w-5 h-5 ml-1 text-white" fill="currentColor" />
                      </div>
                    </div>

                    <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-mono text-white/90 border border-white/10">
                      {video.duration}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-2">
                      {video.category}
                    </div>
                    <h4 className="text-base font-medium text-white/90 group-hover:text-white line-clamp-1 mb-1">
                      {video.title}
                    </h4>
                    <p className="text-xs text-white/40">Watch now</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <p className="text-lg text-white/40">No resources found for this category yet.</p>
            <button
              onClick={() => setSelectedCategory('All Resources')}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              View all resources
            </button>
          </div>
        )}

        {/* Video Modal */}
        {playingVideo && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20 ring-1 ring-white/10">
              <button
                onClick={() => setPlayingVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all border border-white/10"
              >
                <X size={20} />
              </button>
              <iframe
                src={playingVideo.url + "?autoplay=1"}
                title={playingVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
