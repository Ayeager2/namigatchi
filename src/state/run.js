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

  // Timestamp of last successful gather. Drives the gather cooldown so the
  // player can't spam-click (or hold a key) to bypass the harshness of the
  // wasteland. Cooldown duration shrinks as buildings/research progress.
  lastGatheredAt: 0,

  // Era 0 milestones
  rockFound: false,
  rockAwakened: false,
  rockAwakenedAt: 0, // ms timestamp; drives the awakening-flash animation

  // Buildings constructed this run. Shape: { buildingId: { at: ms } }.
  built: {},

  // Research learned this run ("listened to"). Resets on prestige —
  // each awakening, the rock teaches you anew.
  // Shape: { researchId: { at: ms } }.
  researched: {},

  // Survival stats — only meaningful once the hut is built.
  // See systems/survival.js for decay rates and penalty thresholds.
  // When the hut goes up, these are overwritten with SURVIVAL.startValues.
  stats: {
    hunger: 0,
    thirst: 0,
    energy: 100,
    hp: 100,
    happiness: 50,
    sanity: 50,
  },

  // Splash screen flag. Plays the opening sequence on each fresh run.
  splashSeen: false,

  // Random events tracking. Cooldowns per event id, last interval roll timestamp,
  // currently active choice event (if any).
  events: {
    cooldowns: {},
    lastIntervalMs: 0,
  },
  activeEvent: null,

  // Hidden alignment counters — accumulated through choice events. Never shown
  // directly to the player; surfaces through later consequences (NPC reactions,
  // available choices, late-game branching, etc.).
  alignment: {
    good: 0,
    evil: 0,
  },

  // Skills — the "learning by doing" axis. Per-skill XP and level. Run-local;
  // wipes on prestige. Shape: { skillId: { xp: number, level: number } }.
  // Defaults to {} (empty); systems/skills.js fills in entries lazily as XP
  // is earned. See content/skills.js for definitions.
  skills: {},

  // Tools (crafted items) discovered/created this run. Tools also live in
  // inventory under category "tool"; this map exists for "have you ever
  // crafted X this run?" queries and for log display order. Shape:
  // { toolId: { craftedAt: ms, count: number } }.
  toolsCrafted: {},

  // Per-tool current durability. Set on craft to the tool's `durability.max`,
  // decremented on the corresponding action (gather/hunt/waterGather). When a
  // tool hits 0 durability, it's removed from inventory (broken) and its
  // entry here is dropped. Shape: { toolId: number }.
  toolDurability: {},

  // Timestamp of last hunt action. Drives the hunt cooldown the same way
  // lastGatheredAt drives the gather cooldown. Hunt cooldown is much longer
  // than gather (you suck at it) and shrinks as Hunting skill levels up.
  lastHuntAt: 0,

  // Recent in-run events (latest first, capped).
  log: [],
};

export function freshRun() {
  return {
    ...structuredClone(RUN_DEFAULTS),
    startedAt: Date.now(),
  };
}
