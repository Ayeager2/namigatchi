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
    spirit: 50,
  },
  splashSeen: false,
  events: { cooldowns: {}, lastIntervalMs: 0 },
  activeEvent: null,
  alignment: { good: 0, evil: 0 },

  skills: {},
  toolsCrafted: {},
  toolDurability: {},
  lastHuntAt: 0,

  // Passive production
  lastPassiveTickAt: 0,
  passiveAccum: {},

  // Pests
  activePests: {},

  // Spoilage
  lastSpoilTickAt: 0,
  spoilAccum: {},

  // Era milestones already seen this run.
  eraMilestonesSeen: {},

  // Per-spell cooldowns.
  spellCooldowns: {},

  // Active status effects from spells.
  statuses: {},

  log: [],
};

export function freshRun() {
  return {
    ...structuredClone(RUN_DEFAULTS),
    startedAt: Date.now(),
  };
}
