// Inventory card. Lives in the left column on desktop.
// Shows only resources you have (qty > 0), in resource definition order.

import { getResource } from "../content/resources.js";

export default function InventoryPanel({ state }) {
  const { run } = state;

  const items = Object.entries(run.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const res = getResource(id);
      return res ? { ...res, qty } : null;
    })
    .filter(Boolean);

  return (
    <div className="card">
      <h3>Inventory</h3>
      {items.length === 0 ? (
        <p className="muted">Empty.</p>
      ) : (
        <ul className="inventory-list">
          {items.map((item) => (
            <li key={item.id}>
              <span className="icon">{item.icon}</span>
              <span className="name">{item.name}</span>
              <span className="qty">{item.qty}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
