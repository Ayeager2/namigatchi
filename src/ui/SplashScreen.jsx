// Opening splash. Five lines, fade in/out one at a time, like blinking awake.
// Plays on every fresh run (each prestige is a new awakening). Skippable.

import { useEffect, useState } from "react";

const LINES = [
  "You wake.",
  "Cold ash. A sky drained of color.",
  "Your hands are small. Your ribs show through thin skin.",
  "There is no one. There has not been for some time.",
  "Hunger. It says to stand. You stand.",
];

// Pacing per line: fade-in 0.6s + hold 2.2s + fade-out 0.6s = 3.4s.
// Total run: 5 * 3.4 = 17s.
const PER_LINE_MS = 3400;

export default function SplashScreen({ onComplete }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= LINES.length) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setIndex((i) => i + 1), PER_LINE_MS);
    return () => clearTimeout(t);
  }, [index, onComplete]);

  if (index >= LINES.length) return null;

  return (
    <div className="splash" role="presentation">
      <div className="splash-stage">
        {/* key forces remount per line so the CSS animation retriggers cleanly */}
        <div key={index} className="splash-line">
          {LINES[index]}
        </div>
      </div>
      <button
        className="splash-skip"
        onClick={onComplete}
        aria-label="Skip introduction"
      >
        Skip
      </button>
    </div>
  );
}
