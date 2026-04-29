// The persistent rock companion strip. Lives at the bottom of the layout —
// always present once the rock is found, but visually understated. Compact
// horizontal layout: icon · status text · progress bar (when dormant).
// Renders nothing if rock not found yet.

import { getRockProgress, getRockState } from "../systems/rock.js";

export default function StonePanel({ state }) {
  const { run } = state;
  const rock = getRockState(run);

  if (rock === "absent") return null;

  const progress = getRockProgress(run);
  const isDormant = rock === "dormant";

  return (
    <div className={`stone-strip ${isDormant ? "is-dormant" : "is-awakened"}`}>
      <span className="stone-icon">{isDormant ? "🪨" : "👁️"}</span>
      <div className="stone-info">
        <div className="stone-title">
          The Stone
          <span className="stone-status">
            · {isDormant ? "Dormant" : "Awakened"}
          </span>
        </div>
        {isDormant ? (
          <div className="stone-progressline">
            <span className="stone-frag-text">
              {progress.current} / {progress.target} fragments
            </span>
            <div className="stone-progress">
              <div
                className="stone-progress-fill"
                style={{ width: `${progress.percent * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="stone-flavor">It watches you, calm and ancient.</div>
        )}
      </div>
    </div>
  );
}
