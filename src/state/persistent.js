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
    rocksFound: 0,
    rocksAwakened: 0,
    runsStarted: 0,
    runsCompleted: 0,
    msPlayedTotal: 0,
  },
};
