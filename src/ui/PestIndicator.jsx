// Active-pest indicator — surfaces the bird flock (and future pests) above
// the action buttons so the player knows why their grub yields just dropped.
// Shows remaining time as a coarse "X minutes" string. Re-renders every few
// seconds while a pest is active so the countdown stays roughly accurate.
//
// Renders nothing when no pests are active — silent by default.

import { useEffect, useState } from "react";

const PEST_DEFS = {
  birdFlock: {
    icon: "🦅",
    name: "Carrion Flock",
    summary: "Garden output halved. Grubs are scarce. Hunt them off — or wait.",
  },
};

function formatRemaining(untilMs) {
  const ms = untilMs - Date.now();
  if (ms <= 0) return "any moment";
  const min = Math.ceil(ms / 60000);
  if (min === 1) return "<1 min";
  return `~${min} min`;
}

export default function PestIndicator({ state }) {
  const pests = state.run.activePests || {};
  const activeIds = Object.keys(pests).filter(
    (id) => pests[id]?.until > Date.now()
  );

  // Tick every 10s so the "remaining" string stays fresh. Cheap, only
  // active when at least one pest exists.
  const [, force] = useState(0);
  useEffect(() => {
    if (activeIds.length === 0) return;
    const id = setInterval(() => force((n) => n + 1), 10000);
    return () => clearInterval(id);
  }, [activeIds.length]);

  if (activeIds.length === 0) return null;

  return (
    <div className="pest-indicator-wrap">
      {activeIds.map((id) => {
        const def = PEST_DEFS[id] || {
          icon: "⚠️",
          name: id,
          summary: "Something is wrong.",
        };
        return (
          <div key={id} className="pest-indicator">
            <span className="pest-indicator-icon">{def.icon}</span>
            <div className="pest-indicator-body">
              <div className="pest-indicator-name">{def.name}</div>
              <div className="pest-indicator-summary muted">{def.summary}</div>
            </div>
            <span className="pest-indicator-time muted">
              {formatRemaining(pests[id].until)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
