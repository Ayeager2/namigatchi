// Inventory view (#65) — Inventory content rendered in the center column.
// Was previously the "Inventory" tab inside LeftColumn's lc-content.

import InventoryPanel from "./InventoryPanel.jsx";

export default function InventoryView({ state, settingsHook }) {
  return (
    <section className="action-panel action-panel--inventory">
      <div className="panel-header">
        <h2>Inventory</h2>
        <p className="muted">
          What you carry. Caps grow as you build storage.
        </p>
      </div>
      <InventoryPanel state={state} settingsHook={settingsHook} />
    </section>
  );
}
