// RUN state — wipes on prestige (and on RESET_RUN).
// Everything that's "this current playthrough" lives here.
// Add freely; it gets reset every run anyway.

export const RUN_DEFAULTS = {
  startedAt: 0,    // ms timestamp when this run began
  era: 0,          // 0 = Scavenger; advances as the run progresses

  // Resources gathered this run.
  inventory: {
    wood: 0,
    stone: 0,
    water: 0,
    fragments: 0,
  },

  // Era 0 milestones
  rockFound: false,
  rockAwakened: false,

  // Recent in-run events (latest first, capped).
  log: [],
};

export function freshRun() {
  return {
    ...structuredClone(RUN_DEFAULTS),
    startedAt: Date.now(),
  };
}
