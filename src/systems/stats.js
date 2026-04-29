// Stats system — observability for runs.
// snapshotRun()  takes a run's worth of state and produces a record.
// updateLifetime() merges a snapshot into persistent lifetimeStats.
// compareRuns()  produces deltas between two snapshots for "better/worse" UI.
//
// Snapshots are pure: same inputs → same output. The reducer takes a snapshot
// at run end and stores it; this file owns the format and the comparison logic.

import { computeEra } from "./era.js";
import { getPrestigeReward } from "./prestige.js";
import { RUN_HISTORY_CAP } from "../state/persistent.js";

// Build a snapshot of a run that is about to end.
//   ending: "reset" | "prestige"
export function snapshotRun(state, ending) {
  const { run, persistent } = state;
  const endedAt = Date.now();
  const reward = ending === "prestige" ? getPrestigeReward(state) : { echoes: 0 };

  return {
    runIndex: persistent.lifetimeStats.runsStarted + 1, // this run's number
    startedAt: run.startedAt || endedAt,
    endedAt,
    durationMs: Math.max(0, endedAt - (run.startedAt || endedAt)),
    eraReached: computeEra(state),
    rockFound: !!run.rockFound,
    rockAwakened: !!run.rockAwakened,
    buildingsBuilt: Object.keys(run.built || {}),
    resourcesGathered: { ...(run.gathered || {}) },
    gatherCount: run.gatherCount || 0,
    echoesEarned: reward.echoes,
    ending,
  };
}

// Merge a single snapshot into the lifetimeStats object. Returns a new
// lifetimeStats object (immutable update).
export function updateLifetime(lifetimeStats, snapshot) {
  const next = {
    ...lifetimeStats,
    msPlayedTotal: lifetimeStats.msPlayedTotal + snapshot.durationMs,
    bestEraReached: Math.max(lifetimeStats.bestEraReached, snapshot.eraReached),
  };

  // Fastest awakening — only update if rock was awakened this run.
  if (snapshot.rockAwakened) {
    if (
      lifetimeStats.fastestAwakeningMs == null ||
      snapshot.durationMs < lifetimeStats.fastestAwakeningMs
    ) {
      next.fastestAwakeningMs = snapshot.durationMs;
    }
  }

  // Fastest hut — only update if hut was built this run.
  if (snapshot.buildingsBuilt.includes("hut")) {
    if (
      lifetimeStats.fastestHutMs == null ||
      snapshot.durationMs < lifetimeStats.fastestHutMs
    ) {
      next.fastestHutMs = snapshot.durationMs;
    }
  }

  return next;
}

// Push a snapshot onto the run history, dropping the oldest if over cap.
export function appendRunHistory(history, snapshot) {
  return [snapshot, ...history].slice(0, RUN_HISTORY_CAP);
}

// Compute a "delta" comparison between two snapshots. Used for "better/worse"
// UI on the most recent run vs the run before it.
//   current:  snapshot of the run we just finished
//   previous: snapshot of the run before that (or null if no prior run)
//
// Returns { available: bool, deltas: { duration, era, resources, echoes } }
// Each delta has a sign (+/0/-) and a magnitude.
export function compareRuns(current, previous) {
  if (!previous) return { available: false, deltas: {} };

  const sumResources = (r) =>
    Object.values(r || {}).reduce((s, v) => s + v, 0);

  return {
    available: true,
    deltas: {
      durationMs: current.durationMs - previous.durationMs,
      eraReached: current.eraReached - previous.eraReached,
      resourcesTotal: sumResources(current.resourcesGathered) -
        sumResources(previous.resourcesGathered),
      echoesEarned: current.echoesEarned - previous.echoesEarned,
    },
  };
}

// Convenience: format a duration in ms as a human-readable string.
export function formatDuration(ms) {
  if (ms == null || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Whether the stats UI should be visible to the player.
// Currently gated by "first prestige completed."
export function isStatsUnlocked(state) {
  return (state.persistent.lifetimeStats.runsCompleted || 0) >= 1;
}
