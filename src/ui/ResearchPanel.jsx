// Research panel — "the rock whispers; you listen and learn."
// Renders nothing until the hut is built (research is gated).
// Each node shows the rock's whisper as italic body text — that's the
// teaching the player is paying to receive.

import { getResource } from "../content/resources.js";
import { canListen, getVisibleResearch } from "../systems/research.js";

export default function ResearchPanel({ state, actions }) {
  const { run } = state;
  const research = getVisibleResearch(state);

  if (research.length === 0) return null;

  return (
    <div className="card">
      <h3>The Stone's Teachings</h3>
      <p className="muted research-intro">
        Listen, and offer what the stone asks for.
      </p>
      <ul className="research-list">
        {research.map((r) => {
          const isLearned = !!run.researched?.[r.id];
          const check = canListen(state, r.id);
          return (
            <li
              key={r.id}
              className={`research-row ${isLearned ? "is-learned" : ""}`}
            >
              <div className="research-top">
                <span className="research-icon">{r.icon}</span>
                <span className="research-name">{r.name}</span>
                {isLearned && <span className="research-badge">Learned</span>}
              </div>
              <p className="research-whisper">"{r.whisper}"</p>
              {!isLearned && (
                <>
                  <div className="research-cost">
                    {Object.entries(r.cost).map(([res, qty]) => {
                      const have = run.inventory[res] || 0;
                      const enough = have >= qty;
                      const resDef = getResource(res);
                      return (
                        <span
                          key={res}
                          className={`cost-chip ${enough ? "" : "cost-chip--short"}`}
                        >
                          {resDef?.icon} {qty} ({have})
                        </span>
                      );
                    })}
                  </div>
                  <button
                    className="btn"
                    disabled={!check.ok}
                    onClick={() => actions.research(r.id)}
                    title={check.ok ? "" : check.reason}
                  >
                    Listen
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
