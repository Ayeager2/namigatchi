// Arcane Studies content — seven path subtrees with crossover at depth.
//
// See ERA_PLAN.md "Arcane Studies → Magic paths" for the full design.
// Locked decisions (AskUserQuestion 2026-05):
//   - SEVEN paths total: Light, Bend, Elemental, Sigilcraft, Memory,
//     Stoneword, Voidcall.
//   - Path TOPOLOGY: mixed crossover — most nodes are path-specific, but
//     deep / apex nodes can require completion across multiple paths
//     (e.g. Wardweave needs Light + Sigilcraft).
//   - Voidcall is APEX-GATED — hidden until the player has gone deep into
//     the Bend path (alignment.evil >= 5).
//
// ─── Shape of a study node ─────────────────────────────────────────────
//
//   id                  — unique id, also the key in STUDIES
//   name, icon          — display
//   path                — "light" | "bend" | "elemental" | "sigilcraft" |
//                          "memory" | "stoneword" | "voidcall"
//   description         — human prose
//   whisper             — what the stone says when you start the lesson
//   onCompletedMessage  — log line on completion
//
//   durationMs          — total study time required (only ticks while
//                          activeStudyId === this.id AND
//                          now - run.lastActionAt > IDLE_THRESHOLD_MS)
//   cost                — resources consumed AT START (always scroll+ink,
//                          plus path-flavored extras). Never refunded.
//   requires            — gating:
//     • parents: [studyId, …]   — must be completed first
//     • alignment: { good, evil } — alignment-gated paths (Voidcall etc.)
//     • researched: id          — must have learned this teaching (legacy)
//     • era: N                  — minimum era required
//   effect              — what completing the study unlocks:
//     • unlocksSpell: id        — grants a spell (integrates with spells.js)
//     • unlocksEnchant: id      — grants a weapon enchant (Combat Phase 6)
//     • passive: { key: val }   — passive bonus while completed
//     • addsStat: { stat: val } — permanent stat boost
//
//   tier, col           — position in the path-tree layout (per path)
//
// Cross-path nodes specify path of their *visual home*; their parents from
// other paths still gate them. UI groups by the home path's tab.

// ─── Path definitions (per-completion deltas + flavor) ────────────────
//
// The completionDelta on each path drives the side-effects applied by
// performCompleteStudy (Task #31). All deltas are pure data — the engine
// reads this without knowing each path's specifics.

export const STUDY_PATHS = {
  light: {
    id: "light",
    name: "The Light Path",
    icon: "✨",
    flavor:
      "Mending, wards, blessings. The body answers; the threat slows; the heart finds its quiet. Each lesson learned: +3 Sanity, +1 toward who you'd want to be.",
    completionDelta: { sanity: 3, alignment: { good: 1 }, worldScore: 0 },
  },

  bend: {
    id: "bend",
    name: "The Bend Path",
    icon: "🌑",
    flavor:
      "Take. Drain. Curse. Dominate. The world's resolve as a thing that can be drawn into yours. Each lesson learned: -3 Sanity, +1 toward what you'd take from the world.",
    completionDelta: { sanity: -3, alignment: { evil: 1 }, worldScore: 0 },
  },

  elemental: {
    id: "elemental",
    name: "The Elemental Path",
    icon: "🌿",
    flavor:
      "Earth, water, growth, restoration. The dust that remembers being soil. Each lesson learned: +1 Sanity, +1 toward what the world remembers.",
    completionDelta: { sanity: 1, alignment: {}, worldScore: 1 },
  },

  sigilcraft: {
    id: "sigilcraft",
    name: "Sigilcraft",
    icon: "✒️",
    flavor:
      "Written magic. Runes inscribed in scroll and metal that hold their meaning beyond the speaking. Each lesson learned: +1 Sanity (focused craft), +0.5 toward the world's true names written down.",
    completionDelta: { sanity: 1, alignment: {}, worldScore: 0.5 },
  },

  memory: {
    id: "memory",
    name: "The Path of Memory",
    icon: "🔔",
    flavor:
      "Recall what was lost. Restore what was broken. Read the past of what stands against you. Each lesson learned: +2 Sanity (catharsis), +0.5 world score.",
    completionDelta: { sanity: 2, alignment: {}, worldScore: 0.5 },
  },

  stoneword: {
    id: "stoneword",
    name: "Stoneword",
    icon: "👂",
    flavor:
      "Listen deeper. Hear what walks in the ash before it walks at you. The stone speaks, and you learn to hear past the surface. Each lesson learned: +2 Sanity (peace), +0.5 world score.",
    completionDelta: { sanity: 2, alignment: {}, worldScore: 0.5 },
  },

  voidcall: {
    id: "voidcall",
    name: "Voidcall",
    icon: "⚫",
    flavor:
      "Pull from outside. The lessons that aren't lessons — they're invitations. What you call in does not love you. Each lesson learned: -5 Sanity, +2 evil, -1 world score. The world thins where you stand.",
    completionDelta: { sanity: -5, alignment: { evil: 2 }, worldScore: -1 },
  },
};

