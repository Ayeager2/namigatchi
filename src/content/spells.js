// Spell definitions — DATA, not code.

export const SPELLS = {
  mendingWord: {
    id: "mendingWord", name: "Mending Word", icon: "💗",
    description: "Speak the word the body remembers. Wounds close.",
    requires: { researched: "mendingWord", era: 3 },
    cost: { fragments: 1, spirit: 15 },
    effect: { hp: 20 },
    cooldownMs: 60 * 1000,
    castMessage: "💗 You speak the Mending Word. The flesh listens.",
    logKind: "spell_good",
  },

  soothe: {
    id: "soothe", name: "Soothe", icon: "🕊️",
    description: "Settle a shaking mind. Sanity returns.",
    requires: { researched: "soothe", era: 3 },
    cost: { fragments: 1, spirit: 10 },
    effect: { sanity: 15 },
    cooldownMs: 60 * 1000,
    castMessage: "🕊️ You Soothe yourself. The eyes settle. The world holds.",
    logKind: "spell_good",
  },

  innerHearth: {
    id: "innerHearth", name: "Inner Hearth", icon: "🔆",
    description: "Kindle the fire under the breastbone. Resolve returns.",
    requires: { researched: "innerHearth", era: 3 },
    cost: { fragments: 1, spirit: 5 },
    effect: { happiness: 20 },
    cooldownMs: 45 * 1000,
    castMessage: "🔆 You kindle the Inner Hearth. The will rises.",
    logKind: "spell_good",
  },

  // Alignment-gated. Banish wards demonic threats for 5 minutes. Bend
  // drains Resolve for Spirit at a brutal trade. Each shifts alignment.
  banish: {
    id: "banish", name: "Banish", icon: "🕯️",
    description: "Set a line the dark will not cross for a while.",
    requires: { researched: "banishSpell", era: 3, alignment: { good: 3 } },
    cost: { fragments: 2, spirit: 25 },
    effect: {},
    appliesStatus: { id: "warded", durationMs: 5 * 60 * 1000 },
    alignmentDelta: { good: 1 },
    cooldownMs: 90 * 1000,
    castMessage: "🕯️ You draw the line. For five minutes, the dark will not cross it.",
    logKind: "spell_good",
  },

  bend: {
    id: "bend", name: "Bend", icon: "🌑",
    description: "Trade your Resolve for Spirit. The world remembers.",
    requires: { researched: "bendSpell", era: 3, alignment: { evil: 3 } },
    cost: { fragments: 1, spirit: 0 },
    effect: { happiness: -15, spirit: 30 },
    alignmentDelta: { evil: 1 },
    cooldownMs: 60 * 1000,
    castMessage: "🌑 You Bend the world inward. Spirit pours in. Something in you goes quieter.",
    logKind: "spell_dark",
  },

  // ─── Spells unlocked via Arcane Studies (Era 2+) ──────────────────────
  //
  // These spells are gated by `requires.studied: <studyId>` — they appear
  // in the Spells modal once the matching study in content/studies.js has
  // been completed. See systems/spells.js getKnownSpells / canCastSpell
  // for the gate logic, and ERA_PLAN.md "Arcane Studies" for the design.
  //
  // Some of these depend on combat infrastructure that hasn't landed yet
  // (Tasks #33, #40). Those spells are AUTHORED here with placeholder
  // effects so they show up in the UI; the *gameplay* completes when the
  // combat-side wiring catches up. Each such spell is tagged with a
  // comment pointing at the task that finishes it.

  // ─ Light path
  greaterMending: {
    id: "greaterMending", name: "Greater Mending", icon: "💖",
    description: "The Word, said larger. Where Mending Word closes a wound, this remembers what the body was before the wound.",
    requires: { studied: "greaterMending" },
    cost: { fragments: 2, spirit: 25 },
    effect: { hp: 60 },
    cooldownMs: 90 * 1000,
    castMessage: "💖 You speak the Greater Mending. The flesh remembers itself.",
    logKind: "spell_good",
  },

  cleansingWord: {
    id: "cleansingWord", name: "Cleansing Word", icon: "🌬️",
    description: "A breath that finds what shouldn't be there — sickness, curse, lingering things — and lifts them out.",
    requires: { studied: "cleansingWord" },
    cost: { fragments: 2, spirit: 20 },
    effect: { sanity: 5 },                      // small sanity bump too
    clearsStatuses: ["dysentery", "cursed"],    // see systems/spells.js performCastSpell
    cooldownMs: 90 * 1000,
    castMessage: "🌬️ You speak the Cleansing Word. What rides on the body finds the door.",
    logKind: "spell_good",
  },

  blessing: {
    id: "blessing", name: "Blessing", icon: "✨",
    description: "A small light. For a few minutes, the world goes easier on you — sanity holds, the hand is surer.",
    requires: { studied: "blessing" },
    cost: { fragments: 2, spirit: 15 },
    effect: {},
    appliesStatus: { id: "blessed", durationMs: 3 * 60 * 1000 },
    cooldownMs: 120 * 1000,
    castMessage: "✨ You bless yourself. The world bends softer. For a little while.",
    logKind: "spell_good",
  },

  // ─ Bend path
  greaterBend: {
    id: "greaterBend", name: "Greater Bend", icon: "🌑",
    description: "Take cleaner. The Spirit comes through with less of yourself sacrificed.",
    requires: { studied: "greaterBend" },
    cost: { fragments: 2, spirit: 0 },
    effect: { happiness: -10, spirit: 50 },     // bigger pour than Bend, smaller cost
    alignmentDelta: { evil: 1 },
    cooldownMs: 75 * 1000,
    castMessage: "🌑 The Greater Bend pulls. Spirit floods in. Something in you goes quieter still.",
    logKind: "spell_dark",
  },

  curse: {
    id: "curse", name: "Curse", icon: "🕷️",
    description: "Settle a small wrong on yourself, redirected outward. Your luck slants. The threats nearby find their footing harder.",
    requires: { studied: "curse" },
    cost: { fragments: 2, spirit: 15 },
    effect: { sanity: -3 },                     // small cost to your sanity
    appliesStatus: { id: "cursing", durationMs: 2 * 60 * 1000 },
    alignmentDelta: { evil: 1 },
    cooldownMs: 90 * 1000,
    castMessage: "🕷️ You curse. The room cools. Something near you stumbles, and doesn't know why.",
    logKind: "spell_dark",
  },

  soulflame: {
    id: "soulflame", name: "Soulflame", icon: "🔥",
    description: "Burn HP into raw Spirit. The body pays. The spell pays back.",
    requires: { studied: "soulflame" },
    cost: { fragments: 1, spirit: 0 },
    effect: { hp: -25, spirit: 50 },
    alignmentDelta: { evil: 1 },
    cooldownMs: 60 * 1000,
    castMessage: "🔥 You burn the blood. The Spirit answers. The body keeps the cost.",
    logKind: "spell_dark",
  },

  dominate: {
    id: "dominate", name: "Dominate", icon: "👁️",
    description: "Reach into a smaller mind and make a choice for it. (Combat-only — Task #33 wires the actual effect.)",
    requires: { studied: "dominate" },
    cost: { fragments: 3, spirit: 30 },
    effect: { sanity: -5 },                     // baseline cost; combat effect later
    alignmentDelta: { evil: 1 },
    cooldownMs: 180 * 1000,
    castMessage: "👁️ Dominate. The eyes you reached for stop being theirs.",
    logKind: "spell_dark",
  },

  // ─ Memory path
  echo: {
    id: "echo", name: "Echo", icon: "🔔",
    description: "Call back a tool's older self. The next tool you handle finds its edge restored.",
    requires: { studied: "firstEcho" },
    cost: { fragments: 2, spirit: 15 },
    effect: {},
    repairsAllTools: 0.5,                       // restores 50% of max durability across all owned tools — see systems/spells.js
    cooldownMs: 180 * 1000,
    castMessage: "🔔 You call the Echo. Your tools remember being whole.",
    logKind: "spell_good",
  },

  ghostcall: {
    id: "ghostcall", name: "Ghostcall", icon: "👻",
    description: "Pull back the weakened shade of something you've killed. It fights for you, briefly. (Combat-only — Task #33.)",
    requires: { studied: "ghostcall" },
    cost: { fragments: 3, spirit: 25 },
    effect: { sanity: -3 },
    appliesStatus: { id: "ghostcalled", durationMs: 60 * 1000 },
    cooldownMs: 240 * 1000,
    castMessage: "👻 The shade comes back. It will help. It will leave again.",
    logKind: "spell_dark",
  },

  // ─ Voidcall path — apex evil spell, world-thinning
  voidcall: {
    id: "voidcall", name: "Voidcall", icon: "⚫",
    description: "Open the door. Point what comes through. The world thins where you stand. (Combat damage — Task #33 finishes the wiring.)",
    requires: { studied: "firstBeckoning", alignment: { evil: 5 } },
    cost: { fragments: 5, spirit: 40 },
    effect: { sanity: -10, hp: -5 },            // every cast hurts you
    alignmentDelta: { evil: 2 },
    worldScoreDelta: -1,                        // see systems/spells.js — wires into Task #29
    cooldownMs: 300 * 1000,
    castMessage: "⚫ Voidcall. Something looks back. It comes through. The world is thinner here now. It will remember.",
    logKind: "spell_dark",
  },
};

export const getSpell = (id) => SPELLS[id] || null;
export const getAllSpells = () => Object.values(SPELLS);
