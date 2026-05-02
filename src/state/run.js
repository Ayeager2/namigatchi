// RUN state — wipes on prestige (and on RESET_RUN).

export const RUN_DEFAULTS = {
  startedAt: 0,
  era: 0,
  inventory: { wood: 0, stone: 0, water: 0, fragments: 0 },
  gathered: { wood: 0, stone: 0, water: 0, fragments: 0 },
  gatherCount: 0,
  lastGatheredAt: 0,
  rockFound: false,
  rockAwakened: false,
  rockAwakenedAt: 0,
  built: {},
  researched: {},
  stats: {
    hunger: 0, thirst: 0, energy: 100, hp: 100, happiness: 50, sanity: 50,
  },
  splashSeen: false,
  events: { cooldowns: {}, lastIntervalMs: 0 },
  activeEvent: null,
  alignment: { good: 0, evil: 0 },

  // Skills — per-skill XP and level. Run-local; wipes on prestige.
  skills: {},

  // Tools (crafted items) discovered/created this run.
  toolsCrafted: {},

  // Per-tool current durability. Set on craft; decremented on the
  // corresponding action. Tool removed from inventory at 0.
  toolDurability: {},

  // Hunt cooldown timestamp.
  lastHuntAt: 0,

  // Passive production. Buildings like Well/Garden produce over real time.
  // passiveAccum holds fractional carry-over per resource.
  lastPassiveTickAt: 0,
  passiveAccum: {},

  // Active pests / temporary world hazards.
  // Shape: { pestId: { until: <ms>, intensity?: number } }
  activePests: {},

  log: [],
};

export function freshRun() {
  return {
    ...structuredClone(RUN_DEFAULTS),
    startedAt: Date.now(),
  };
}
