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
};

export const getSpell = (id) => SPELLS[id] || null;
export const getAllSpells = () => Object.values(SPELLS);
