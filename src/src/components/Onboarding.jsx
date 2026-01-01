import { useState } from "react";

const questions = [
  {
    id: 1,
    text: "How are you feeling most of the time recently?",
    options: [
      "Calm and stable",
      "Occasionally anxious",
      "Frequently overwhelmed",
      "Emotionally exhausted",
    ],
  },
  {
    id: 2,
    text: "How well are you sleeping?",
    options: [
      "Very well",
      "Some disturbances",
      "Poor sleep",
      "Severe insomnia",
    ],
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      alert("Submitted answers:\n" + JSON.stringify(answers, null, 2));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#050914] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-gray-400 text-sm">Welcome to,</p>
          <h1 className="text-3xl font-semibold text-white tracking-wide">
            NirVana
          </h1>
        </div>

        {/* Question */}
        <h2 className="text-white text-xl mb-6">
          {currentQuestion.text}
        </h2>

        {/* Options */}
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const selected = answers[currentQuestion.id] === option;

            return (
              <button
                key={index}
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: option,
                  }))
                }
                className={`
                  w-full flex items-center justify-between
                  rounded-xl px-4 py-4 text-left
                  transition-all duration-200
                  bg-[#111827]
                  border
                  ${
                    selected
                      ? "border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.8)]"
                      : "border-white/10 hover:border-white/20"
                  }
                `}
              >
                <div>
                  <p className="text-white font-medium">{option}</p>
                </div>

                {selected && (
                  <span className="text-indigo-400 text-sm font-medium">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action button */}
        <div className="mt-8 flex justify-end">
          <button
            disabled={!answers[currentQuestion.id]}
            onClick={handleNext}
            className={`
              px-8 py-3 rounded-lg font-medium
              transition
              ${
                answers[currentQuestion.id]
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }
            `}
          >
            {currentIndex === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
