// Gathering system. Pure function: takes state + rng, returns new state + event.
// Reducer dispatches GATHER; this file owns all the actual logic.
//
// The reducer is intentionally thin so all real game logic lives in systems/.

import { GATHER_TABLE, FRAGMENTS_TO_AWAKEN } from "../content/gatherTable.js";
import { RESOURCES } from "../content/resources.js";
import { pickWeighted, randInt } from "../util/rng.js";

// Pick the right loot table based on rock progress.
function pickTable(run) {
  if (!run.rockFound) return GATHER_TABLE.preRock;
  if (!run.rockAwakened) return GATHER_TABLE.postRockPreAwaken;
  return GATHER_TABLE.postAwaken;
}

// Returns: { run, persistent, event }
//   run        — new run state
//   persistent — new persistent state
//   event      — { kind, message } for the activity log
export function performGather(state, rng = Math.random) {
  // Build new state from immutable copies.
  const run = { ...state.run, inventory: { ...state.run.inventory } };
  const persistent = {
    ...state.persistent,
    lifetimeStats: { ...state.persistent.lifetimeStats },
  };

  const table = pickTable(run);
  const result = pickWeighted(rng, table);

  persistent.lifetimeStats.totalGathers += 1;

  let event = null;

  switch (result.kind) {
    case "nothing":
      event = {
        kind: "nothing",
        message: "You search and find nothing of value.",
      };
      break;

    case "resource": {
      const [lo, hi] = result.qty;
      const qty = randInt(rng, lo, hi);
      run.inventory[result.id] = (run.inventory[result.id] || 0) + qty;
      persistent.lifetimeStats.totalResourcesGathered += qty;
      const res = RESOURCES[result.id];
      event = {
        kind: "resource",
        message: `${res.icon} +${qty} ${res.name}`,
      };
      break;
    }

    case "rockFind":
      run.rockFound = true;
      persistent.lifetimeStats.rocksFound += 1;
      event = {
        kind: "rockFind",
        message: "Among the dust, a smooth stone — warm, somehow. You pocket it.",
      };
      break;

    default:
      event = { kind: "nothing", message: "Nothing happens." };
  }

  // Awakening check — uses the UPDATED run state.
  if (
    run.rockFound &&
    !run.rockAwakened &&
    run.inventory.fragments >= FRAGMENTS_TO_AWAKEN
  ) {
    run.rockAwakened = true;
    persistent.lifetimeStats.rocksAwakened += 1;
    event = {
      kind: "awaken",
      message: "The fragments bind to the stone, and the stone OPENS its eye.",
    };
  }

  return { run, persistent, event };
}
