// The center column on desktop, top of stack on mobile.
// The location header + the primary action (Gather, with live cooldown bar),
// the Hunt action (once a hunting tool is owned), survival bars, and
// secondary actions (Eat, Drink, Rest) once survival is active.
//
// Hunt has its own cooldown — much longer than gather, shrinks with the
// Hunting skill. The button only renders once the player owns a Net or
// Snare; the cooldown bar fills the same way Gather's does.

import { useEffect, useState } from "react";
import {
  survivalActive,
  canPerformSurvivalAction,
} from "../systems/survival.js";
import { canGatherFull, getGatherCooldownMs } from "../systems/gathering.js";
import {
  canHunt,
  getHuntStatus,
} from "../systems/hunting.js";
import SurvivalBars from "./SurvivalBars.jsx";
import PestIndicator from "./PestIndicator.jsx";
import EatButton from "./EatButton.jsx";

export default function ActionPanel({ state, actions, settings, settingsHook }) {
  const survival = survivalActive(state);

  // Re-render while either cooldown is active so the fill bars animate.
  // The interval only runs when at least one cooldown is in flight.
  const [now, setNow] = useState(Date.now());
  const lastGatheredAt = state.run.lastGatheredAt || 0;
  const gatherCooldownMs = getGatherCooldownMs(state);
  const gatherElapsed = now - lastGatheredAt;
  const gatherCooling =
    lastGatheredAt > 0 && gatherElapsed < gatherCooldownMs;
  const gatherProgress = Math.max(
    0,
    Math.min(1, gatherElapsed / gatherCooldownMs)
  );

  const huntStatus = getHuntStatus(state);
  const lastHuntAt = state.run.lastHuntAt || 0;
  const huntCooldownMs = huntStatus.cooldownMs;
  const huntElapsed = now - lastHuntAt;
  const huntCooling = lastHuntAt > 0 && huntElapsed < huntCooldownMs;
  const huntProgress = Math.max(
    0,
    Math.min(1, huntElapsed / huntCooldownMs)
  );

  const anyCooling = gatherCooling || huntCooling;

  useEffect(() => {
    if (!anyCooling) return;
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [anyCooling]);

  const gatherCheck = canGatherFull(state);
  const huntCheck = canHunt(state);
  const eatCheck = canPerformSurvivalAction(state, "eat");
  const drinkCheck = canPerformSurvivalAction(state, "drink");
  const restCheck = canPerformSurvivalAction(state, "rest");

  const keybinds = settings?.keybindings || {};
  const formatKey = (k) => (k ? k.toUpperCase() : "");

  return (
    <section className="action-panel">
      <div className="panel-header">
        <h2>The Wasteland</h2>
        <p className="muted">
          There is nothing here. There is everything to find.
        </p>
      </div>

      {survival && <SurvivalBars state={state} />}

      <PestIndicator state={state} />

      <div className="action-row">
        <button
          className={`btn btn-primary btn-gather ${
            gatherCooling ? "is-cooling" : ""
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
            {!gatherCheck.ok && !gatherCooling
              ? "Too tired"
              : gatherCooling
              ? "Gathering…"
              : "Gather"}
            {keybinds.gather && (
              <span className="btn-hotkey">{formatKey(keybinds.gather)}</span>
            )}
          </span>
          <span
            className="btn-cooldown-fill"
            style={{
              transform: `scaleX(${gatherCooling ? gatherProgress : 0})`,
              opacity: gatherCooling ? 1 : 0,
            }}
          />
        </button>

        {huntStatus.owned && (
          <button
            className={`btn btn-primary btn-hunt ${
              huntCooling ? "is-cooling" : ""
            }`}
            onClick={actions.hunt}
            disabled={!huntCheck.ok}
            title={
              huntCheck.ok
                ? keybinds.hunt
                  ? `Hunt (${formatKey(keybinds.hunt)}) · Lv ${
                      huntStatus.level
                    }`
                  : `Hunt · Lv ${huntStatus.level}`
                : huntCheck.reason
            }
          >
            <span className="btn-label">
              {huntCooling
                ? "Hunting…"
                : !huntCheck.ok
                ? huntCheck.reason || "Cannot hunt"
                : `Hunt · Lv ${huntStatus.level}`}
              {keybinds.hunt && (
                <span className="btn-hotkey">{formatKey(keybinds.hunt)}</span>
              )}
            </span>
            <span
              className="btn-cooldown-fill"
              style={{
                transform: `scaleX(${huntCooling ? huntProgress : 0})`,
                opacity: huntCooling ? 1 : 0,
              }}
            />
          </button>
        )}
      </div>

      {survival && (
        <div className="action-row action-row--secondary">
          <EatButton
            state={state}
            actions={actions}
            settings={settings}
            settingsHook={settingsHook}
            eatCheck={eatCheck}
          />

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
