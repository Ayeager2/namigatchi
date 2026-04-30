// Body & Mind stat bars, shown in the action panel once survival is active.
//
// Body section:  Hunger, Thirst, Energy, HP — physical state.
// Mind section:  Resolve (happiness), Sanity — mental state.
// Defense:       flat shield value at the bottom.
//
// "Resolve" is the user-facing label for the `happiness` field — daily
// wellbeing, the will to keep going. (Spirit is being reserved for a future
// magic-system stat in Era 3+, where it will mean something genuinely mystical.)
// The data field stays `happiness` so labels can be renamed freely.

import { SURVIVAL } from "../content/survival.js";
import { getDefense } from "../systems/threats.js";

function Bar({ label, value, dangerHigh, dangerLow, icon, kind = "default" }) {
  const v = Math.round(value);
  let state = "ok";
  if (dangerHigh != null && v >= dangerHigh) state = "danger";
  else if (dangerHigh != null && v >= dangerHigh - 15) state = "warn";
  if (dangerLow != null && v <= dangerLow) state = "danger";
  else if (dangerLow != null && v <= dangerLow + 10 && state === "ok")
    state = "warn";

  return (
    <div className={`sb-bar sb-bar--${state} sb-bar--${kind}`}>
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

export default function SurvivalBars({ state }) {
  const stats = state?.run?.stats;
  if (!stats) return null;
  const defense = getDefense(state);

  return (
    <div className="survival-bars">
      <div className="sb-section">
        <div className="sb-section-title">Body</div>
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
        <Bar
          label="HP"
          value={stats.hp ?? 100}
          dangerLow={20}
          icon="❤️"
          kind="hp"
        />
      </div>

      <div className="sb-section">
        <div className="sb-section-title">Mind</div>
        <Bar
          label="Resolve"
          value={stats.happiness ?? 50}
          dangerLow={25}
          icon="✦"
          kind="resolve"
        />
        <Bar
          label="Sanity"
          value={stats.sanity ?? 50}
          dangerLow={25}
          icon="◐"
          kind="sanity"
        />
      </div>

      <div className="sb-defense">
        <span className="sb-defense-icon" aria-hidden="true">🛡️</span>
        <span className="sb-defense-name">Defense</span>
        <span className="sb-defense-value">{defense}</span>
      </div>
    </div>
  );
}
