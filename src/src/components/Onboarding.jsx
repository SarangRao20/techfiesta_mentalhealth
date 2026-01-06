import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { API_URL } from "../config";

const questions = [
  {
    id: "adjustment",
    text: "Does this new place feel like a home, or just a place you sleep?",
    subtext: "Transitioning to a new environment can be disorienting.",
    options: [
      "It's starting to feel like home",
      "I'm adjusting, but it's slow",
      "I feel like a guest in my own life",
      "It feels completely alien and cold",
    ],
  },
  {
    id: "social",
    text: "Are you finding your people, or just finding your way through the crowd?",
    subtext: "Loneliness can flourish even in a crowded room.",
    options: [
      "I've found my tribe",
      "I have acquaintances, but no deep bonds",
      "I feel invisible in the crowd",
      "I'm actively isolating myself",
    ],
  },
  {
    id: "academic",
    text: "Is the pressure to succeed fueling you, or burning you out?",
    subtext: "Ambition is energy, but pressure is a weight.",
    options: [
      "It lights a fire in me",
      "It's heavy, but manageable",
      "I'm constantly anxious about failing",
      "I feel paralyzed by the expectations",
    ],
  },
  {
    id: "support",
    text: "When things get heavy, do you have a safe space to let it out?",
    subtext: "Everyone needs an anchor.",
    options: [
      "Yes, I have a strong support system",
      "I have one person I can trust",
      "I bottle it up mostly",
      "I have nowhere to go",
    ],
  },
  {
    id: "anxiety",
    text: "How loud are your thoughts when you're trying to sleep?",
    subtext: "The silence of the night reveals the noise of the mind.",
    options: [
      "Peacefully quiet",
      "A gentle hum of reflection",
      "Loud enough to keep me awake sometimes",
      "A deafening storm of worries",
    ],
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsExiting(true);
      // Simulate saving or actually save if endpoint exists
      console.log("Onboarding Answers:", answers);
      
      // Save minimal preference to potentially customize experience locally
      try {
         // Could call an endpoint here if needed
      } catch (e) {
         console.error(e);
      }
      
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 1000);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-[#050505] transition-opacity duration-1000 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
      </div>

      <div className="w-full max-w-4xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Question Context */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 tracking-wider uppercase">
            <span>Step {currentIndex + 1} of {questions.length}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60 leading-tight">
            {currentQuestion.text}
          </h1>
          
          <p className="text-lg text-white/50 font-light leading-relaxed border-l-2 border-purple-500/50 pl-4">
            {currentQuestion.subtext}
          </p>

          <div className="pt-8">
             <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700 ease-out"
                   style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        </div>

        {/* Right Side: Options Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
           {/* Card decorative glow */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all duration-700" />

           <div className="space-y-3 relative z-10">
            {currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`
                    w-full text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden
                    ${isSelected 
                       ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-[0_0_20px_rgba(147,51,234,0.15)]' 
                       : 'bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/[0.07] hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-medium text-sm md:text-base tracking-wide">{option}</span>
                    {isSelected && (
                      <div className="bg-purple-500 rounded-full p-0.5 animate-in zoom-in spin-in-180 duration-300">
                         <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  {/* Fill effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent transition-transform duration-500 ease-out origin-left ${isSelected ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className={`
                 group flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all duration-300
                 ${answers[currentQuestion.id]
                   ? 'bg-white text-black hover:bg-purple-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105'
                   : 'bg-white/5 text-white/30 cursor-not-allowed'
                 }
              `}
            >
              <span>{currentIndex === questions.length - 1 ? "Start Journey" : "Continue"}</span>
              <ArrowRight size={18} className={`transition-transform duration-300 ${answers[currentQuestion.id] ? 'group-hover:translate-x-1' : ''}`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
