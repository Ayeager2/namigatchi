// Top-level layout. Header + Scene + active panel + footer.
// The footer's reset button is contextual:
//   - if the player has hit a prestige milestone -> "Channel the Rock (+N)"
//   - otherwise                                  -> "Reset run (no reward)"

import Scene from "./Scene.jsx";
import GatherPanel from "./GatherPanel.jsx";
import { getPrestigeReward } from "../systems/prestige.js";

export default function Shell({ state, actions }) {
  const reward = getPrestigeReward(state);

  const handleReset = () => {
    if (reward.eligible) {
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
        `You haven't reached a milestone yet, so no Echoes will be earned.`,
        `(Awaken the Stone to unlock your first prestige reward.)`,
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
          <span className="meta-item">Echoes: {state.persistent.echoes}</span>
        </div>
      </header>

      <Scene state={state} />

      <main className="shell-main">
        <GatherPanel state={state} actions={actions} />
      </main>

      <footer className="shell-footer">
        {reward.eligible ? (
          <button className="btn btn-prestige" onClick={handleReset}>
            Channel the Rock <span className="btn-suffix">+{reward.echoes} Echo{reward.echoes !== 1 ? "es" : ""}</span>
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={handleReset}>
            Reset run <span className="btn-suffix">no reward</span>
          </button>
        )}
      </footer>
    </div>
  );
}
