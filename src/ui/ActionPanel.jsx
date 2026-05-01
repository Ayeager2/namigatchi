// The center column on desktop, top of stack on mobile.
// The location header + the primary action (Gather, with live cooldown bar),
// plus survival bars and secondary actions (Eat, Drink, Rest) once survival
// is active.

import { useEffect, useState } from "react";
import {
  survivalActive,
  canPerformSurvivalAction,
} from "../systems/survival.js";
import { canGatherFull, getGatherCooldownMs } from "../systems/gathering.js";
import SurvivalBars from "./SurvivalBars.jsx";

export default function ActionPanel({ state, actions, settings }) {
  const survival = survivalActive(state);

  // Tick a re-render while the gather cooldown is active so the fill bar
  // animates smoothly. Only ticks when needed; CPU is idle otherwise.
  const [now, setNow] = useState(Date.now());
  const lastGatheredAt = state.run.lastGatheredAt || 0;
  const cooldownMs = getGatherCooldownMs(state);
  const elapsed = now - lastGatheredAt;
  const isCoolingDown = lastGatheredAt > 0 && elapsed < cooldownMs;
  const cooldownProgress = Math.max(0, Math.min(1, elapsed / cooldownMs));

  useEffect(() => {
    if (!isCoolingDown) return;
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [isCoolingDown]);

  const gatherCheck = canGatherFull(state);
  const eatCheck = canPerformSurvivalAction(state, "eat");
  const drinkCheck = canPerformSurvivalAction(state, "drink");
  const restCheck = canPerformSurvivalAction(state, "rest");

  const keybinds = settings?.keybindings || {};
  const formatKey = (k) => (k ? k.toUpperCase() : "");

  return (
    <section className="action-panel">
      <div className="panel-header">
        <h2>The Wasteland</h2>
        <p className="muted">There is nothing here. There is everything to find.</p>
      </div>

      {survival && <SurvivalBars state={state} />}

      <div className="action-row">
        <button
          className={`btn btn-primary btn-gather ${
            isCoolingDown ? "is-cooling" : ""
          }`}
          onClick={actions.gather}
          disabled={!gatherCheck.ok}
          title={
            gatherCheck.ok
              ? keybinds.gather
                ? `Gather (${formatKey(keybinds.gather)})`
                : "Gather"
              : gatherCheck.reason
          }
        >
          <span className="btn-label">
            {!gatherCheck.ok && !isCoolingDown
              ? "Too tired"
              : isCoolingDown
              ? "Gathering…"
              : "Gather"}
            {keybinds.gather && (
              <span className="btn-hotkey">{formatKey(keybinds.gather)}</span>
            )}
          </span>
          <span
            className="btn-cooldown-fill"
            style={{
              transform: `scaleX(${isCoolingDown ? cooldownProgress : 0})`,
              opacity: isCoolingDown ? 1 : 0,
            }}
          />
        </button>
      </div>

      {survival && (
        <div className="action-row action-row--secondary">
          <button
            className="btn btn-secondary"
            onClick={actions.eat}
            disabled={!eatCheck.ok}
            title={
              eatCheck.ok
                ? keybinds.eat
                  ? `Eat (${formatKey(keybinds.eat)})`
                  : "Eat"
                : eatCheck.reason
            }
          >
            🌿 Eat
            {keybinds.eat && (
              <span className="btn-hotkey">{formatKey(keybinds.eat)}</span>
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={actions.drink}
            disabled={!drinkCheck.ok}
            title={
              drinkCheck.ok
                ? keybinds.drink
                  ? `Drink (${formatKey(keybinds.drink)})`
                  : "Drink"
                : drinkCheck.reason
            }
          >
            💧 Drink
            {keybinds.drink && (
              <span className="btn-hotkey">{formatKey(keybinds.drink)}</span>
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={actions.rest}
            disabled={!restCheck.ok}
            title={
              restCheck.ok
                ? keybinds.rest
                  ? `Rest (${formatKey(keybinds.rest)})`
                  : "Rest"
                : restCheck.reason
            }
          >
            {state.run.built?.firepit ? "🔥 Rest" : "🛌 Rest"}
            {keybinds.rest && (
              <span className="btn-hotkey">{formatKey(keybinds.rest)}</span>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
