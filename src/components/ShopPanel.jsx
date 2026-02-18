import { useMemo, useState } from "react";
import { getItemById } from "../tama/items";
import "./ShopPanel.css";

// Try to support different item module shapes:
// - export const ITEMS = [...]
// - export function getAllItems() { return [...] }
import * as ItemsModule from "../tama/items";

function getAllItemsSafe() {
  if (typeof ItemsModule.getAllItems === "function") return ItemsModule.getAllItems();
  if (Array.isArray(ItemsModule.ITEMS)) return ItemsModule.ITEMS;
  if (Array.isArray(ItemsModule.items)) return ItemsModule.items;
  return []; // fallback
}

function fmtCooldown(msLeft) {
  const s = Math.max(0, Math.ceil(msLeft / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

export default function TamaShopPanel({ state, actions }) {
  const [tab, setTab] = useState("shop"); // "shop" | "inv"
  const [query, setQuery] = useState("");

  const allItems = useMemo(() => getAllItemsSafe(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) => {
      const name = (it.name ?? "").toLowerCase();
      const desc = (it.description ?? "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [allItems, query]);

  const invEntries = useMemo(() => {
    const inv = state.inventory || {};
    return Object.entries(inv)
      .map(([id, qty]) => {
        const item = getItemById(id);
        return item ? { item, qty } : null;
      })
      .filter(Boolean);
  }, [state.inventory]);

  const nowTs = Date.now();

  function canUse(item) {
    const cd = state.cooldowns || {};
    const last = cd[item.id] || 0;
    if (!item.cooldownMs) return { ok: true, leftMs: 0 };
    const left = item.cooldownMs - (nowTs - last);
    return { ok: left <= 0, leftMs: left };
  }

  return (
    <div className="tamaShop">
      <div className="tamaShop__top">
        <div className="tamaShop__header">
          <div className="tamaShop__title">Shop</div>
          <div className="tamaShop__coins">💰 {state.coins ?? 0}</div>
        </div>

        <div className="tamaShop__tabs">
          <button
            className={`tamaShop__tabBtn ${tab === "shop" ? "tamaShop__tabBtn--active" : ""}`}
            onClick={() => setTab("shop")}
          >
            Store
          </button>
          <button
            className={`tamaShop__tabBtn ${tab === "inv" ? "tamaShop__tabBtn--active" : ""}`}
            onClick={() => setTab("inv")}
          >
            Inventory ({invEntries.length})
          </button>
        </div>

        {tab === "shop" && (
          <div className="tamaShop__searchWrap">
            <input
              className="tamaShop__search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
            />
          </div>
        )}
      </div>

      <div className="tamaShop__body">
        {tab === "shop" && (
          <div className="tamaShop__grid">
            {filtered.length === 0 && <div className="tamaShop__empty">No items found.</div>}

            {filtered.map((item) => {
              const affordable = (state.coins ?? 0) >= (item.cost ?? 0);

              return (
                <div key={item.id} className="tamaShopCard">
                  <div className="tamaShopCard__top">
                    <div className="tamaShopCard__name">
                      {item.icon ? `${item.icon} ` : ""}
                      {item.name}
                    </div>
                    <div className="tamaShopCard__meta">💰 {item.cost ?? 0}</div>
                  </div>

                  {item.description && <div className="tamaShopCard__desc">{item.description}</div>}

                  <EffectsChips effects={item.effects} />

                  <div className="tamaShopCard__actions">
                    <button
                      className="tamaShopBtn"
                      disabled={!affordable}
                      onClick={() => actions.buyItem(item.id)}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "inv" && (
          <div className="tamaShop__list">
            {invEntries.length === 0 && (
              <div className="tamaShop__empty">Inventory is empty. Buy something!</div>
            )}

            {invEntries.map(({ item, qty }) => {
              const cd = canUse(item);
              const disabled = !cd.ok;
              return (
                <div key={item.id} className="tamaShopCard">
                  <div className="tamaShopCard__top">
                    <div className="tamaShopCard__name">
                      {item.icon ? `${item.icon} ` : ""}
                      {item.name}
                      <span className="tamaShopCard__qty">x{qty}</span>
                    </div>
                    <div className="tamaShopCard__cooldown">
                      {item.cooldownMs ? (disabled ? `⏳ ${fmtCooldown(cd.leftMs)}` : "✅ Ready") : "✅ Ready"}
                    </div>
                  </div>

                  {item.description && <div className="tamaShopCard__desc">{item.description}</div>}

                  <EffectsChips effects={item.effects} />

                  <div className="tamaShopCard__actions">
                    <button
                      className="tamaShopBtn"
                      disabled={disabled}
                      onClick={() => actions.useItem(item.id)}
                    >
                      Use
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

}

function EffectsChips({ effects }) {
  const chips = useMemo(() => {
    if (!effects) return [];
    const out = [];

    for (const [k, v] of Object.entries(effects)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "number" && Math.abs(v) < 0.001) continue;

      if (k === "poopClear" && v) out.push({ label: "💩 Clear", type: "good" });
      else if (k === "sickCureChance" && typeof v === "number")
        out.push({ label: `🤒 Cure ${Math.round(v * 100)}%`, type: "good" });
      else if (typeof v === "number") {
        const sign = v > 0 ? "+" : "";
        out.push({ label: `${sign}${v} ${k}`, type: v > 0 ? "good" : "bad" });
      } else if (typeof v === "boolean" && v) {
        out.push({ label: k, type: "neutral" });
      }
    }

    return out.slice(0, 6);
  }, [effects]);

  if (chips.length === 0) return <div className="tamaShopCard__desc">No effects</div>;

  return (
    <div className="tamaShopChips">
      {chips.map((c, i) => (
        <span
          key={i}
          className={
            "tamaShopChip " +
            (c.type === "good"
              ? "tamaShopChip--good"
              : c.type === "bad"
              ? "tamaShopChip--bad"
              : "tamaShopChip--neutral")
          }
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

