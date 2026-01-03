import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmotionalVector:
    def __init__(self, valence=0.5, arousal=0.5, cognitive_load=0.2, 
                 rumination=0.0, agency=1.0, hopelessness=0.0, 
                 engagement_stability=1.0, trust_level=0.5):
        self.valence = valence            # 0.0 (positive) -> 1.0 (negative/heavy)
        self.arousal = arousal            # 0.0 (calm) -> 1.0 (agitated/panic)
        self.cognitive_load = cognitive_load # 0.0 (clear) -> 1.0 (overwhelmed)
        self.rumination = rumination      # 0.0 (none) -> 1.0 (looping)
        self.agency = agency              # 0.0 (helpless) -> 1.0 (empowered)
        self.hopelessness = hopelessness  # 0.0 (hopeful) -> 1.0 (despairing)
        self.engagement_stability = engagement_stability # 0.0 (checking out) -> 1.0 (present)
        self.trust_level = trust_level    # 0.0 (guarded) -> 1.0 (open)

    def to_dict(self):
        return self.__dict__

    @classmethod
    def from_dict(cls, data):
        if not data:
            return cls()
        # Handle potential key mismatches if DB has old format
        return cls(
            valence=data.get('valence', 0.5),
            arousal=data.get('arousal', 0.5),
            cognitive_load=data.get('cognitive_load', 0.2),
            rumination=data.get('rumination', 0.0),
            agency=data.get('agency', 1.0),
            hopelessness=data.get('hopelessness', 0.0),
            engagement_stability=data.get('engagement_stability', data.get('engagement', 1.0)),
            trust_level=data.get('trust_level', data.get('trust', 0.5))
        )

