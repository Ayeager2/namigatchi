// Tools / crafting modal. Lists known recipes plus already-owned tools.

import { useState, useMemo } from "react";
import { TOOLS, TOOL_CATEGORIES } from "../content/tools.js";
import { getResource } from "../content/resources.js";
import { canCraft, getVisibleTools } from "../systems/crafting.js";
import { getResearch } from "../content/research.js";
import { getSkillState } from "../systems/skills.js";

function getToolState(state, tool) {
  if ((state.run.inventory?.[tool.id] || 0) > 0) return "owned";
  const check = canCraft(state, tool.id);
  if (check.ok) return "available";
  if (check.reason === "Not enough materials.") return "available";
  return "locked";
}

function DurabilityBar({ current, max, wearsOn }) {
  const value = typeof current === "number" ? current : max;
  const percent = Math.max(0, Math.min(1, value / max));
  const wearLabel =
    wearsOn === "hunt"
      ? "hunts"
      : wearsOn === "waterGather"
      ? "water gathers"
      : "gathers";
  const tone = percent > 0.5 ? "" : percent > 0.2 ? "is-warn" : "is-danger";
  return (
    <div className={`tool-durability ${tone}`}>
      <div className="tool-durability-label">
        Durability: {value} / {max} {wearLabel}
      </div>
      <div className="tool-durability-bar">
        <div
          className="tool-durability-fill"
          style={{ width: `${percent * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ToolsModal({ state, actions, onClose }) {
  const visible = useMemo(() => getVisibleTools(state), [state]);
  const [selectedId, setSelectedId] = useState(null);

  const selected = selectedId ? TOOLS[selectedId] : null;
  const selectedState = selected ? getToolState(state, selected) : null;
  const selectedCheck = selected ? canCraft(state, selected.id) : null;
  const isOwned = selected
    ? (state.run.inventory?.[selected.id] || 0) > 0
    : false;

  const grouped = {};
  for (const t of visible) {
    const cat = t.category || "primitive";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }
  const groupOrder = Object.keys(grouped).sort(
    (a, b) =>
      (TOOL_CATEGORIES[a]?.order ?? 50) - (TOOL_CATEGORIES[b]?.order ?? 50)
  );

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal modal--tools"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Crafts"
      >
        <header className="modal-header">
          <div>
            <h2>What You've Made</h2>
            <p className="muted modal-subtitle">
              Tools shaped by hand. The simpler ones first.
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal-body modal-body--tools">
          <div className="tools-list">
            {visible.length === 0 ? (
              <p className="muted">
                You haven't learned to make anything yet. Listen for it.
              </p>
            ) : (
              groupOrder.map((cat) => (
                <div key={cat} className="tools-group">
                  <h3 className="tools-group-name">
                    {TOOL_CATEGORIES[cat]?.name || cat}
                  </h3>
                  <ul className="tools-rows">
                    {grouped[cat].map((t) => {
                      const ts = getToolState(state, t);
                      const isSel = selectedId === t.id;
                      return (
                        <li
                          key={t.id}
                          className={`tool-row tool-row--${ts} ${
                            isSel ? "is-selected" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="tool-row-btn"
                            onClick={() => setSelectedId(t.id)}
                          >
                            <span className="tool-icon">{t.icon}</span>
                            <span className="tool-name">{t.name}</span>
                            {ts === "owned" && (
                              <span className="tool-tag tool-tag--owned">
                                {t.isStackable
                                  ? `×${state.run.inventory?.[t.id] || 0}`
                                  : "Crafted"}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <aside className="tree-detail">
            {!selected ? (
              <div className="tree-detail-empty">
                <p className="muted">
                  Select a tool to see what it costs and what it does.
                </p>
              </div>
            ) : (
              <div className="tree-detail-content">
                <div className="tree-detail-top">
                  <span className="tree-detail-icon">{selected.icon}</span>
                  <div>
                    <h3>{selected.name}</h3>
                    <div className="tree-detail-cat">
                      {TOOL_CATEGORIES[selected.category]?.name}
                    </div>
                  </div>
                </div>
                <p className="building-desc">{selected.description}</p>
                {selected.effectSummary && (
                  <p className="muted building-effect">
                    {selected.effectSummary}
                  </p>
                )}

                {selected.requires && (
                  <div className="tool-reqs muted">
                    {selected.requires.researched && (
                      <div>
                        Requires{" "}
                        <strong>
                          {getResearch(selected.requires.researched)?.name ||
                            selected.requires.researched}
                        </strong>
                      </div>
                    )}
                    {selected.requires.skill &&
                      Object.entries(selected.requires.skill).map(
                        ([sk, lvl]) => {
                          const cur = getSkillState(state.run, sk).level;
                          const enough = cur >= lvl;
                          return (
                            <div
                              key={sk}
                              className={enough ? "" : "tool-req--short"}
                            >
                              Requires {sk} lvl {lvl} (you: {cur})
                            </div>
                          );
                        }
                      )}
                  </div>
                )}

                {isOwned && !selected.isStackable ? (
                  <div className="tree-detail-learned">
                    Crafted. Effects active.
                    {selected.durability && (
                      <DurabilityBar
                        current={state.run.toolDurability?.[selected.id]}
                        max={selected.durability.max}
                        wearsOn={selected.durability.wearsOn}
                      />
                    )}
                  </div>
                ) : (
                  <>
                    {selected.isStackable && isOwned && (
                      <div className="tree-detail-learned">
                        You have ×{state.run.inventory?.[selected.id] || 0}.
                      </div>
                    )}
                    <div className="research-cost">
                      {Object.entries(selected.cost || {}).map(
                        ([res, qty]) => {
                          const have = state.run.inventory[res] || 0;
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
                        }
                      )}
                    </div>
                    <div className="tool-action-row">
                      <button
                        className="btn btn-primary"
                        disabled={!selectedCheck?.ok}
                        onClick={() => actions.craft(selected.id)}
                      >
                        {selected.isStackable
                          ? `Brew ${selected.name}`
                          : `Craft ${selected.name}`}
                      </button>
                      {selected.consumable && isOwned && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => actions.useTool(selected.id)}
                          disabled={(state.run.inventory?.[selected.id] || 0) <= 0}
                        >
                          Use
                        </button>
                      )}
                    </div>
                    {!selectedCheck?.ok && (
                      <p className="muted tree-detail-reason">
                        {selectedCheck?.reason}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
