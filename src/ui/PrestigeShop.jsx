// Prestige Shop — spend Echoes on permanent upgrades.
//
// Accessible from the header Echo badge and from the prestige modal. Each
// upgrade has a current level / max level / next cost. Clicking Buy spends
// Echoes from persistent state and applies on the NEXT fresh run.

import { useEffect, useMemo } from "react";
import {
  ECHO_CATEGORIES,
  getAllEchoUpgrades,
} from "../content/echoes.js";
import { getShopRows, canBuyEchoUpgrade } from "../systems/echoes.js";

export default function PrestigeShop({ state, actions, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = useMemo(() => getShopRows(state.persistent), [state.persistent]);

  // Group rows by category, sort by ECHO_CATEGORIES.order.
  const grouped = {};
  for (const r of rows) {
    const cat = r.upgrade.category || "cache";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  }
  const groupOrder = Object.keys(grouped).sort(
    (a, b) =>
      (ECHO_CATEGORIES[a]?.order ?? 99) - (ECHO_CATEGORIES[b]?.order ?? 99)
  );

  const echoes = state.persistent.echoes || 0;
  const ownedCount = rows.filter((r) => r.level > 0).length;
  const totalUpgrades = getAllEchoUpgrades().length;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal modal--echo-shop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Prestige shop"
      >
        <header className="modal-header echo-shop-header">
          <div>
            <h2>🌀 Echo Shop</h2>
            <p className="muted modal-subtitle">
              {echoes} Echo{echoes !== 1 ? "es" : ""} on hand · {ownedCount} /{" "}
              {totalUpgrades} upgrades purchased
            </p>
            <p className="muted echo-shop-help">
              Purchases apply at the start of each new run. They survive every
              prestige.
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </header>

        <div className="modal-body echo-shop-body">
          {groupOrder.map((catId) => {
            const cat = ECHO_CATEGORIES[catId] || { name: catId };
            return (
              <div key={catId} className="echo-group">
                <h3 className="echo-group-name">{cat.name}</h3>
                <ul className="echo-list">
                  {grouped[catId].map((row) => (
                    <EchoRow
                      key={row.upgrade.id}
                      row={row}
                      state={state}
                      onBuy={() => actions.buyEchoUpgrade(row.upgrade.id)}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EchoRow({ row, state, onBuy }) {
  const { upgrade, level, maxLevel, maxed, cost, affordable } = row;
  const check = canBuyEchoUpgrade(state.persistent, upgrade.id);
  const status = maxed
    ? "is-maxed"
    : affordable
    ? "is-affordable"
    : "is-locked";

  return (
    <li className={`echo-row ${status}`}>
      <div className="echo-row-head">
        <span className="echo-row-icon" aria-hidden="true">
          {upgrade.icon}
        </span>
        <span className="echo-row-name">{upgrade.name}</span>
        <span className="echo-row-level">
          {maxLevel > 1 ? `Lvl ${level} / ${maxLevel}` : level > 0 ? "✓" : ""}
        </span>
        <button
          className="btn btn-primary btn-sm echo-row-buy"
          onClick={onBuy}
          disabled={!check.ok}
          title={check.ok ? `Buy for ${cost} Echo${cost !== 1 ? "es" : ""}` : check.reason}
        >
          {maxed ? "Maxed" : `Buy · ${cost}`}
        </button>
      </div>
      <p className="echo-row-desc muted">{upgrade.description}</p>
    </li>
  );
}
