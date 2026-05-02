// Inventory card with collapsible categories. Lives in the left column.

import { useEffect, useState } from "react";
import {
  getInventoryItem,
  RESOURCE_CATEGORIES,
} from "../content/resources.js";
import { getCapStatus, spoilStatusFromDef } from "../systems/storage.js";

function groupItems(items) {
  const groups = {};
  for (const it of items) {
    const cat = it.displayed._displayCategory || "materials";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(it);
  }
  return Object.keys(groups)
    .map((catId) => RESOURCE_CATEGORIES[catId] || { id: catId, name: catId, order: 50 })
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
    .map((cat) => ({ category: cat, items: groups[cat.id] }));
}

// Slim spoilage countdown bar — bug #002. Renders only for foods with a
// spoilage def. Color shifts to deeper rot when at cap (multiplier active).
function SpoilBar({ resource, capStatus, accum }) {
  const status = spoilStatusFromDef(resource, capStatus, accum);
  if (!status.spoils) return null;
  const sec = Math.max(0, Math.round(status.secondsUntilNextLoss));
  const min = Math.floor(sec / 60);
  const remainStr =
    sec >= 60 ? `~${min} min` : `<1 min`;
  const tooltip = `${resource.name} is spoiling — about ${remainStr} until next loss${
    status.atCap ? " (rotting fast — storage is full)" : ""
  }.`;
  return (
    <div
      className={`spoil-bar ${status.atCap ? "spoil-bar--rotting" : ""}`}
      title={tooltip}
      aria-label={tooltip}
    >
      <div
        className="spoil-bar-fill"
        style={{ width: `${status.percent * 100}%` }}
      />
    </div>
  );
}

export default function InventoryPanel({ state, settingsHook }) {
  const { run } = state;
  const collapsedMap = settingsHook?.settings?.inventoryCollapsed || {};
  const toggle = settingsHook?.toggleInventoryCollapse || (() => {});

  // Re-render every 5s so the spoilage bar visibly creeps. Cheap; only
  // runs when the panel is mounted, no inner work outside React.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const items = Object.entries(run.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = getInventoryItem(state, id);
      if (!item) return null;
      const cap = item.kind === "resource" ? getCapStatus(state, id) : { status: "uncapped" };
      return { id, qty, displayed: item.displayed, real: item.raw, cap };
    })
    .filter(Boolean);

  const groups = groupItems(items);

  return (
    <div className="card">
      <h3>Inventory</h3>
      {groups.length === 0 ? (
        <p className="muted">Empty.</p>
      ) : (
        <div className="inv-groups">
          {groups.map(({ category, items }) => {
            const collapsed = !!collapsedMap[category.id];
            return (
              <div key={category.id} className="inv-group">
                <button
                  className="inv-group-header"
                  onClick={() => toggle(category.id)}
                  aria-expanded={!collapsed}
                >
                  <span className="inv-group-caret" aria-hidden="true">
                    {collapsed ? "▸" : "▾"}
                  </span>
                  <span className="inv-group-name">{category.name}</span>
                  <span className="inv-group-count">{items.length}</span>
                </button>
                {!collapsed && (
                  <ul className="inventory-list">
                    {items.map((item) => {
                      const capClass =
                        item.cap.status === "full"
                          ? "qty--full"
                          : item.cap.status === "warn"
                          ? "qty--warn"
                          : "";
                      const accum = run.spoilAccum?.[item.id] || 0;
                      return (
                        <li key={item.id}>
                          <span className="icon">{item.displayed.icon}</span>
                          <span className="name">{item.displayed.name}</span>
                          <span className={`qty ${capClass}`}>
                            {item.cap.status === "uncapped"
                              ? item.qty
                              : `${item.qty}/${item.cap.cap}`}
                          </span>
                          {item.kind === "resource" && (
                            <SpoilBar
                              resource={item.real}
                              capStatus={item.cap}
                              accum={accum}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
