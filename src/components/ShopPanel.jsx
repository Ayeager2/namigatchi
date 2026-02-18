import React, { useMemo } from "react";
import { ITEMS } from "../tama/items";

export default function ShopPanel({ state, actions, addFloat }) {
  const inv = state.inventory || {};
  const cds = state.cooldowns || {};
  const t = Date.now();

  const rows = useMemo(() => ITEMS, []);

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>Shop</strong>
        <span style={{ fontSize: 12, opacity: 0.75 }}>Coins: {state.coins}</span>
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        {rows.map((item) => {
          const qty = inv[item.id] || 0;
          const last = cds[item.id] || 0;
          const cdLeft = item.cooldownMs ? Math.max(0, item.cooldownMs - (t - last)) : 0;
          const cdText = cdLeft > 0 ? `${Math.ceil(cdLeft / 1000)}s` : null;

          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                padding: 10,
                border: "1px solid #f0f0f0",
                borderRadius: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <strong>{item.name}</strong>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>({item.type})</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Cost: {item.cost} • In bag: {qty}
                  {cdText ? ` • Cooldown: ${cdText}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                className="fx-btn fx-btn--good"
                onClick={() => {
                  actions.buyItem(item.id);
                  addFloat(`-${item.cost} 💰  Bought ${item.name}`, { type: "neutral", x: 0.65, y: 0.15 });
                }}
                disabled={!state.alive || state.coins < item.cost}
              >
                Buy
              </button>

              <button
                className="fx-btn fx-btn--good"
                onClick={() => {
                  actions.useItem(item.id);

                  // quick “guess” effect based on item type (simple + fun)
                  if (item.type === "meal" || item.type === "snack") addFloat("-HUNGER", { type: "good", x: 0.55, y: 0.25 });
                  if (item.type === "toy") addFloat("+FUN", { type: "good", x: 0.55, y: 0.25 });
                  if (item.type === "vitamins") addFloat("+HEALTH", { type: "good", x: 0.55, y: 0.25 });
                  if (item.type === "soap") addFloat("+CLEAN", { type: "good", x: 0.55, y: 0.25 });
                }}
                disabled={!state.alive || qty <= 0 || cdLeft > 0}
              >
                Use
              </button>

              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Tip: Toys give fun + coins indirectly (keep them happy, avoid tantrums).
      </div>
    </div>
  );
}
