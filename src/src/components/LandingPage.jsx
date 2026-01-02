import { Link } from 'react-router-dom';
import react from 'react';
const LandingPage = () => {
  return (
    <div className="bg-[#0E1116] font-serif">
      {/* Navbar */}
      <header className="bg-transparent border-b-2 border-white/30 backdrop-blur-md shadow-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#c495e6] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 21C12 21 4 13.5 4 8a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.5-8 13-8 13z" />
              </svg>
            </div>
            <span className="text-xl font-serif font-semibold text-[#c495e6]">MindWell</span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-[#666] hover:text-[#c495e6] transition-colors">Features</a>
            <a href="#statistics" className="text-[#666] hover:text-[#c495e6] transition-colors">Impact</a>
            <a href="#testimonials" className="text-[#666] hover:text-[#c495e6] transition-colors">Stories</a>
            <a href="#contact" className="text-[#666] hover:text-[#c495e6] transition-colors">Contact</a>
          </nav>

          {/* Auth buttons */}
                <div className="flex items-center space-x-4">
                <Link
                  to="/onboarding"
                  className="px-4 py-2 rounded-lg bg-[#c495e6] text-white hover:bg-[#e4bef2] transition-colors">
                  Register
                </Link>
                
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg border border-[#c495e6] text-[#c495e6] hover:bg-[#c495e6]/10 transition-colors">
                  Sign In
                </Link>
                </div>
              </div>
              </header>

              {/* Hero Section */}
      <section className="pt-32 pb-24 bg-[#0E1116]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Your Journey to <span className="text-[#c495e6]">Mental Wellness</span> Starts Here
          </h1>
          <p className="text-lg text-white/60 mb-8">
            A comprehensive platform designed specifically for high school students, providing professional mental health support, assessments, and counseling in a safe, confidential environment.
          </p>
          <a href="/register"
            className="inline-block px-4 py-2 rounded-lg bg-[#c495e6] text-lg text-white hover:bg-[#e4bef2] transition-colors">
            Register
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[white] mb-4">Comprehensive Wellness Support</h2>
            <p className="text-xl text-[white] max-w-2xl mx-auto">
              Everything you need for mental wellness, designed with students in mind
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="p-8 bg-[#141923 ] rounded-xl shadow-lg border border-[white]/30 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold text-[#c495e6] mb-3">Mental Health Assessments</h3>
              <p className="text-white/60">Professional PHQ-9, GAD-7, and GHQ assessments to understand your mental health.</p>
            </div>
            <div className="p-8 bg-[#141923 ] rounded-xl shadow-lg border border-[white]/30 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold text-[#c495e6] mb-3">AI Wellness Companion</h3>
              <p className="text-white/60">24/7 chatbot with crisis detection for immediate help and guidance.</p>
            </div>
            <div className="p-8 bg-[#141923 ] rounded-xl shadow-lg border border-[white]/30 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-semibold text-[#c495e6] mb-3">Professional Counselors</h3>
              <p className="text-white/60">Connect with qualified mental health professionals for personalized support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="statistics" className="pt-20 bg-[#0E1116]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[white] mb-12">Mental Health: A Global Priority</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <h3 className="text-3xl font-bold text-[#c495e6]">1 in 4</h3>
              <p className="text-white/60 mt-2">Students experience mental health issues</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#e4bef2]">70%</h3>
              <p className="text-white/60 mt-2">Don't receive adequate support</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#c495e6]">50%</h3>
              <p className="text-white/60 mt-2">Conditions start by age 14</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#7bbfa7]">85%</h3>
              <p className="text-white/60 mt-2">Improve with proper support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-[white] mb-12">Stories of Transformation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="p-8 bg-[#141923 ] rounded-xl shadow-lg border border-[#eac4d5]/40 hover:shadow-xl transition-shadow">
              <p className="text-white/60 mb-4">"Many students hesitate to share their struggles; creating a safe, supportive environment will encourage them to seek help early."</p>
              <p className="font-semibold text-[#c495e6]">— Mustaffa Trunkwala.</p>
            </div>
            <div className="p-8 bg-[#141923 ] rounded-xl shadow-lg border border-[#e4bef2]/40 hover:shadow-xl transition-shadow">
              <p className="text-white/60 mb-4">"Students often struggle with anxiety and academic stress; with stronger awareness and early intervention, their mental health can improve significantly."</p>
              <p className="font-semibold text-[#c495e6]">— Sakshi Sawant</p>
            </div>
            <div className="p-8 bg-[#141923 ] rounded-xl shadow-lg border border-[#b8e0d2]/40 hover:shadow-xl transition-shadow">
              <p className="text-white/60 mb-4">"Students are increasingly opening up about stress and anxiety, but we need more awareness programs and resources to support them effectively"</p>
              <p className="font-semibold text-[#c495e6]">— Shalu Ramani</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Section */}
      <section className="pb-10 bg-[#0E1116]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-white">Ready to Start Your Wellness Journey?</h2>
          <p className="text-xl text-white/60 mb-8">Join thousands of students who have found support, understanding, and tools for better mental health.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register"
              className="px-8 py-4 text-lg rounded-lg bg-[#c495e6] text-white hover:bg-[#e4bef2] transition-colors">
              Register
            </a>
            <a href="#contact"
              className="px-8 py-4 text-lg rounded-lg border border-[#c495e6] text-[#c495e6] hover:bg-[#c495e6]/10 transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="bg-[#141923]/50  py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-[#c495e6] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 21C12 21 4 13.5 4 8a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.5-8 13-8 13z" />
                  </svg>
                </div>
                <span className="text-xl font-serif font-semibold text-[#c495e6]">MindWell</span>
              </div>
              <p className="text-white/60">Supporting student mental health with professional, accessible, and confidential care.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-[white]">Platform</h3>
              <ul className="space-y-2 text-white/60">
                <li><a href="/assessments" className="hover:text-[#c495e6]">Assessments</a></li>
                <li><a href="/chatbot" className="hover:text-[#c495e6]">AI Support</a></li>
                <li><a href="/consultation" className="hover:text-[#c495e6]">Counselors</a></li>
                <li><a href="/meditation" className="hover:text-[#c495e6]">Wellness Tools</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-[#c495e6]">Help Center</a></li>
                <li><a href="#" className="hover:text-[#c495e6]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#c495e6]">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#c495e6]">Crisis Resources</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-[red]">Emergency</h3>
              <p className="text-white/60 mb-2">If you're in crisis, please reach out:</p>
              <p className="font-semibold text-[#ff5661]">National Suicide Prevention Lifeline</p>
              <p className="text-white/60">988 (US) | 1-800-273-8255</p>
              <p className="font-semibold text-[#ff5661] mt-2">Crisis Text Line</p>
              <p className="text-white/60">Text HOME to 741741</p>
            </div>
          </div>
          <div className="border-t border-[#eac4d5]/50 mt-12 pt-8 text-center text-white/60">
            <p>&copy; 2024 MindWell. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;