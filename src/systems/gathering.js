// Gathering system. Pure function: takes state + rng, returns new state + events.
// Reducer dispatches GATHER; this file owns all the actual logic.
//
// The reducer is intentionally thin so all real game logic lives in systems/.

import { GATHER_TABLE, FRAGMENTS_TO_AWAKEN } from "../content/gatherTable.js";
import { RESOURCES } from "../content/resources.js";
import { getBuilding } from "../content/buildings.js";
import { getBuildingBonuses } from "./building.js";
import { pickWeighted, randInt } from "../util/rng.js";

// Pick the right loot table based on rock progress.
function pickTable(run) {
  if (!run.rockFound) return GATHER_TABLE.preRock;
  if (!run.rockAwakened) return GATHER_TABLE.postRockPreAwaken;
  return GATHER_TABLE.postAwaken;
}

// Returns: { run, persistent, events }
//   run        — new run state
//   persistent — new persistent state
//   events     — array of { kind, message } for the activity log
export function performGather(state, rng = Math.random) {
  // Build new state from immutable copies.
  const run = {
    ...state.run,
    inventory: { ...state.run.inventory },
    gathered: { ...(state.run.gathered || {}) },
    gatherCount: (state.run.gatherCount || 0) + 1,
  };
  const persistent = {
    ...state.persistent,
    lifetimeStats: {
      ...state.persistent.lifetimeStats,
      resourcesByType: { ...state.persistent.lifetimeStats.resourcesByType },
    },
  };

  const table = pickTable(run);
  const result = pickWeighted(rng, table);
  const bonuses = getBuildingBonuses(run);

  persistent.lifetimeStats.totalGathers += 1;

  const events = [];

  switch (result.kind) {
    case "nothing":
      events.push({
        kind: "nothing",
        message: "You search and find nothing of value.",
      });
      break;

    case "resource": {
      const [lo, hi] = result.qty;
      const baseQty = randInt(rng, lo, hi);
      const qty = baseQty + (bonuses.gatherBonus || 0);
      run.inventory[result.id] = (run.inventory[result.id] || 0) + qty;
      run.gathered[result.id] = (run.gathered[result.id] || 0) + qty;
      persistent.lifetimeStats.totalResourcesGathered += qty;
      persistent.lifetimeStats.resourcesByType[result.id] =
        (persistent.lifetimeStats.resourcesByType[result.id] || 0) + qty;
      const res = RESOURCES[result.id];
      events.push({
        kind: "resource",
        message: `${res.icon} +${qty} ${res.name}`,
      });
      break;
    }

    case "rockFind":
      run.rockFound = true;
      persistent.lifetimeStats.rocksFound += 1;
      events.push({
        kind: "rockFind",
        message: "Among the dust, a smooth stone — warm, somehow. You pocket it.",
      });
      break;

    default:
      events.push({ kind: "nothing", message: "Nothing happens." });
  }

  // Awakening check — uses the UPDATED run state.
  if (
    run.rockFound &&
    !run.rockAwakened &&
    run.inventory.fragments >= FRAGMENTS_TO_AWAKEN
  ) {
    run.rockAwakened = true;
    persistent.lifetimeStats.rocksAwakened += 1;
    events.push({
      kind: "awaken",
      message: "The fragments bind to the stone, and the stone OPENS its eye.",
    });
    // Rock whispers the next step (build a hut)
    const hut = getBuilding("hut");
    if (hut?.whisperOnAvailable) {
      events.push({ kind: "whisper", message: hut.whisperOnAvailable });
    }
  }

  return { run, persistent, events };
}
