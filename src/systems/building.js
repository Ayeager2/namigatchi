// Building system. canBuild() reports eligibility; performBuild() does the work.
// Reducer dispatches BUILD; this file owns the actual logic.

import { getBuilding, getAllBuildings } from "../content/buildings.js";

// Returns { ok: bool, reason: string }.
// Reason is a short user-facing string (used to disable button + tooltip).
export function canBuild(state, buildingId) {
  const building = getBuilding(buildingId);
  if (!building) return { ok: false, reason: "Unknown building." };

  if (state.run.built?.[buildingId]) {
    return { ok: false, reason: "Already built." };
  }

  if (building.requires) {
    if (building.requires.rockAwakened && !state.run.rockAwakened) {
      return { ok: false, reason: "The stone must awaken first." };
    }
    if (
      building.requires.researched &&
      !state.run.researched?.[building.requires.researched]
    ) {
      return { ok: false, reason: "You haven't listened for this yet." };
    }
  }

  for (const [res, qty] of Object.entries(building.cost || {})) {
    if ((state.run.inventory[res] || 0) < qty) {
      return { ok: false, reason: "Not enough resources." };
    }
  }

  return { ok: true };
}

// Returns { run, persistent, events } where events is an array of log entries.
export function performBuild(state, buildingId) {
  const building = getBuilding(buildingId);
  if (!building) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "buildFail", message: "Unknown building." }],
    };
  }

  const check = canBuild(state, buildingId);
  if (!check.ok) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "buildFail", message: check.reason }],
    };
  }

  // Spend resources
  const inventory = { ...state.run.inventory };
  for (const [res, qty] of Object.entries(building.cost)) {
    inventory[res] = (inventory[res] || 0) - qty;
  }

  // Mark built
  const built = { ...(state.run.built || {}), [buildingId]: { at: Date.now() } };

  const run = { ...state.run, inventory, built };

  // Increment lifetime build counters.
  const persistent = {
    ...state.persistent,
    lifetimeStats: { ...state.persistent.lifetimeStats },
  };
  if (buildingId === "hut") {
    persistent.lifetimeStats.hutsBuilt =
      (persistent.lifetimeStats.hutsBuilt || 0) + 1;
  }
  if (buildingId === "firepit") {
    persistent.lifetimeStats.firepitsBuilt =
      (persistent.lifetimeStats.firepitsBuilt || 0) + 1;
  }

  const events = [{ kind: "build", message: building.onBuiltMessage }];
  if (building.whisperOnBuilt) {
    events.push({ kind: "whisper", message: building.whisperOnBuilt });
  }

  return {
    run,
    persistent,
    events,
  };
}

// Get a list of buildings the player should currently see in the UI.
// Filters by requirements; player only sees what's actually available to consider.
export function getVisibleBuildings(state) {
  return getAllBuildings().filter((b) => {
    // Always show what's already built (so player can see their accomplishments)
    if (state.run.built?.[b.id]) return true;
    // Hide if requirements aren't met yet.
    if (b.requires?.rockAwakened && !state.run.rockAwakened) return false;
    if (
      b.requires?.researched &&
      !state.run.researched?.[b.requires.researched]
    ) {
      return false;
    }
    return true;
  });
}

// Aggregated bonuses from all built buildings — applied in gathering, etc.
export function getBuildingBonuses(run) {
  let gatherBonus = 0;
  for (const id of Object.keys(run.built || {})) {
    const b = getBuilding(id);
    if (b?.effect?.gatherBonus) gatherBonus += b.effect.gatherBonus;
  }
  return { gatherBonus };
}
