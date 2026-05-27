// Drink button with water-tier preference dropdown.
//
// Mirrors EatButton.jsx — main button drinks the preferred water (or
// best-available if no preference / preference not in inventory). A ▾
// chevron next to it opens a popover listing available water tiers and
// (when Boiling is researched + Fire Pit built) a "Boil water" utility
// item at the bottom that runs the boil action without leaving the menu.
//
// Preference lives in settings (so it persists across runs) — see
// state/settings.js drinkPreference.
//
// Water tier metadata (thirstRelief, dysenteryChance, etc.) lives on the
// resource defs in content/resources.js. The dropdown surfaces the
// dysentery risk as a small ⚠ chip so the player understands the trade.

import { useEffect, useRef, useState } from "react";
import {
  getResource,
  WATER_TIERS,
} from "../content/resources.js";

function pickBestAvailable(inventory) {
  for (let i = WATER_TIERS.length - 1; i >= 0; i--) {
    const id = WATER_TIERS[i];
    if ((inventory?.[id] || 0) > 0) return id;
  }
  return null;
}

export default function DrinkButton({
  state,
  actions,
  settings,
  settingsHook,
  drinkCheck,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const inv = state.run.inventory || {};

  // Tiers ordered worst→best. Show all known (= in WATER_TIERS) and let the
  // dropdown disable rows with 0 stock so the player still sees the ladder.
  const tiers = WATER_TIERS.map((id) => getResource(id)).filter(Boolean);
  const available = tiers.filter((t) => (inv[t.id] || 0) > 0);

  const preferredId = settings?.drinkPreference;
  const preferredAvailable = preferredId && (inv[preferredId] || 0) > 0;
  const fallbackId = pickBestAvailable(inv);
  const shownWater = preferredAvailable
    ? getResource(preferredId)
    : fallbackId
    ? getResource(fallbackId)
    : null;

  const icon = shownWater?.icon || "💧";

  // Click-outside / Escape closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const setPreference = (id) => {
    settingsHook.update({ drinkPreference: id });
    setOpen(false);
  };

  const keybinds = settings?.keybindings || {};
  const formatKey = (k) => (k ? k.toUpperCase() : "");

  // Boil action gating — exposed in the dropdown as a utility row when the
  // player has the prerequisites. Stays hidden otherwise to keep the menu
  // clean. Doesn't include the resource check (button disables instead).
  const canBoilBase =
    !!state.run.researched?.boiling && !!state.run.built?.firepit;
  const wood = inv.wood || 0;
  const muddy = inv.water_muddy || 0;
  const canBoilNow = canBoilBase && wood >= 1 && muddy >= 1;
  const boilReason = !canBoilBase
    ? null
    : wood < 1
    ? "Not enough wood."
    : muddy < 1
    ? "No muddy water."
    : null;

  const formatPct = (p) => `${Math.round(p * 100)}%`;

  return (
    <div className="drink-btn-wrap" ref={wrapRef}>
      <button
        className="btn btn-secondary drink-btn-main"
        onClick={() => actions.drink(preferredAvailable ? preferredId : null)}
        disabled={!drinkCheck.ok}
        title={
          drinkCheck.ok
            ? `Drink${shownWater ? ` (${shownWater.name})` : ""}${
                keybinds.drink ? ` · ${formatKey(keybinds.drink)}` : ""
              }`
            : drinkCheck.reason
        }
      >
        <span className="drink-btn-icon">{icon}</span>
        <span className="drink-btn-label">Drink</span>
        {keybinds.drink && (
          <span className="btn-hotkey">{formatKey(keybinds.drink)}</span>
        )}
      </button>
      <button
        type="button"
        className="btn btn-secondary drink-btn-chevron"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Choose what to drink first / boil water"
      >
        ▾
      </button>
      {open && (
        <div className="drink-btn-menu" role="menu">
          <div className="drink-btn-menu-header muted">Drink first:</div>
          <button
            type="button"
            role="menuitem"
            className={`drink-btn-menu-item ${!preferredId ? "is-active" : ""}`}
            onClick={() => setPreference(null)}
          >
            <span className="drink-btn-menu-icon">💧</span>
            <span className="drink-btn-menu-name">Auto (best available)</span>
            <span className="drink-btn-menu-meta muted">default</span>
          </button>
          {tiers.map((t) => {
            const have = inv[t.id] || 0;
            const disabled = have === 0;
            const dysChance = t.dysenteryChance || 0;
            return (
              <button
                key={t.id}
                type="button"
                role="menuitem"
                className={`drink-btn-menu-item ${
                  preferredId === t.id ? "is-active" : ""
                } ${disabled ? "is-empty" : ""}`}
                onClick={() => setPreference(t.id)}
              >
                <span className="drink-btn-menu-icon">{t.icon}</span>
                <span className="drink-btn-menu-name">{t.name}</span>
                <span className="drink-btn-menu-meta muted">
                  {have} · +{t.thirstRelief}💧
                  {dysChance > 0 && (
                    <span
                      className="drink-btn-risk"
                      title={`${formatPct(dysChance)} chance of dysentery`}
                    >
                      {" "}⚠ {formatPct(dysChance)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {canBoilBase && (
            <>
              <div className="drink-btn-menu-divider" />
              <div className="drink-btn-menu-header muted">Process:</div>
              <button
                type="button"
                role="menuitem"
                className="drink-btn-menu-item drink-btn-menu-utility"
                onClick={() => {
                  if (!canBoilNow) return;
                  actions.boilWater();
                  // Don't close — let the player boil several in a row.
                }}
                disabled={!canBoilNow}
                title={boilReason || "Boil 1 muddy + 1 wood → 1 boiled water"}
              >
                <span className="drink-btn-menu-icon">🫖</span>
                <span className="drink-btn-menu-name">Boil water</span>
                <span className="drink-btn-menu-meta muted">
                  1🪵 + 1💧 → 1🫖
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
