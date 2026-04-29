// Top-level layout. Composes the smaller UI components into a responsive grid.
//
// Mobile (≤900px): single column, ordered for best mobile flow.
// Desktop (>900px): three columns — Inventory/Buildings | Wasteland | Log.
// Stone strip spans full width below the grid.
//
// Prestige UI (Echoes counter, "Channel the Rock" button) is gated behind
// `era >= 2`. Hidden in early game; revealed as a reward for progress.

import Scene from "./Scene.jsx";
import ActionPanel from "./ActionPanel.jsx";
import InventoryPanel from "./InventoryPanel.jsx";
import BuildingsPanel from "./BuildingsPanel.jsx";
import StonePanel from "./StonePanel.jsx";
import RightColumn from "./RightColumn.jsx";
import { getPrestigeReward } from "../systems/prestige.js";
import { computeEra, getEra } from "../systems/era.js";

export default function Shell({ state, actions }) {
  const era = computeEra(state);
  const eraInfo = getEra(state);
  const prestigeUnlocked = era >= 2;
  const reward = getPrestigeReward(state);
  const showEchoes = prestigeUnlocked || state.persistent.echoes > 0;

  const handleReset = () => {
    if (prestigeUnlocked && reward.eligible) {
      const lines = [
        `Channel the Rock to wipe this world?`,
        ``,
        `You will gain ${reward.echoes} Echo${reward.echoes !== 1 ? "es" : ""}.`,
        ``,
        `Reasons:`,
        ...reward.reasons.map((r) => `  +${r.value}  ${r.label}`),
      ];
      if (window.confirm(lines.join("\n"))) {
        actions.prestige();
      }
    } else {
      const lines = [
        `Reset the current run?`,
        ``,
        `Your progress this run will be lost. No rewards yet.`,
      ];
      if (window.confirm(lines.join("\n"))) {
        actions.resetRun();
      }
    }
  };

  return (
    <div className="shell">
      <header className="shell-header">
        <h1>Namigatchi</h1>
        <div className="shell-meta">
          {era > 0 && <span className="meta-item meta-era">{eraInfo.name}</span>}
          {showEchoes && (
            <span className="meta-item">Echoes: {state.persistent.echoes}</span>
          )}
        </div>
      </header>

      <Scene state={state} />

      {/* DOM order = mobile order. Grid-template-areas reorders for desktop. */}
      <div className="shell-grid">
        <main className="shell-area shell-area--center">
          <ActionPanel state={state} actions={actions} />
        </main>

        <aside className="shell-area shell-area--left">
          <InventoryPanel state={state} />
          <BuildingsPanel state={state} actions={actions} />
        </aside>

        <aside className="shell-area shell-area--right">
          <RightColumn state={state} />
        </aside>
      </div>

      <StonePanel state={state} />

      <footer className="shell-footer">
        {prestigeUnlocked && reward.eligible ? (
          <button className="btn btn-prestige" onClick={handleReset}>
            Channel the Rock{" "}
            <span className="btn-suffix">
              +{reward.echoes} Echo{reward.echoes !== 1 ? "es" : ""}
            </span>
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={handleReset}>
            Reset run
          </button>
        )}
      </footer>
    </div>
  );
}