class EmotionalCore:
    def __init__(self, session_model=None):
        self.session_model = session_model

    def get_state(self, session_obj):
        """Retrieve current vector state from session object."""
        try:
            vectors_json = session_obj.emotional_vectors
            if vectors_json:
                res = json.loads(vectors_json)
                return EmotionalVector.from_dict(res)
        except Exception as e:
            logger.error(f"Error loading emotional state: {e}")
        return EmotionalVector()

    def update_state(self, session_obj, user_input, explicit_signals=None):
        """
        Update the emotional state based on user input and signals.
        """
        current_state = self.get_state(session_obj)
        history = self._load_history(session_obj)

        # 1. Heuristic Updates
        updates = self._heuristic_analysis(user_input)
        logger.warning(f"HEURISTIC UPDATES: {updates}")
        
        # 2. Apply Explicit Signals
        if explicit_signals:
            for dim, change in explicit_signals.items():
                if hasattr(current_state, dim):
                    new_val = getattr(current_state, dim) + change
                    setattr(current_state, dim, max(0.0, min(1.0, new_val)))

        # 3. Apply Heuristic Updates
        for dim, change in updates.items():
             if hasattr(current_state, dim):
                new_val = getattr(current_state, dim) + change
                setattr(current_state, dim, max(0.0, min(1.0, new_val)))

        # 4. Save State & History
        self._save_state(session_obj, current_state, history)
        
        return current_state

    def get_constraints(self, state: EmotionalVector, history: list = None):
        """
        Generate system constraints and instructions based on emotional state.
        This conditions the AI personality and UI.
        """
        constraints = {
            "ui_mode": "standard",
            "ai_instruction": "Be supportive and conversational.",
            "safety_escalation": False
        }
        
        # Calculate Trend
        trend_direction = "stable"
        if history and len(history) > 2:
            trend_direction = self.calculate_trend(history)

        # --- SAFETY (GUARDIAN ANGEL) ---
        if self._check_safety_escalation(state, trend_direction):
            constraints["safety_escalation"] = True
            constraints["ai_instruction"] = "GUARDIAN ANGEL MODE. User is in key risk zone (Hopelessness + Negative Trend). Be warm, protective, and minimal. Do not ask open questions. Focus on immediate safety and connection."
            constraints["ui_mode"] = "restricted"
            return constraints

        # --- DECISION RULES ---

        # 1. High Cognitive Load (>0.7) -> Disable open-ended text, binary buttons only
        if state.cognitive_load > 0.7:
            constraints["ai_instruction"] += " User is overwhelmed. Use short sentences (max 10 words). Offer only one simple choice at a time."
            constraints["ui_mode"] = "simplified_binary"

        # 2. High Rumination (>0.6) -> Stop venting, trigger grounding
        if state.rumination > 0.6:
            constraints["ai_instruction"] += " User is looping (Rumination). Do not explore the distressing thought further. Gently redirect to sensory grounding (what can you see/hear?)."

        # 3. Low Agency (<0.3) -> One simple action only, no advice
        if state.agency < 0.3:
            constraints["ai_instruction"] += " User feels helpless (Low Agency). Do not give advice or lists. Offer a tiny, manageable micro-step."
            
        # 4. Low Engagement Stability (< 0.4) -> Re-ground, short messages
        if state.engagement_stability < 0.4:
            constraints["ai_instruction"] += " User is checking out (Low Engagement). Keep messages very short and reassuring to re-engage."
            
        # Arousal (Panic) Check
        if state.arousal > 0.7:
            constraints["ai_instruction"] += " User is agitated. Focus on grounding. Use calming, rhythmic language."

        return constraints

    def calculate_trend(self, history):
        """Analyze past 3 states to determine direction."""
        if not history or len(history) < 2:
            return "stable"
            
        # Check Valence trend (Positive/Negative)
        # Higher Valence = More Negative
        last_val = history[-1].get('valence', 0.5)
        prev_val = history[-2].get('valence', 0.5)
        
        if last_val > prev_val + 0.1:
            return "worsening"
        elif last_val < prev_val - 0.1:
            return "improving"
            
        return "stable"

    def _load_history(self, session_obj):
        try:
            hist_json = session_obj.emotional_history
            if hist_json:
                h = json.loads(hist_json)
                logger.warning(f"HISTORY LOADED: Found {len(h)} entries.")
                return h
        except Exception as e:
            logger.error(f"HISTORY LOAD ERROR: {e}")
        return []

    def _save_state(self, session_obj, state, history):
        # Add current snapshot to history
        snapshot = state.to_dict()
        snapshot['timestamp'] = datetime.utcnow().isoformat()
        
        # Keep last 10 entries for trend analysis
        history.append(snapshot)
        history = history[-10:] 
        
        logger.warning(f"SAVING STATE: Vector={state.to_dict()} | HistoryCount={len(history)}")

        session_obj.emotional_vectors = json.dumps(state.to_dict())
        session_obj.emotional_history = json.dumps(history)

    def _check_safety_escalation(self, state, trend):
        """
        Guardian Angel Trigger: 
        Hopelessness > 0.6 AND Negative Valence (>0.6) AND Worsening Trend
        """
        if state.hopelessness > 0.6 and state.valence > 0.6 and trend == "worsening":
            return True
        return False

    def _heuristic_analysis(self, text):
        """
        Simple keyword-based vector shifting. 
        In production, this is replaced by LLM/Classifier.
        """
        updates = {}
        t = text.lower()
        
        # --- DEBUG FORCE TRIGGER ---
        if "debug_panic" in t:
            logger.warning(f"!!! DEBUG PANIC TRIGGERED !!! on input: {text}")
            return {
                'arousal': 1.0, 
                'valence': 1.0, 
                'cognitive_load': 1.0, 
                'hopelessness': 1.0, 
                'agency': -1.0
            }
        # ---------------------------

        # Valence (Pos/Neg)
        if any(w in t for w in ['sad', 'pain', 'hurt', 'dark', 'empty', 'bad', 'horrible', 'awful', 'terrible', 'cry', 'crying', 'depressed']):
            updates['valence'] = 0.4
        if any(w in t for w in ['good', 'better', 'light', 'okay', 'step', 'thanks', 'cool', 'nice', 'happy']):
            updates['valence'] = -0.3

        # Arousal (Calm/Agitated)
        if any(w in t for w in ['panic', 'shake', 'fast', 'scared', 'terrified', 'breath', 'racing', 'sweat', 'anxious', 'worry', 'nervous']):
            updates['arousal'] = 0.5
        if any(w in t for w in ['calm', 'breathe', 'slow', 'relax', 'safe', 'ground', 'still']):
            updates['arousal'] = -0.3

        # Hopelessness
        if any(w in t for w in ['never', 'always', 'pointless', 'forever', 'can\'t', 'give up', 'no way out', 'tired of', 'quit', 'worthless']):
             updates['hopelessness'] = 0.5
             updates['agency'] = -0.4

        # Rumination
        if any(w in t for w in ['again', 'loop', 'round', 'stop thinking', 'keeps coming back']):
             updates['rumination'] = 0.5

        # Cognitive Load
        if len(text.split()) > 30 or any(w in t for w in ['don\'t know what to do', 'confused', 'too much', 'overwhelmed', 'racing thoughts']): 
             updates['cognitive_load'] = 0.5
        
        # Engagement (Proxy: very short answers = dropping engagement?)
        if len(text.split()) < 3 and not any(w in t for w in ['yes', 'no', 'ok']):
            updates['engagement_stability'] = -0.3
        
        return updates

# Global Instance
emotional_core = EmotionalCore()
