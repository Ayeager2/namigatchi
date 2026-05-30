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
  lifetimeStats: {
    totalGathers: 0,
    totalResourcesGathered: 0,
    resourcesByType: {
      wood: 0, stone: 0, fragments: 0,
      water_stagnant: 0, water_muddy: 0, water_boiled: 0,
    },
    rocksFound: 0,
    rocksAwakened: 0,
    hutsBuilt: 0,
    runsStarted: 0,
    runsCompleted: 0,
    msPlayedTotal: 0,
    bestEraReached: 0,
    fastestAwakeningMs: null,
    fastestHutMs: null,
    threatsEncountered: 0,
    eventsTriggered: 0,
  },

  runHistory: [],
  unlockedMusic: {},
  altarEtchings: {},
  permanentlyKnown: {},

  // Bosses defeated across all lives (#40). Each entry records first defeat.
  // Shape: { bossId: { defeatedAt: ms } }. First defeat awards firstDefeatLog
  // + altar etching once; subsequent defeats still drop loot.
  bossesDefeated: {},
};

export const RUN_HISTORY_CAP = 50;
