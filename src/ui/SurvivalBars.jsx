// Three stat bars (hunger, thirst, energy) shown in the action panel once
// survival is active (hut built). Each bar has a threshold marker showing
// where the penalty kicks in, so the player can see when they're approaching
// trouble.
//
// Hunger and thirst are LOW = good, HIGH = bad — bar fills toward right when
// danger increases. Energy is HIGH = good, LOW = bad — bar fills toward left.

import { SURVIVAL } from "../content/survival.js";

function Bar({ label, value, dangerHigh, dangerLow, icon }) {
  const v = Math.round(value);
  // Compute "danger state" for color
  let state = "ok";
  if (dangerHigh != null && v >= dangerHigh) state = "danger";
  else if (dangerHigh != null && v >= dangerHigh - 15) state = "warn";
  if (dangerLow != null && v <= dangerLow) state = "danger";
  else if (dangerLow != null && v <= dangerLow + 10 && state === "ok") state = "warn";

  // For energy: fill from left = good (high), so visual fill width = value
  // For hunger/thirst: fill from left = bad (high), so visual fill width = value
  // We can use the same fill direction; coloring tells the story.
  return (
    <div className={`sb-bar sb-bar--${state}`}>
      <div className="sb-bar-label">
        <span className="sb-bar-icon" aria-hidden="true">{icon}</span>
        <span className="sb-bar-name">{label}</span>
        <span className="sb-bar-value">{v}</span>
      </div>
      <div className="sb-bar-track">
        <div className="sb-bar-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export default function SurvivalBars({ stats }) {
  if (!stats) return null;
  return (
    <div className="survival-bars">
      <Bar
        label="Hunger"
        value={stats.hunger ?? 0}
        dangerHigh={SURVIVAL.penalties.hungerHigh}
        icon="🍽️"
      />
      <Bar
        label="Thirst"
        value={stats.thirst ?? 0}
        dangerHigh={SURVIVAL.penalties.thirstHigh}
        icon="💧"
      />
      <Bar
        label="Energy"
        value={stats.energy ?? 100}
        dangerLow={SURVIVAL.penalties.energyLow}
        icon="⚡"
      />
    </div>
  );
}
