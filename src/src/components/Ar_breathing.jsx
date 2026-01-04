import { useEffect } from "react";

/* 
  IMPORTANT:
  1. Include these in your public/index.html (NOT inside React):
     <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/ar.js@3.4.5/aframe/build/aframe-ar.js"></script>

  2. FontAwesome CSS must already be loaded globally.
*/

export default function Ar_breathing() {
  useEffect(() => {
    /* ===================== GLOBAL STATE ===================== */
    window.breathingActive = false;
    window.breathingInterval = null;
    window.currentPattern = { inhale: 4, hold1: 4, exhale: 4, hold2: 4 };
    window.currentPhase = 0;
    window.sessionStartTime = null;
    window.cameraPermissionGranted = false;
    window.arInitialized = false;

    /* ===================== INITIALIZE AR ===================== */
    function initializeAR() {
      if (!navigator.mediaDevices?.getUserMedia) {
        showFallbackMode();
        return;
      }

      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          window.cameraPermissionGranted = true;
          stream.getTracks().forEach((t) => t.stop());

          if (window.AFRAME) setupARScene();
          else setTimeout(setupARScene, 1000);
        })
        .catch(showFallbackMode);
    }

    function setupARScene() {
      const scene = document.querySelector("#arScene");
      if (!scene) return;

      scene.addEventListener("arjs-video-loaded", () => {
        window.arInitialized = true;
      });

      scene.addEventListener("camera-error", showFallbackMode);

      setTimeout(() => {
        if (!window.arInitialized) showFallbackMode();
      }, 10000);
    }

    function showFallbackMode() {
      const markerless = document.querySelector("#markerlessBreathing");
      if (markerless) markerless.setAttribute("visible", true);

      const instructions = document.querySelector(".ar-instructions");
      if (instructions) {
        instructions.innerHTML = `
          <h5><i class="fas fa-info-circle text-warning"></i> Using Fallback Mode:</h5>
          <p class="mb-0">
            Camera access not available. Using standard 3D breathing guide instead.
          </p>
        `;
      }
    }

    /* ===================== BREATHING LOGIC ===================== */
    window.patterns = {
      "4-4-4-4": { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: "Box Breathing" },
      "4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: "Sleep Breathing" },
      "6-2-6-2": { inhale: 6, hold1: 2, exhale: 6, hold2: 2, name: "Calm Breathing" },
      emergency: { inhale: 3, hold1: 0, exhale: 3, hold2: 0, name: "Emergency" },
    };

    window.setBreathingPattern = (name) => {
      window.currentPattern = window.patterns[name];

      document.querySelectorAll(".pattern-btn").forEach((b) =>
        b.classList.remove("active")
      );
      document.querySelector(`[data-pattern="${name}"]`)?.classList.add("active");

      document.getElementById("currentPattern").textContent =
        window.currentPattern.name.split(" ")[0];

      const info = document.getElementById("patternInfo");
      info.textContent =
        name === "4-7-8"
          ? "Sleep Breathing: In-4, Hold-7, Out-8"
          : name === "6-2-6-2"
          ? "Calm Breathing: In-6, Hold-2, Out-6, Hold-2"
          : name === "emergency"
          ? "Emergency: Quick In-3, Out-3"
          : "Box Breathing: In-4, Hold-4, Out-4, Hold-4";

      if (window.breathingActive) {
        window.stopBreathing();
        setTimeout(window.startBreathing, 500);
      }
    };

    window.startBreathing = () => {
      window.breathingActive = true;
      window.sessionStartTime = Date.now();
      window.currentPhase = 0;
      window.breathingInterval = setInterval(window.nextBreathingPhase, 1000);
    };

    window.stopBreathing = () => {
      window.breathingActive = false;
      clearInterval(window.breathingInterval);
      document.getElementById("currentPhase").textContent = "Breathing Stopped";
    };

    window.nextBreathingPhase = () => {
      const phases = ["inhale", "hold1", "exhale", "hold2"];
      const names = ["Breathe In", "Hold", "Breathe Out", "Hold"];
      const d = window.currentPattern;

      const durations = [d.inhale, d.hold1, d.exhale, d.hold2];
      while (durations[window.currentPhase] === 0)
        window.currentPhase = (window.currentPhase + 1) % 4;

      document.getElementById("currentPhase").textContent =
        names[window.currentPhase] + ` (${durations[window.currentPhase]}s)`;

      window.currentPhase = (window.currentPhase + 1) % 4;
    };

    window.emergencyBreathing = () => {
      window.setBreathingPattern("emergency");
      window.startBreathing();
      const el = document.getElementById("panicButtonUses");
      el.textContent = parseInt(el.textContent) + 1;
    };

    initializeAR();
    window.setBreathingPattern("4-4-4-4");

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && window.breathingActive) window.stopBreathing();
    });
  }, []);

  return (
    <div className="container mt-4">
      {/* HEADER */}
      <div className="text-center mb-4">
        <h1 className="display-4 text-primary">📱 AR Breathing Exercise</h1>
        <p className="lead">
          Augmented Reality guided breathing for anxiety relief
        </p>
      </div>

      {/* CONTROLS */}
      <div className="ar-controls">
        <h4>
          <i className="fas fa-lungs"></i> Choose Breathing Pattern
        </h4>

        <div className="breathing-pattern-selector">
          <button
            className="pattern-btn active"
            data-pattern="4-4-4-4"
            onClick={() => window.setBreathingPattern("4-4-4-4")}
          >
            📦 Box Breathing (4-4-4-4)
          </button>

          <button
            className="pattern-btn"
            data-pattern="4-7-8"
            onClick={() => window.setBreathingPattern("4-7-8")}
          >
            🌙 Sleep Breathing (4-7-8)
          </button>

          <button
            className="pattern-btn"
            data-pattern="6-2-6-2"
            onClick={() => window.setBreathingPattern("6-2-6-2")}
          >
            🧘 Calm Breathing (6-2-6-2)
          </button>

          <button
            className="pattern-btn"
            data-pattern="emergency"
            onClick={() => window.setBreathingPattern("emergency")}
          >
            🚨 Emergency (3-3-3)
          </button>
        </div>

        <div>
          <button className="btn btn-light mx-2" onClick={window.startBreathing}>
            Start AR Breathing
          </button>
          <button
            className="btn btn-outline-light mx-2"
            onClick={window.stopBreathing}
          >
            Stop
          </button>
        </div>
      </div>

      {/* PANIC BUTTON */}
      <button
        className="panic-button"
        onClick={window.emergencyBreathing}
        title="Emergency Breathing"
      >
        <i className="fas fa-heartbeat"></i>
        <br />
        <small>SOS</small>
      </button>
    </div>
  );
}
