// Save / load infrastructure with versioned schema.
//
// IMPORTANT: persistent state must NEVER be lost on a save format change.
// Every schema bump needs a migration entry in `migrate()`.

import { PERSISTENT_DEFAULTS } from "./persistent.js";
import { RUN_DEFAULTS, freshRun } from "./run.js";

const STORAGE_KEY = "namigatchi-save";
const CURRENT_VERSION = 2;

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

  if (v < 2) {
    saved = migrate1to2(saved);
    v = 2;
  }

  // Merge with defaults to handle any new fields added since save.
  return {
    persistent: { ...PERSISTENT_DEFAULTS, ...(saved.persistent || {}) },
    run: { ...RUN_DEFAULTS, ...(saved.run || freshRun()) },
  };
}

// v1 → v2: Water resource splits into a tier ladder (water_stagnant,
// water_muddy, water_boiled). See ERA_PLAN.md "Water tiers + dysentery".
//
// Migration policy ("map by building" — chosen via AskUserQuestion 2026-05):
//   • If the player has built the Water Hole / Well, their existing `water`
//     becomes `water_muddy` (the Water Hole's product).
//   • Otherwise, their existing `water` becomes `water_stagnant` (the
//     puddle-tier they'd realistically have without the building).
//
// Lifetime stats (resourcesByType.water) also remaps so the inventory
// panel's history doesn't suddenly drop to zero.
function migrate1to2(saved) {
  const run = { ...(saved.run || {}) };
  const persistent = { ...(saved.persistent || {}) };

  const builtWell = !!(run.built && (run.built.well || run.built.water_hole));
  const targetTier = builtWell ? "water_muddy" : "water_stagnant";

  // run.inventory.water → targetTier
  if (run.inventory && typeof run.inventory.water === "number") {
    const inv = { ...run.inventory };
    const amt = inv.water || 0;
    delete inv.water;
    inv[targetTier] = (inv[targetTier] || 0) + amt;
    run.inventory = inv;
  }

  // run.gathered.water → targetTier
  if (run.gathered && typeof run.gathered.water === "number") {
    const g = { ...run.gathered };
    const amt = g.water || 0;
    delete g.water;
    g[targetTier] = (g[targetTier] || 0) + amt;
    run.gathered = g;
  }

  // Passive accumulators key on resource id — remap if "water" appears.
  if (run.passiveAccum && typeof run.passiveAccum.water === "number") {
    const pa = { ...run.passiveAccum };
    const amt = pa.water || 0;
    delete pa.water;
    pa[targetTier] = (pa[targetTier] || 0) + amt;
    run.passiveAccum = pa;
  }

  // Lifetime stats remap.
  if (persistent.lifetimeStats?.resourcesByType?.water != null) {
    const rbt = { ...persistent.lifetimeStats.resourcesByType };
    const amt = rbt.water || 0;
    delete rbt.water;
    rbt[targetTier] = (rbt[targetTier] || 0) + amt;
    persistent.lifetimeStats = {
      ...persistent.lifetimeStats,
      resourcesByType: rbt,
    };
  }

  return { ...saved, version: 2, run, persistent };
}
