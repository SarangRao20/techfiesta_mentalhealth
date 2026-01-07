const WEIGHTS = {
  emotional_state: {
    calm: 1.0,
    neutral: 0.9,
    tired: 0.7,
    anxious: 0.5,
    sad: 0.4,
    depressed: 0.2
  },

  cognitive_load: {
    low: 1.0,
    medium: 0.7,
    high: 0.4
  },

  emotional_intensity: {
    mild: 1.0,
    moderate: 0.6,
    high: 0.3
  },

  help_receptivity: {
    open: 1.0,
    hesitant: 0.6,
    resistant: 0.3
  },

  time_focus: {
    present: 1.0,
    mixed: 0.7,
    past: 0.5,
    future: 0.6
  }
};

export function calculateConfidenceScore(intent) {
  if (!intent || typeof intent !== 'object') return 0;

  let totalScore = 0;
  let totalWeight = 0;

  for (const key in WEIGHTS) {
    const value = intent[key];
    const weightMap = WEIGHTS[key];

    // Always count the parameter
    totalWeight += 1;

    // Add score if valid, else add 0
    if (value && weightMap[value] !== undefined) {
      totalScore += weightMap[value];
    } else {
      totalScore += 0;
    }
  }

  // Normalize to 0–100
  const normalized = (totalScore / totalWeight) * 100;

  return Math.round(normalized);
}
