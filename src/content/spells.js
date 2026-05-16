// Spell definitions — DATA, not code.
//
// A spell is a tool-shaped action: it lives in content, the system reads it.
// Spells are gated by an `unlocksSpell` research effect (the research node IS
// the "learn the spell" moment; the spell entry here is the "what it does"
// part). Casting a spell:
//   1. Costs fragments + Spirit (drained from stats.spirit).
//   2. Applies a stat effect immediately.
//   3. Stamps a per-spell cooldown into run.spellCooldowns.
//
// Era 3 only — gated by era >= 3 plus research learned.

export const SPELLS = {
  mendingWord: {
    id: "mendingWord",
    name: "Mending Word",
    icon: "💗",
    description: "Speak the word the body remembers. Wounds close.",
    requires: { researched: "mendingWord", era: 3 },
    cost: { fragments: 1, spirit: 15 },
    effect: { hp: 20 },
    cooldownMs: 60 * 1000,
    castMessage: "💗 You speak the Mending Word. The flesh listens.",
    logKind: "spell_good",
  },

  soothe: {
    id: "soothe",
    name: "Soothe",
    icon: "🕊️",
    description: "Settle a shaking mind. Sanity returns.",
    requires: { researched: "soothe", era: 3 },
    cost: { fragments: 1, spirit: 10 },
    effect: { sanity: 15 },
    cooldownMs: 60 * 1000,
    castMessage: "🕊️ You Soothe yourself. The eyes settle. The world holds.",
    logKind: "spell_good",
  },

  innerHearth: {
    id: "innerHearth",
    name: "Inner Hearth",
    icon: "🔆",
    description: "Kindle the fire under the breastbone. Resolve returns.",
    requires: { researched: "innerHearth", era: 3 },
    cost: { fragments: 1, spirit: 5 },
    effect: { happiness: 20 },
    cooldownMs: 45 * 1000,
    castMessage: "🔆 You kindle the Inner Hearth. The will rises.",
    logKind: "spell_good",
  },
};

export const getSpell = (id) => SPELLS[id] || null;
export const getAllSpells = () => Object.values(SPELLS);
