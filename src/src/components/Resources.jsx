import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, Play, Video, X, ExternalLink } from 'lucide-react';
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
      description: 'Anxiety is a normal response to stress, but when it becomes overwhelming......',
      readTime: '5 min read',
      helpfulFor: ['mild anxiety', 'exam stress', 'social anxiety']
    },
    {
      id: 2,
      category: 'stress',
      title: 'Coping with Academic Pressure',
      description: 'Academic pressure is real, but there are proven strategies......',
      readTime: '7 min read',
      helpfulFor: ['exam anxiety', 'perfectionism', 'burnout']
    },
    {
      id: 3,
      category: 'wellness',
      title: 'Building Healthy Sleep Habits',
      description: 'Quality sleep is fundamental to mental health......',
      readTime: '6 min read',
      helpfulFor: ['insomnia', 'fatigue', 'mood issues']
    },
    {
      id: 4,
      category: 'depression',
      title: 'Recognizing Depression Signs',
      description: 'Learn to identify early warning signs and when to seek help......',
      readTime: '8 min read',
      helpfulFor: ['low mood', 'loss of interest', 'fatigue']
    },
    {
      id: 5,
      category: 'wellness',
      title: 'Mindful Eating for Mental Health',
      description: 'The connection between nutrition and mental wellbeing......',
      readTime: '5 min read',
      helpfulFor: ['stress eating', 'mood regulation', 'energy levels']
    },
    {
      id: 6,
      category: 'stress',
      title: 'Time Management for Students',
      description: 'Effective strategies to reduce stress through better time management......',
      readTime: '6 min read',
      helpfulFor: ['overwhelm', 'procrastination', 'deadlines']
    },
    {
      id: 7,
      category: 'anxiety',
      title: 'Managing Social Anxiety',
      description: 'Practical tips for navigating social situations with confidence......',
      readTime: '7 min read',
      helpfulFor: ['social situations', 'public speaking', 'meeting new people']
    },
    {
      id: 8,
      category: 'depression',
      title: 'Finding Motivation When Depressed',
      description: 'Small steps to maintain daily routines during difficult times......',
      readTime: '6 min read',
      helpfulFor: ['lack of motivation', 'daily routines', 'self-care']
    },
    {
      id: 9,
      category: 'wellness',
      title: 'Exercise and Mental Health',
      description: 'How physical activity impacts your emotional wellbeing......',
      readTime: '5 min read',
      helpfulFor: ['low energy', 'stress relief', 'mood improvement']
    }
  ];

  const videos = [
    {
      id: 101,
      title: "Daily Mindfulness Practice",
      category: "Anxiety",
      duration: "10:30",
      url: "https://www.youtube.com/embed/inpok4MKVLM", // Sample
      thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: 102,
      title: "Understanding Stress Biology",
      category: "Stress",
      duration: "15:45",
      url: "https://www.youtube.com/embed/Mc7pU78kP38",
      thumbnail: "https://images.unsplash.com/photo-1499209974431-9dac3dc5c27d?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: 103,
      title: "Sleep Hygiene Masterclass",
      category: "Wellness",
      duration: "08:20",
      url: "https://www.youtube.com/embed/nm1TxQj9IsQ",
      thumbnail: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=400"
    }
  ];

  const filteredArticles = selectedCategory === 'All Resources'
    ? articles
    : articles.filter(article => article.category === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-blue-400">
            Mental Health Resources
          </h1>
          <p className="text-lg text-gray-400">
            Comprehensive tools and information for your mental wellness journey
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-10 flex flex-wrap gap-3 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full font-medium transition-all ${selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Articles Header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-7 h-7 text-blue-400" />
          <h2 className="text-2xl font-semibold text-gray-100">Self-Help Articles</h2>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all"
            >
              {/* Category Badge and Read Time */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                  {article.category}
                </span>
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {article.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-3">
                {article.description}
              </p>

              {/* Helpful For */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Helpful for:</p>
                <p className="text-sm text-gray-300">
                  {article.helpfulFor.join(', ')}
                </p>
              </div>

              {/* Read More Button */}
              <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                Read More
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Videos Header */}
        <div className="flex items-center gap-3 mb-6 mt-16">
          <Video className="w-7 h-7 text-purple-400" />
          <h2 className="text-2xl font-semibold text-gray-100">Guided Video Sessions</h2>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {videos.filter(v => selectedCategory === 'All Resources' || v.category === selectedCategory).map(video => (
            <div key={video.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all group">
              <div className="relative aspect-video">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setPlayingVideo(video);
                      logActivity('video_watch', { video_id: video.id, title: video.title });
                    }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black"
                  >
                    <Play fill="currentColor" size={20} />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-[10px] font-mono">{video.duration}</div>
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1">{video.category}</div>
                <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">{video.title}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-400">No articles found in this category</p>
          </div>
        )}

        {/* Support Section */}
        <div className="mt-16 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-3 text-blue-400">
            Need More Support?
          </h3>
          <p className="text-gray-400 mb-5">
            If you're experiencing a mental health crisis or need immediate support, please reach out to a professional or contact a crisis helpline.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-200 mb-1">Crisis Helpline</h4>
              <p className="text-sm text-gray-400">Available 24/7 for immediate support</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-200 mb-1">Chat Support</h4>
              <p className="text-sm text-gray-400">Connect with a counselor online</p>
            </div>
          </div>
        </div>
        {/* Video Modal */}
        {playingVideo && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <button
                onClick={() => setPlayingVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all"
              >
                <X size={24} />
              </button>
              <iframe
                src={playingVideo.url + "?autoplay=1"}
                title={playingVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <div className="absolute bottom-4 left-6">
                <h3 className="text-xl font-bold text-white">{playingVideo.title}</h3>
                <p className="text-sm text-neutral-400">{playingVideo.category} Session</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;