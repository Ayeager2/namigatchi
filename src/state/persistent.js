// PERSISTENT state — survives prestige, runs, save migrations, forever.
// Treat as sacred. Anything in here is a long-term commitment.
//
// Adding a field is fine (defaults will fill in for old saves).
// Renaming or removing a field requires a save migration in save.js.

export const PERSISTENT_DEFAULTS = {
  schemaVersion: 1,

  // Layer 1 prestige currency. Earned at end of run.
  echoes: 0,

  // Permanent upgrades purchased with Echoes. Shape: { upgradeId: level }.
  echoUpgrades: {},

  // Automation tier unlocks. Shape: { automationId: true }.
  automationUnlocks: {},

  // Story milestones unlocked across all runs.
  // Shape: { milestoneId: <runNumber when first unlocked> }.
  storyMilestones: {},

  // Across-runs stats — for achievements, lifetime feel, debug info.
  // Resources are broken out by type so we can show "lifetime wood" etc.
  lifetimeStats: {
    totalGathers: 0,
    totalResourcesGathered: 0,
    resourcesByType: { wood: 0, stone: 0, water: 0, fragments: 0 },
    rocksFound: 0,
    rocksAwakened: 0,
    hutsBuilt: 0,
    runsStarted: 0,
    runsCompleted: 0,
    msPlayedTotal: 0,
    bestEraReached: 0,
    fastestAwakeningMs: null, // ms from run start to rock awakening
    fastestHutMs: null,       // ms from run start to hut built
  },

  // History of past runs (most recent first, capped). Each entry is a snapshot
  // taken when a run ends (either reset or prestige). Drives the "compare to
  // last run" UI and longer-term retrospective views.
  runHistory: [],
};

// How many run snapshots to keep in history. Older ones get dropped.
export const RUN_HISTORY_CAP = 50;
