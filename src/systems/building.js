// Building system. canBuild() reports eligibility; performBuild() does the work.
// Reducer dispatches BUILD; this file owns the actual logic.

import { getBuilding, getAllBuildings } from "../content/buildings.js";
import {
  decayForAction,
  initialStats,
  survivalActive,
} from "./survival.js";

// Returns { ok: bool, reason: string }.
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

// Returns { run, persistent, events }.
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

  let run = { ...state.run, inventory, built };

  // Lifetime build counters.
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

  // Special activation: building the hut activates survival mechanics.
  // Initialize stats here (they default to a "fresh" state but we want the
  // documented startValues to take effect at activation).
  if (buildingId === "hut") {
    run.stats = initialStats();
    events.push({
      kind: "whisper",
      message:
        "The stone whispers: you have a body. Hunger. Thirst. The slow press of weariness. Care for yourself, that you may care for the world.",
    });
  }

  // Survival decay for performing the build action itself.
  if (survivalActive({ ...state, run })) {
    run = { ...run, stats: decayForAction(run.stats || {}, "Build") };
  }

  return { run, persistent, events };
}

export function getVisibleBuildings(state) {
  return getAllBuildings().filter((b) => {
    if (state.run.built?.[b.id]) return true;
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

export function getBuildingBonuses(run) {
  let gatherBonus = 0;
  for (const id of Object.keys(run.built || {})) {
    const b = getBuilding(id);
    if (b?.effect?.gatherBonus) gatherBonus += b.effect.gatherBonus;
  }
  return { gatherBonus };
}
