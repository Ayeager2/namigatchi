// Buildings card. Lives in the left column on desktop, below Inventory.
// Renders nothing if no buildings are visible yet (pre-rock-awakening).

import { getResource } from "../content/resources.js";
import { canBuild, getVisibleBuildings } from "../systems/building.js";

export default function BuildingsPanel({ state, actions }) {
  const { run } = state;
  const buildings = getVisibleBuildings(state);

  if (buildings.length === 0) return null;

  return (
    <div className="card">
      <h3>Buildings</h3>
      <ul className="building-list">
        {buildings.map((b) => {
          const isBuilt = !!run.built?.[b.id];
          const check = canBuild(state, b.id);
          return (
            <li key={b.id} className={`building-row ${isBuilt ? "is-built" : ""}`}>
              <div className="building-top">
                <span className="building-icon">{b.icon}</span>
                <span className="building-name">{b.name}</span>
                {isBuilt && <span className="building-badge">Built</span>}
              </div>
              <p className="building-desc">{b.description}</p>
              {!isBuilt && (
                <>
                  <div className="building-cost">
                    {Object.entries(b.cost).map(([res, qty]) => {
                      const have = run.inventory[res] || 0;
                      const enough = have >= qty;
                      const r = getResource(res);
                      return (
                        <span
                          key={res}
                          className={`cost-chip ${enough ? "" : "cost-chip--short"}`}
                        >
                          {r?.icon} {qty} ({have})
                        </span>
                      );
                    })}
                  </div>
                  <button
                    className="btn"
                    disabled={!check.ok}
                    onClick={() => actions.build(b.id)}
                    title={check.ok ? "" : check.reason}
                  >
                    Build {b.name}
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
