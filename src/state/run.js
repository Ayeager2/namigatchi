// RUN state — wipes on prestige (and on RESET_RUN).
// Everything that's "this current playthrough" lives here.
// Add freely; it gets reset every run anyway.

export const RUN_DEFAULTS = {
  startedAt: 0,    // ms timestamp when this run began
  era: 0,          // 0 = Scavenger; advances as the run progresses

  // Resources currently held (spendable).
  inventory: {
    wood: 0,
    stone: 0,
    water: 0,
    fragments: 0,
  },

  // Resources EVER gathered this run (never decreases). Distinct from inventory
  // because spending resources reduces inventory but not gathered totals.
  // This is what stats compare across runs.
  gathered: {
    wood: 0,
    stone: 0,
    water: 0,
    fragments: 0,
  },

  // Total gather actions taken this run.
  gatherCount: 0,

  // Era 0 milestones
  rockFound: false,
  rockAwakened: false,

  // Buildings constructed this run. Shape: { buildingId: { at: ms } }.
  built: {},

  // Splash screen flag. Plays the opening sequence on each fresh run.
  splashSeen: false,

  // Recent in-run events (latest first, capped).
  log: [],
};

export function freshRun() {
  return {
    ...structuredClone(RUN_DEFAULTS),
    startedAt: Date.now(),
  };
}
