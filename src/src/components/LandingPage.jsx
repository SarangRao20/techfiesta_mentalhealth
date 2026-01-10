import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Register from './Register';
import SignIn from './SignIn';
const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id^="animate-"]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#0E1116] via-[#16213e] to-[#1a1a2e] font-sans min-h-screen text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${-scrollY * 0.15}px)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
          style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.08}px)` }}
        />
      </div>

      {/* Navbar */}
      <header className="backdrop-blur-xl bg-[#0e1116]/80 shadow-lg fixed top-0 w-full z-50 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#c495e6] to-[#9b6fc7] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
              <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                  d="M12 21C12 21 4 13.5 4 8a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.5-8 13-8 13z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">CarePulse</span>
          </a>

          {/* Nav links */}
          <nav className="hidden lg:flex space-x-6">
            <a href="#features" className="text-gray-400 hover:text-[#c495e6] transition-all duration-300 font-medium relative group">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c495e6] to-[#e4bef2] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#statistics" className="text-gray-400 hover:text-[#c495e6] transition-all duration-300 font-medium relative group">
              Impact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c495e6] to-[#e4bef2] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#testimonials" className="text-gray-400 hover:text-[#c495e6] transition-all duration-300 font-medium relative group">
              Stories
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c495e6] to-[#e4bef2] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#why-CarePulse" className="text-gray-400 hover:text-[#c495e6] transition-all duration-300 font-medium relative group">
              Why Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c495e6] to-[#e4bef2] group-hover:w-full transition-all duration-300"></span>
            </a>

            <a href="#faq" className="text-gray-400 hover:text-[#c495e6] transition-all duration-300 font-medium relative group">
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#c495e6] to-[#e4bef2] group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center space-x-4">
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c495e6] to-[#9b6fc7] text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Register
            </Link>
            <Link
              to="/signin"
              className="px-6 py-2.5 rounded-xl border-2 border-[#c495e6] text-[#c495e6] font-semibold hover:bg-[#c495e6] hover:text-white transition-all duration-300 transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl relative z-10">
          <div className="mb-6">
            <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
              🌟 Supporting Student Mental Health
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Your Journey to <br />
            <span className="bg-gradient-to-r from-[#c495e6] via-[#e4bef2] to-[#c495e6] bg-clip-text text-transparent animate-gradient">
              Mental Wellness
            </span>
            <br />Starts Here
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            A comprehensive platform designed specifically for high school students, providing professional mental health support, assessments, and counseling in a safe, confidential environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/register"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#c495e6] to-[#9b6fc7] text-lg text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 min-w-[200px]">
              Get Started Free
            </a>
            <a href="#features"
              className="px-8 py-4 rounded-xl border-2 border-white/20 text-lg text-white font-semibold hover:bg-white/5 transition-all duration-300 transform hover:scale-105 min-w-[200px] backdrop-blur-sm">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Comprehensive <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">Wellness Support</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need for mental wellness, designed with students in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Mental Health Assessments",
                desc: "Professional PHQ-9, GAD-7, and GHQ assessments to understand your mental health.",
                icon: "📊",
                gradient: "from-purple-500/20 to-pink-500/20",
                delay: "0"
              },
              {
                title: "AI Wellness Companion",
                desc: "24/7 chatbot with crisis detection for immediate help and guidance.",
                icon: "🤖",
                gradient: "from-blue-500/20 to-purple-500/20",
                delay: "100"
              },
              {
                title: "Professional Counselors",
                desc: "Connect with qualified mental health professionals for personalized support.",
                icon: "👨‍⚕️",
                gradient: "from-pink-500/20 to-red-500/20",
                delay: "200"
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                id={`animate-feature-${idx}`}
                className={`group p-8 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl ${isVisible[`animate-feature-${idx}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#c495e6] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="statistics" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
            Mental Health: A <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">Global Priority</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { value: "1 in 4", label: "Students experience mental health issues", color: "text-purple-400" },
              { value: "70", label: "Don't receive adequate support", suffix: "%", color: "text-pink-400" },
              { value: "50", label: "Conditions start by age 14", suffix: "%", color: "text-blue-400" },
              { value: "85", label: "Improve with proper support", suffix: "%", color: "text-green-400" }
            ].map((stat, idx) => (
              <div
                key={idx}
                id={`animate-stat-${idx}`}
                className={`transform transition-all duration-700 ${isVisible[`animate-stat-${idx}`] ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:bg-white/10 h-full flex flex-col justify-center items-center text-center">
                  <h3 className={`text-5xl font-bold ${stat.color} mb-4`}>
                    {isVisible[`animate-stat-${idx}`] && (
                      <CountUp end={stat.value} suffix={stat.suffix || ''} />
                    )}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
            Stories of <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">Transformation</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "Many students hesitate to share their struggles; creating a safe, supportive environment will encourage them to seek help early.",
                author: "Mustaffa Trunkwala",
                gradient: "from-purple-500/10 to-pink-500/10"
              },
              {
                quote: "Students often struggle with anxiety and academic stress; with stronger awareness and early intervention, their mental health can improve significantly.",
                author: "Sakshi Sawant",
                gradient: "from-blue-500/10 to-purple-500/10"
              },
              {
                quote: "Students are increasingly opening up about stress and anxiety, but we need more awareness programs and resources to support them effectively",
                author: "Shalu Ramani",
                gradient: "from-pink-500/10 to-red-500/10"
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                id={`animate-testimonial-${idx}`}
                className={`group p-8 bg-gradient-to-br ${testimonial.gradient} backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 transform hover:-translate-y-2 ${isVisible[`animate-testimonial-${idx}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="text-[#c495e6] text-5xl mb-4 opacity-50">"</div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c495e6] to-[#9b6fc7] flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.author.charAt(0)}
                  </div>
                  <p className="font-semibold text-[#c495e6]">— {testimonial.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">CarePulse Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your path to better mental health in four simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Sign up with a secure, confidential account. Your privacy is our priority - all data is encrypted and protected.",
                icon: (
                  <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "Complete Initial Assessment",
                desc: "Take our professional mental health assessments (PHQ-9, GAD-7, GHQ) to understand your baseline and identify areas that need support.",
                icon: (
                  <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "Get Personalized Recommendations",
                desc: "Based on your assessment, receive tailored recommendations including AI chatbot support, counselor matching, and wellness resources.",
                icon: (
                  <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                step: "04",
                title: "Start Your Wellness Journey",
                desc: "Access 24/7 AI support, book sessions with professional counselors, track your progress, and use our wellness tools daily.",
                icon: (
                  <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              }
            ].map((item, idx) => (
              <div
                key={idx}
                id={`animate-step-${idx}`}
                className={`flex flex-col md:flex-row gap-6 mb-12 group transition-all duration-700 ${isVisible[`animate-step-${idx}`] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                  }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-5xl font-bold text-white/10">{item.step}</span>
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose CarePulse Section */}
      <section id="why-CarePulse" className="py-24 relative bg-gradient-to-b from-transparent to-purple-500/5 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">CarePulse?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We're different because we understand students
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Student-Centric Design",
                desc: "Built specifically for high school students, understanding your unique challenges with academic pressure, social dynamics, and personal growth.",
                icon: (
                  <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                )
              },
              {
                title: "Complete Confidentiality",
                desc: "Your conversations and data are fully encrypted and private. We never share information without your explicit consent.",
                icon: (
                  <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )
              },
              {
                title: "Professional Standards",
                desc: "All our counselors are licensed mental health professionals with experience working with adolescents and young adults.",
                icon: (
                  <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )
              },
              {
                title: "Evidence-Based Tools",
                desc: "We use clinically validated assessments (PHQ-9, GAD-7, GHQ-12) recognized by mental health professionals worldwide.",
                icon: (
                  <svg className="w-12 h-12 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                )
              },
              {
                title: "24/7 Availability",
                desc: "Mental health doesn't follow a schedule. Our AI companion is always available when you need support, day or night.",
                icon: (
                  <svg className="w-12 h-12 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                )
              },
              {
                title: "Affordable Access",
                desc: "We believe mental health care should be accessible. Our platform offers free assessments and affordable counseling options.",
                icon: (
                  <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                )
              }
            ].map((item, idx) => (
              <div
                key={idx}
                id={`animate-why-${idx}`}
                className={`p-8 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 ${isVisible[`animate-why-${idx}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mental Health Resources Section */}
      <section id="resources" className="py-24 relative scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Understanding <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">Mental Health</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Learn about common mental health conditions and how we can help
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                condition: "Depression",
                symptoms: ["Persistent sadness", "Loss of interest", "Sleep changes", "Difficulty concentrating"],
                color: "from-blue-500/20 to-purple-500/20",
                icon: "😔"
              },
              {
                condition: "Anxiety",
                symptoms: ["Excessive worry", "Restlessness", "Physical tension", "Panic attacks"],
                color: "from-purple-500/20 to-pink-500/20",
                icon: "😰"
              },
              {
                condition: "Stress",
                symptoms: ["Overwhelmed feelings", "Irritability", "Headaches", "Fatigue"],
                color: "from-pink-500/20 to-red-500/20",
                icon: "😓"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                id={`animate-condition-${idx}`}
                className={`p-8 bg-gradient-to-br ${item.color} backdrop-blur-sm rounded-2xl border border-white/10 transition-all duration-700 ${isVisible[`animate-condition-${idx}`] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="text-6xl mb-4 text-center">{item.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4 text-center">{item.condition}</h3>
                <p className="text-gray-400 mb-4 text-center">Common symptoms include:</p>
                <ul className="space-y-2">
                  {item.symptoms.map((symptom, sIdx) => (
                    <li key={sIdx} className="flex items-center text-gray-300">
                      <span className="text-[#c495e6] mr-2">✓</span>
                      {symptom}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-400 mb-6">
              These are just a few examples. Our assessments can help identify a wide range of mental health concerns.
            </p>
            <a href="/assessments" className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-[#c495e6] to-[#9b6fc7] text-white font-semibold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105">
              Take a Free Assessment
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">Questions</span>
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Is CarePulse really confidential?",
                a: "Yes, absolutely. All your data is encrypted and private. We never share your information with parents, schools, or anyone else without your explicit permission, except in cases where we're legally required to ensure your safety."
              },
              {
                q: "How much does it cost?",
                a: "Our basic features including AI chatbot support and assessments are completely free. Professional counseling sessions are available at affordable rates, and we offer sliding scale pricing for students who need financial assistance."
              },
              {
                q: "Are your counselors qualified?",
                a: "All our counselors are licensed mental health professionals (LMHCs, LCSWs, or psychologists) with specialized training in adolescent mental health. They undergo rigorous background checks and continuing education."
              },
              {
                q: "What if I'm in a crisis?",
                a: "Our AI chatbot has crisis detection capabilities and will immediately provide you with emergency resources. You can also call the National Suicide Prevention Lifeline at 988 or text HOME to 741741 for immediate support."
              },
              {
                q: "Can I use CarePulse on my phone?",
                a: "Yes! CarePulse is fully responsive and works on all devices - smartphones, tablets, and computers. You can access your account anywhere, anytime."
              },
              {
                q: "Do I need parental consent?",
                a: "This depends on your location and age. In most states, minors 13+ can access mental health services without parental consent. We'll guide you through the requirements during registration."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                id={`animate-faq-${idx}`}
                className={`p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 ${isVisible[`animate-faq-${idx}`] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                  }`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <h3 className="text-xl font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <div className="p-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Start Your <span className="bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">Wellness Journey?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Join thousands of students who have found support, understanding, and tools for better mental health.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="/register"
                className="px-8 py-3.5 text-base rounded-xl bg-gradient-to-r from-[#c495e6] to-[#9b6fc7] text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105">
                Register Now
              </a>
              <a href="/signin"
                className="px-8 py-3.5 text-base rounded-xl border-2 border-[#c495e6] text-[#c495e6] font-semibold hover:bg-[#c495e6] hover:text-white transition-all duration-300 transform hover:scale-105">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="bg-[#0a0d12]/80 backdrop-blur-xl py-16 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#c495e6] to-[#9b6fc7] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                      d="M12 21C12 21 4 13.5 4 8a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.5-8 13-8 13z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#c495e6] to-[#e4bef2] bg-clip-text text-transparent">CarePulse</span>
              </div>
              <p className="text-gray-400 leading-relaxed">Supporting student mental health with professional, accessible, and confidential care.</p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Platform</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="/assessments" className="hover:text-[#c495e6] transition-colors">Assessments</a></li>
                <li><a href="/chatbot" className="hover:text-[#c495e6] transition-colors">AI Support</a></li>
                <li><a href="/consultation" className="hover:text-[#c495e6] transition-colors">Counselors</a></li>
                <li><a href="/meditation" className="hover:text-[#c495e6] transition-colors">Wellness Tools</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-[#c495e6] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#c495e6] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#c495e6] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#c495e6] transition-colors">Crisis Resources</a></li>
              </ul>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl border border-red-500/30">
              <h3 className="font-bold text-lg mb-4 text-red-400">🚨 Emergency</h3>
              <p className="text-gray-400 mb-4 text-sm">If you're in crisis, please reach out:</p>
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-red-300">National Suicide Prevention Lifeline</p>
                  <p className="text-white font-semibold">988 (US) | 1-800-273-8255</p>
                </div>
                <div>
                  <p className="font-bold text-red-300">Crisis Text Line</p>
                  <p className="text-white font-semibold">Text HOME to 741741</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CarePulse. All rights reserved. Made with 💜 for student wellness.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

const CountUp = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      if (typeof end === 'string' && end.includes('in')) {
        const parts = end.split(' in ');
        if (progress === 1) {
          setCount(end);
        }
      } else {
        const value = Math.floor(progress * parseInt(end));
        setCount(value + suffix);
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, suffix]);

  return <span>{count}</span>;
};

export default LandingPage;