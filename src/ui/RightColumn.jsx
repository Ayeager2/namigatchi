// Right column wrapper. Hosts four tabs:
//   - Recent  (gameplay feedback — gather drops, etc.)
//   - Unlocks (progression / narrative beats — whispers, builds, teachings)
//   - Skills  (passive readout of skill levels & XP progress)
//   - Stats   (observability dashboard, gated behind first prestige)
//
// On mobile this whole column appears at the bottom of the stack;
// the tab system works identically there.

import { useState } from "react";
import LogPanel from "./LogPanel.jsx";
import UnlocksPanel from "./UnlocksPanel.jsx";
import SkillsPanel from "./SkillsPanel.jsx";
import StatsPanel from "./StatsPanel.jsx";
import { isStatsUnlocked } from "../systems/stats.js";
import { getActiveSkills } from "../content/skills.js";

export default function RightColumn({ state }) {
  const [tab, setTab] = useState("log");
  const statsUnlocked = isStatsUnlocked(state);

  // Skills tab is visible once the player has earned XP in any skill (i.e.
  // taken any meaningful action). Until then, keep the right-column quiet.
  const skillsVisible = (() => {
    const skills = state.run.skills || {};
    for (const def of getActiveSkills()) {
      if ((skills[def.id]?.xp || 0) > 0) return true;
    }
    return false;
  })();

  // If a tab becomes hidden, snap back to log.
  if (tab === "stats" && !statsUnlocked) setTab("log");
  if (tab === "skills" && !skillsVisible) setTab("log");

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
        {skillsVisible && (
          <button
            className={`rc-tab ${tab === "skills" ? "is-active" : ""}`}
            onClick={() => setTab("skills")}
          >
            Skills
          </button>
        )}
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
      {tab === "skills" && <SkillsPanel state={state} />}
      {tab === "stats" && <StatsPanel state={state} />}
    </div>
  );
}