// ─── Study nodes ───────────────────────────────────────────────────────
//
// First-pass content. Each path gets 2–3 tier-1 nodes that establish its
// shape, plus a tier-2 deepening node, plus a handful of cross-path nodes
// at higher tiers. More content gets authored in later iterations (#28 is
// a living task — the engine already supports any number of nodes).
//
// Tier durations (ms) — see ERA_PLAN.md "Arcane Studies → Timed mechanic":
//   tier 1 → 2 min       (120_000)
//   tier 2 → 5 min       (300_000)
//   tier 3 → 8 min       (480_000)   — crossover depth
//   tier 4 → 12 min+     (720_000)
//   apex   → 15+ min     (900_000+)

const MIN = 60 * 1000;

export const STUDIES = {
  // ─── Light Path ─────────────────────────────────────────────────────

  greaterMending: {
    id: "greaterMending",
    name: "Greater Mending",
    icon: "💖",
    path: "light",
    description:
      "The Mending Word, but louder. Where the small word closes a wound, the great word remakes the place the wound was.",
    whisper:
      "The stone speaks of mending that doesn't merely close. Of mending that remembers what the body was before it was hurt, and goes there.",
    onCompletedMessage:
      "💖 You have it. The Word, said larger. Things that broke will close further than they did.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, water: 3 },
    effect: { unlocksSpell: "greaterMending" },
    tier: 1, col: 0, parents: [],
  },

  sanctuary: {
    id: "sanctuary",
    name: "Sanctuary",
    icon: "⛩️",
    path: "light",
    description:
      "A line drawn around your home. Things that mean you harm step slower across it. They still come, but they come reluctant.",
    whisper:
      "The stone speaks of a threshold the world respects. Of saying *not here* with the whole of your breath.",
    onCompletedMessage:
      "⛩️ You set the ward. The wasteland respects the line. It will come slower now, when it comes.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, stone: 5 },
    effect: { passive: { threatEncounterReduction: 0.2 } },
    tier: 1, col: 1, parents: [],
  },

  cleansingWord: {
    id: "cleansingWord",
    name: "Cleansing Word",
    icon: "🌬️",
    path: "light",
    description:
      "A word that finds what's wrong in the body and lifts it out. Dysentery. Curses. The lingering things.",
    whisper:
      "The stone speaks of a breath that goes in and finds what shouldn't be there. The body keeps. The other thing leaves.",
    onCompletedMessage:
      "🌬️ You speak the Word. What rides on the body — sickness, curse — finds the door, and takes it.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, water: 5 },
    effect: { unlocksSpell: "cleansingWord" },
    tier: 1, col: 2, parents: [],
  },

  blessing: {
    id: "blessing",
    name: "Blessing",
    icon: "✨",
    path: "light",
    description:
      "A small light you can give yourself — a few minutes where the world goes easier on you. Sanity holds. The hand is surer.",
    whisper:
      "The stone speaks of the small gift you can give the body before a hard thing. Of saying *go gently* in the language the body understands.",
    onCompletedMessage:
      "✨ You learn to bless. The world bends a little softer where the blessing falls.",
    durationMs: 5 * MIN,
    cost: { scroll: 1, ink: 1, water: 3, fragments: 2 },
    requires: { parents: ["greaterMending"] },
    effect: { unlocksSpell: "blessing" },
    tier: 2, col: 0, parents: ["greaterMending"],
  },

  // ─── Bend Path ──────────────────────────────────────────────────────

  greaterBend: {
    id: "greaterBend",
    name: "Greater Bend",
    icon: "🌑",
    path: "bend",
    description:
      "Take more, take cleaner. What you draw from a thing comes through you faster, and the thing knows it's been bent.",
    whisper:
      "The stone speaks lower now. Of taking with intention. Of the resolve that lives in another, and the way it can be made yours instead.",
    onCompletedMessage:
      "🌑 You have it. The Bend, said larger. What you take, you take from elsewhere, and elsewhere notices.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, food: 3 },
    effect: { unlocksSpell: "greaterBend" },
    tier: 1, col: 0, parents: [],
  },

  curse: {
    id: "curse",
    name: "Curse",
    icon: "🕷️",
    path: "bend",
    description:
      "A small wrong settled on the target. Their hand shakes. Their luck slants. They fail in the small ways that, over time, become the large ones.",
    whisper:
      "The stone speaks of the small bad thing you can hand a person. Of the way their balance leaves them, after.",
    onCompletedMessage:
      "🕷️ You learn to curse. The hand that bears it shakes slightly. The wasteland will notice.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, fragments: 2 },
    effect: { unlocksSpell: "curse" },
    tier: 1, col: 1, parents: [],
  },

  soulflame: {
    id: "soulflame",
    name: "Soulflame",
    icon: "🔥",
    path: "bend",
    description:
      "Pay in HP to burn brighter. The blood goes into the spell, and the spell goes outward harder than your strength could.",
    whisper:
      "The stone speaks of the trade. Of what the body can give the magic that nothing else can give it. Of the cost that goes through the heart on the way out.",
    onCompletedMessage:
      "🔥 You learn the Soulflame. Where the body's blood is, the magic takes more.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, food: 5, fragments: 2 },
    effect: { unlocksSpell: "soulflame" },
    tier: 1, col: 2, parents: [],
  },

  dominate: {
    id: "dominate",
    name: "Dominate",
    icon: "👁️",
    path: "bend",
    description:
      "Reach into a smaller mind and make a choice for it. The mind doesn't notice. Until later, if at all.",
    whisper:
      "The stone speaks of the hand at the back of another's hand. Of the choice that wasn't theirs, made through them.",
    onCompletedMessage:
      "👁️ You learn to dominate. The eyes that have been told no longer answer to their owners. They answer to yours.",
    durationMs: 5 * MIN,
    cost: { scroll: 1, ink: 1, fragments: 5 },
    requires: { parents: ["greaterBend", "curse"] },
    effect: { unlocksSpell: "dominate" },
    tier: 2, col: 0, parents: ["greaterBend", "curse"],
  },

  // ─── Elemental Path ─────────────────────────────────────────────────

  coaxSpring: {
    id: "coaxSpring",
    name: "Coax the Spring",
    icon: "💦",
    path: "elemental",
    description:
      "The water that lives in the bones of the earth listens, a little. You teach the Water Hole to give faster.",
    whisper:
      "The stone speaks of the wells the earth was, before it was dust. Of the water that still waits, and answers a knock.",
    onCompletedMessage:
      "💦 The Water Hole tightens, then opens. The trickle is fuller now.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, water: 5 },
    effect: { passive: { waterHoleSpeedBonus: 0.5 } }, // +50% water_muddy/min
    tier: 1, col: 0, parents: [],
  },

  quickenGrowth: {
    id: "quickenGrowth",
    name: "Quicken Growth",
    icon: "🌱",
    path: "elemental",
    description:
      "The dust that was soil remembers. The Garden hears, and gives a little more, a little sooner.",
    whisper:
      "The stone speaks of the small green thing that wants to come back. Of the way it answers when you name it.",
    onCompletedMessage:
      "🌱 The Garden quickens. The pale green pushes faster than before.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, food: 5 },
    effect: { passive: { gardenSpeedBonus: 0.5 } },
    tier: 1, col: 1, parents: [],
  },

  stoneMend: {
    id: "stoneMend",
    name: "Stone Mend",
    icon: "🗿",
    path: "elemental",
    description:
      "Tools wear less under your hand. The stone in them remembers being unbroken, and bends back a little toward whole.",
    whisper:
      "The stone speaks of the kinship of stones. Of one thing made of stone teaching another what it forgot.",
    onCompletedMessage:
      "🗿 Your tools last longer in your grip. The stone in them holds.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, stone: 10 },
    effect: { passive: { toolDurabilityBonus: 0.25 } }, // tools last 25% longer
    tier: 1, col: 2, parents: [],
  },

  ashCleanse: {
    id: "ashCleanse",
    name: "Ash Cleanse",
    icon: "🍃",
    path: "elemental",
    description:
      "A patch of the wasteland goes quiet, then slightly green. Small, slow — but it stays. The world notices.",
    whisper:
      "The stone speaks of the small green you can leave behind you. Of the world's memory waking under your hands.",
    onCompletedMessage:
      "🍃 You cleanse a patch of ash. The world remembers what was here. The world says thank you, in its way.",
    durationMs: 5 * MIN,
    cost: { scroll: 1, ink: 1, water: 5, food: 3 },
    requires: { parents: ["stoneMend"] },
    effect: { passive: { worldScoreBonusOnTick: 0.01 } }, // slow trickle toward score
    tier: 2, col: 0, parents: ["stoneMend"],
  },

  // ─── Sigilcraft Path ────────────────────────────────────────────────

  firstSigil: {
    id: "firstSigil",
    name: "The First Sigil",
    icon: "✒️",
    path: "sigilcraft",
    description:
      "A rune inscribed holds its meaning. You learn the shape of the first one. It does little on its own — but everything that comes after needs it.",
    whisper:
      "The stone speaks of the first written name. Of the way a sound, once shaped on a page, becomes a thing that stays.",
    onCompletedMessage:
      "✒️ The First Sigil takes shape under your hand. From this, all written magic comes.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, fragments: 2 },
    effect: { passive: { sigilcraftFoundation: true } }, // gates Combat #37 enchants
    tier: 1, col: 0, parents: [],
  },

  bindingMark: {
    id: "bindingMark",
    name: "Binding Mark",
    icon: "🔗",
    path: "sigilcraft",
    description:
      "A small written promise on a tool. The tool, knowing its name now, refuses to break as quickly.",
    whisper:
      "The stone speaks of the mark you can leave on a thing that helps it remember it is itself. Of writing *stay* on a haft, and it stays.",
    onCompletedMessage:
      "🔗 You learn the Binding Mark. The tools that bear it last past what they were made to last.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, fragments: 3 },
    effect: { passive: { toolDurabilityBonus: 0.5 } },
    tier: 1, col: 1, parents: [],
  },

  // ─── Memory Path ────────────────────────────────────────────────────

  firstEcho: {
    id: "firstEcho",
    name: "The First Echo",
    icon: "🔔",
    path: "memory",
    description:
      "A small recall. Something that broke becomes, for a heartbeat, what it was before. Use it on a tool: the tool finds its edge again.",
    whisper:
      "The stone speaks of the way a thing keeps its old self alongside the new. Of the older self waiting, when called.",
    onCompletedMessage:
      "🔔 The Echo answers. What was, was. What is, can be told to remember.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, fragments: 2 },
    effect: { unlocksSpell: "echo" }, // restores tool durability when cast
    tier: 1, col: 0, parents: [],
  },

  readingPast: {
    id: "readingPast",
    name: "Reading the Past",
    icon: "📖",
    path: "memory",
    description:
      "Look at a threat and know what shaped it. The knowledge sits behind your eyes. The threat moves the same — but you know its measure.",
    whisper:
      "The stone speaks of seeing the long road a thing walked to get here. Of knowing the bone of it, the wound that made it.",
    onCompletedMessage:
      "📖 You read the past in the bones. Threats give up their secrets when you look.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, water: 3 },
    effect: { passive: { threatStatsVisible: true } }, // future #33: shows threat HP in log
    tier: 1, col: 1, parents: [],
  },

  // ─── Stoneword Path ─────────────────────────────────────────────────

  firstListening: {
    id: "firstListening",
    name: "The First Listening",
    icon: "👂",
    path: "stoneword",
    description:
      "You sit with the stone, longer. The world's small sounds take on shape. Once in a while, the ground gives more than it should — because you knew to ask.",
    whisper:
      "The stone speaks of the long quiet. Of the way the world speaks back when you don't speak first. Of the gift of the small extra.",
    onCompletedMessage:
      "👂 You learn the Listening. The ash gives, now and again, more than it would have. Because you knew to listen.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, water: 3, stone: 5 },
    effect: { passive: { gatherDoubleChance: 0.05 } }, // 5% chance for 2x on gather
    tier: 1, col: 0, parents: [],
  },

  weaknessSight: {
    id: "weaknessSight",
    name: "Weakness-Sight",
    icon: "🎯",
    path: "stoneword",
    description:
      "Look at a threat and see the soft place. The eye, the joint, the breath where the body stops being clever. A small advantage. Real.",
    whisper:
      "The stone speaks of the place a body forgets to defend. Of the look that finds it without trying.",
    onCompletedMessage:
      "🎯 You learn the Weakness-Sight. The soft places light up to your eye. Combat gives ground.",
    durationMs: 2 * MIN,
    cost: { scroll: 1, ink: 1, fragments: 2 },
    effect: { passive: { combatAccuracyBonus: 0.1 } }, // +10% acc when combat lands
    tier: 1, col: 1, parents: [],
  },

  // ─── Voidcall Path (apex-gated by deep Bend / evil alignment) ──────

  firstBeckoning: {
    id: "firstBeckoning",
    name: "The First Beckoning",
    icon: "⚫",
    path: "voidcall",
    description:
      "You call. Something looks back. Some part of it comes through. You can give it a direction. It will do what you point it at, mostly. The world thins behind you, slightly.",
    whisper:
      "The stone speaks differently here. Quieter. Almost apologetic. Of the door you can open that you cannot close. Of the thing on the other side that has been listening to you for some time now.",
    onCompletedMessage:
      "⚫ Something comes through. You point it. It moves where you point. The world is thinner now where you stand. It will remember being thinner.",
    durationMs: 8 * MIN, // long study — beckoning takes time, and the cost matters
    cost: { scroll: 2, ink: 2, fragments: 8, food: 5 },
    requires: { alignment: { evil: 5 } }, // hidden until 5 evil
    effect: { unlocksSpell: "voidcall" },
    tier: 1, col: 0, parents: [],
  },

  // ─── Cross-path nodes (depth + identity expression) ────────────────
  //
  // These are deep tier-3 nodes that REQUIRE completion across multiple
  // paths. They're displayed in the UI under their `path` tab but their
  // parent gating cuts across paths. The crossover topology — see
  // ERA_PLAN.md.

  wardweave: {
    id: "wardweave",
    name: "Wardweave",
    icon: "🛡️",
    path: "sigilcraft", // display home — but needs Light too
    description:
      "A written ward, in your skin or on your gear. Persistent. Sigil and Sanctuary, married into a thing that lives on you.",
    whisper:
      "The stone speaks of the ward you carry with you. Of writing *not me* on a part of yourself, in a way the wasteland reads.",
    onCompletedMessage:
      "🛡️ The Wardweave holds. You walk in the wasteland with a written safety. Damage finds you less.",
    durationMs: 8 * MIN,
    cost: { scroll: 2, ink: 2, fragments: 4, stone: 10 },
    requires: { parents: ["sanctuary", "firstSigil"] },
    effect: { addsStat: { armor: 2 } }, // permanent +2 armor (Task #39)
    tier: 3, col: 0, parents: ["sanctuary", "firstSigil"],
  },

  ghostcall: {
    id: "ghostcall",
    name: "Ghostcall",
    icon: "👻",
    path: "memory", // display home — but needs Bend too
    description:
      "Pull back the weakened shade of a thing you've defeated. It fights for you, briefly. Then it remembers it's dead, and goes.",
    whisper:
      "The stone speaks of the small recall that bends as it speaks. Of asking the dead thing to do one more thing before it leaves. Of the way the dead thing, sometimes, says yes.",
    onCompletedMessage:
      "👻 You learn the Ghostcall. What you have killed will fight for you, once more, before it leaves.",
    durationMs: 8 * MIN,
    cost: { scroll: 2, ink: 2, fragments: 6 },
    requires: { parents: ["firstEcho", "curse"] },
    effect: { unlocksSpell: "ghostcall" },
    tier: 3, col: 0, parents: ["firstEcho", "curse"],
  },

  truesight: {
    id: "truesight",
    name: "Truesight",
    icon: "🔮",
    path: "stoneword", // display home — but needs Light too
    description:
      "The light path and the listening path braid. You see threats as the stone sees them — their weight, their measure. Combat goes truer.",
    whisper:
      "The stone speaks of seeing without the body's eye in the way. Of the look that misses nothing because it is not looking *with* anything that can miss.",
    onCompletedMessage:
      "🔮 Truesight settles behind your eyes. You see threats as they are. Nothing they do surprises you.",
    durationMs: 12 * MIN,
    cost: { scroll: 3, ink: 3, fragments: 8, water: 5 },
    requires: { parents: ["weaknessSight", "cleansingWord"] },
    effect: { passive: { combatAccuracyBonus: 0.2, combatEvasionBonus: 0.1 } },
    tier: 4, col: 0, parents: ["weaknessSight", "cleansingWord"],
  },
};

export const getStudy = (id) => STUDIES[id] || null;
export const getAllStudies = () => Object.values(STUDIES);

export const getStudiesByPath = (path) =>
  getAllStudies().filter((s) => s.path === path);

// Returns the per-completion delta for a given study's path. Used by
// performCompleteStudy (#31) to apply sanity / alignment / world-score
// changes uniformly without each node having to declare them.
export function getPathCompletionDelta(study) {
  if (!study) return null;
  return STUDY_PATHS[study.path]?.completionDelta || null;
}
