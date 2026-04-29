// Buildings card. Lives in the left column on desktop, below Inventory.
// Renders nothing if no buildings are visible yet (pre-rock-awakening).
//
// Each row is COLLAPSED by default (icon + name + cost summary). Click to
// expand and see description, whisper, and the build button. Built buildings
// stay expanded with a "Built" badge so the player sees their progress.
//
// As the building list grows past ~7-8 entries, this should be promoted to
// its own modal (see TeachingsTreeModal as the pattern). Until then, the
// collapsed-rows pattern keeps the left column tight.

import { useState } from "react";
import { getResource } from "../content/resources.js";
import { canBuild, getVisibleBuildings } from "../systems/building.js";

export default function BuildingsPanel({ state, actions }) {
  const { run } = state;
  const buildings = getVisibleBuildings(state);
  const [expandedId, setExpandedId] = useState(null);

  if (buildings.length === 0) return null;

  return (
    <div className="card">
      <h3>Buildings</h3>
      <ul className="building-list">
        {buildings.map((b) => {
          const isBuilt = !!run.built?.[b.id];
          const check = canBuild(state, b.id);
          const isExpanded = expandedId === b.id || isBuilt;

          return (
            <li
              key={b.id}
              className={`building-row ${isBuilt ? "is-built" : ""} ${
                isExpanded ? "is-expanded" : ""
              }`}
            >
              <button
                className="building-summary"
                onClick={() =>
                  setExpandedId(isExpanded && !isBuilt ? null : b.id)
                }
                aria-expanded={isExpanded}
              >
                <span className="building-icon">{b.icon}</span>
                <span className="building-name">{b.name}</span>
                {isBuilt ? (
                  <span className="building-badge">Built</span>
                ) : (
                  <span className="building-summary-cost">
                    {Object.entries(b.cost).map(([res, qty], i) => {
                      const r = getResource(res);
                      return (
                        <span key={res} className="building-summary-cost-item">
                          {r?.icon}{qty}
                          {i < Object.keys(b.cost).length - 1 ? " " : ""}
                        </span>
                      );
                    })}
                  </span>
                )}
                {!isBuilt && (
                  <span className="building-chev" aria-hidden="true">
                    {isExpanded ? "▾" : "▸"}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="building-detail">
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
                              className={`cost-chip ${
                                enough ? "" : "cost-chip--short"
                              }`}
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
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
