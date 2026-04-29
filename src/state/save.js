// Save / load infrastructure with versioned schema.
//
// IMPORTANT: persistent state must NEVER be lost on a save format change.
// Every schema bump needs a migration entry in `migrate()`.

import { PERSISTENT_DEFAULTS } from "./persistent.js";
import { RUN_DEFAULTS, freshRun } from "./run.js";

const STORAGE_KEY = "namigatchi-save";
const CURRENT_VERSION = 1;

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    console.warn("[save] failed to load:", e);
    return null;
  }
}

export function saveGame(state) {
  try {
    const out = {
      version: CURRENT_VERSION,
      persistent: state.persistent,
      run: state.run,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch (e) {
    console.warn("[save] failed to save:", e);
  }
}

export function freshGame() {
  return {
    persistent: structuredClone(PERSISTENT_DEFAULTS),
    run: freshRun(),
  };
}

// Convert any older save shape into the current shape.
// Future migrations: each step bumps `v` to the next version.
function migrate(saved) {
  let v = saved.version || 0;

  // Example pattern (uncomment and implement when you bump):
  // if (v === 1) { saved = migrate1to2(saved); v = 2; }

  // Merge with defaults to handle any new fields added since save.
  return {
    persistent: { ...PERSISTENT_DEFAULTS, ...(saved.persistent || {}) },
    run: { ...RUN_DEFAULTS, ...(saved.run || freshRun()) },
  };
}
