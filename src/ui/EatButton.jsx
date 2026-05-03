// Eat button with food-preference dropdown.
//
// The main button click eats the preferred food (or default lowest-tier
// when nothing is set / preferred isn't in inventory). A small ▾ chevron
// next to it opens a popover listing available foods to set as preference.
//
// Preference lives in settings (so it persists across runs) — see
// state/settings.js eatPreference.

import { useEffect, useRef, useState } from "react";
import {
  getResourcesByCategory,
  getResource,
} from "../content/resources.js";

export default function EatButton({ state, actions, settings, settingsHook, eatCheck }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const inv = state.run.inventory || {};
  const allFoods = getResourcesByCategory("food");
  const available = allFoods.filter((f) => (inv[f.id] || 0) > 0);

  // Resolve current preference. If preferred is set but not in inventory,
  // fall back to the lowest-tier available food for the icon (so the icon
  // reflects what would actually be eaten).
  const preferredId = settings?.eatPreference;
  const preferredAvailable = preferredId && (inv[preferredId] || 0) > 0;
  const fallback = [...available].sort((a, b) => (a.nutrition || 0) - (b.nutrition || 0))[0] || null;
  const shownFood = preferredAvailable
    ? getResource(preferredId)
    : fallback;

  const icon = shownFood?.icon || "🌿";

  // Click outside / Escape closes the dropdown.
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
    settingsHook.update({ eatPreference: id });
    setOpen(false);
  };

  const keybinds = settings?.keybindings || {};
  const formatKey = (k) => (k ? k.toUpperCase() : "");

  return (
    <div className="eat-btn-wrap" ref={wrapRef}>
      <button
        className="btn btn-secondary eat-btn-main"
        onClick={() => actions.eat(settings?.eatPreference || null)}
        disabled={!eatCheck.ok}
        title={
          eatCheck.ok
            ? `Eat${shownFood ? ` (${shownFood.name})` : ""}${
                keybinds.eat ? ` · ${formatKey(keybinds.eat)}` : ""
              }`
            : eatCheck.reason
        }
      >
        <span className="eat-btn-icon">{icon}</span>
        <span className="eat-btn-label">Eat</span>
        {keybinds.eat && <span className="btn-hotkey">{formatKey(keybinds.eat)}</span>}
      </button>
      <button
        type="button"
        className="btn btn-secondary eat-btn-chevron"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Choose what to eat first"
        disabled={available.length === 0}
      >
        ▾
      </button>
      {open && (
        <div className="eat-btn-menu" role="menu">
          <div className="eat-btn-menu-header muted">Eat first:</div>
          <button
            type="button"
            role="menuitem"
            className={`eat-btn-menu-item ${!preferredId ? "is-active" : ""}`}
            onClick={() => setPreference(null)}
          >
            <span className="eat-btn-menu-icon">🌿</span>
            <span className="eat-btn-menu-name">Auto (lowest first)</span>
            <span className="eat-btn-menu-meta muted">default</span>
          </button>
          {available.map((f) => (
            <button
              key={f.id}
              type="button"
              role="menuitem"
              className={`eat-btn-menu-item ${preferredId === f.id ? "is-active" : ""}`}
              onClick={() => setPreference(f.id)}
            >
              <span className="eat-btn-menu-icon">{f.icon}</span>
              <span className="eat-btn-menu-name">{f.name}</span>
              <span className="eat-btn-menu-meta muted">
                {inv[f.id]} · {f.nutrition} nutr
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
