// Right column wrapper. Hosts three tabs:
//   - Recent  (gameplay feedback — gather drops, etc.)
//   - Unlocks (progression / narrative beats — whispers, builds, teachings)
//   - Stats   (observability dashboard, gated behind first prestige)
//
// On mobile this whole column appears at the bottom of the stack;
// the tab system works identically there.

import { useState } from "react";
import LogPanel from "./LogPanel.jsx";
import UnlocksPanel from "./UnlocksPanel.jsx";
import StatsPanel from "./StatsPanel.jsx";
import { isStatsUnlocked } from "../systems/stats.js";

export default function RightColumn({ state }) {
  const [tab, setTab] = useState("log");
  const statsUnlocked = isStatsUnlocked(state);

  // If stats become locked again somehow, snap back to log.
  if (tab === "stats" && !statsUnlocked) {
    setTab("log");
  }

  return (
    <div className="right-col">
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
      {tab === "log" && <LogPanel state={state} />}
      {tab === "unlocks" && <UnlocksPanel state={state} />}
      {tab === "stats" && <StatsPanel state={state} />}
    </div>
  );
}
