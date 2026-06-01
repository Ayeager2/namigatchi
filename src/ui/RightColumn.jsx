// Right column wrapper. Hosts three tabs:
//   - Recent  (gameplay feedback — gather drops, etc.)
//   - Unlocks (progression / narrative beats — whispers, builds, teachings)
//   - Stats   (observability dashboard, gated behind first prestige)
//
// Optional collapse: when `onClose` is provided, a small ‹ button at the
// top-right collapses the panel into an edge tab (handled by Shell).
// When `overlayMode` is true, the column adds a class for absolute
// positioning over the center column (Shell controls the modes).

import { useState } from "react";
import LogPanel from "./LogPanel.jsx";
import UnlocksPanel from "./UnlocksPanel.jsx";
import StatsPanel from "./StatsPanel.jsx";
import { isStatsUnlocked } from "../systems/stats.js";

export default function RightColumn({ state, onClose, overlayMode = false }) {
  const [tab, setTab] = useState("log");
  const statsUnlocked = isStatsUnlocked(state);

  // If Stats becomes hidden (post-prestige resets shouldn't), snap back.
  if (tab === "stats" && !statsUnlocked) setTab("log");

  return (
    <div className={`right-col ${overlayMode ? "right-col--overlay" : ""}`}>
      <div className="rc-header">
        <div className="rc-tabs">
          <button
            className={`rc-tab ${tab === "log" ? "is-active" : ""}`}
            onClick={() => setTab("log")}
          >
            Recent
          </button>
          <button
            className={`rc-tab ${tab === "unlocks" ? "is-active" : ""}`}
            onClick={() => setTab("unlocks")}
          >
            Unlocks
          </button>
          {statsUnlocked && (
            <button
              className={`rc-tab ${tab === "stats" ? "is-active" : ""}`}
              onClick={() => setTab("stats")}
            >
              Stats
            </button>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            className="rc-close"
            onClick={onClose}
            title="Collapse this panel"
            aria-label="Collapse panel"
          >
            ›
          </button>
        )}
      </div>
      {tab === "log" && <LogPanel state={state} />}
      {tab === "unlocks" && <UnlocksPanel state={state} />}
      {tab === "stats" && <StatsPanel state={state} />}
    </div>
  );
}
