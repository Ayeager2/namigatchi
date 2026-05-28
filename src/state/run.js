// RUN state — wipes on prestige (and on RESET_RUN).

export const RUN_DEFAULTS = {
  startedAt: 0,
  era: 0,
  inventory: {
    wood: 0, stone: 0, fragments: 0,
    // Water tier ladder — see content/resources.js WATER_TIERS.
    water_stagnant: 0, water_muddy: 0, water_boiled: 0,
  },
  gathered: {
    wood: 0, stone: 0, fragments: 0,
    water_stagnant: 0, water_muddy: 0, water_boiled: 0,
  },
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

  // ─── Arcane Studies (Tasks #27, #31) ────────────────────────────────
  // Multiple studies can be in-progress at once; only one accrues time.
  // See systems/studies.js for the full state shape + lifecycle.
  studyProgress: {},      // { [nodeId]: { startedAt, accumulatedMs } }
  activeStudyId: null,    // single active study (nullable)
  studiesCompleted: {},   // { [nodeId]: { completedAt } } — permanent
  lastStudyTickAt: 0,     // for offline-catchup elapsed math
  // Cached stat bumps from study `addsStat` effects (e.g. Wardweave +2 armor).
  // The same values can be recomputed via systems/studies.js
  // getStudyStatBonuses — this field exists so combat systems can read it
  // synchronously without iterating studies each frame.
  studyStatBonuses: {},
  // Stamped on every player-initiated reducer case. Drives the study
  // pause-on-action mechanic — clock only advances when
  // `now - lastActionAt > IDLE_THRESHOLD_MS` (default 5s).
  lastActionAt: 0,

  // Hidden world-restoration score. Contributed by Elemental + Sigilcraft
  // + Memory + Stoneword study completions and event helpfulness. Eroded
  // by Voidcall casts. See ERA_PLAN.md "Arcane Studies → World Score" and
  // Task #29 for the graduated effects table.
  worldScore: 0,

  log: [],
};

export function freshRun() {
  return {
    ...structuredClone(RUN_DEFAULTS),
    startedAt: Date.now(),
  };
}
