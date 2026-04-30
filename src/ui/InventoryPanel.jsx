// Inventory card with collapsible categories. Lives in the left column.
//
// Items are grouped by category (Materials / Food / Arcane / Tools / Mystic /
// Unknown). Each group has a caret that toggles open/closed; collapse state
// persists in user settings.
//
// Hidden resources (e.g., fragments before the player has researched what
// they are) display under "Unknown" with placeholder name and icon — see
// content/resources.js getDisplayResource() / isResourceHidden().

import {
  getResource,
  getDisplayResource,
  RESOURCE_CATEGORIES,
} from "../content/resources.js";

function groupItems(items) {
  // items: [{ id, qty, displayed: { name, icon, _displayCategory, ... } }]
  const groups = {};
  for (const it of items) {
    const cat = it.displayed._displayCategory || "materials";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(it);
  }
  // Return ordered by category.order
  return Object.keys(groups)
    .map((catId) => RESOURCE_CATEGORIES[catId] || { id: catId, name: catId, order: 50 })
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
    .map((cat) => ({ category: cat, items: groups[cat.id] }));
}

export default function InventoryPanel({ state, settingsHook }) {
  const { run } = state;
  const collapsedMap = settingsHook?.settings?.inventoryCollapsed || {};
  const toggle = settingsHook?.toggleInventoryCollapse || (() => {});

  // Build items list with display info baked in
  const items = Object.entries(run.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const res = getResource(id);
      if (!res) return null;
      const displayed = getDisplayResource(state, res);
      return { id, qty, displayed, real: res };
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
                    {items.map((item) => (
                      <li key={item.id}>
                        <span className="icon">{item.displayed.icon}</span>
                        <span className="name">{item.displayed.name}</span>
                        <span className="qty">{item.qty}</span>
                      </li>
                    ))}
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
