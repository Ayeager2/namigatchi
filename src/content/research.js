// Research definitions — DATA, not code.
// Adding a research node = new entry here. No code changes elsewhere.
//
// Narrative framing: research is NOT "spend points to unlock." It is "the rock
// whispers a recipe, and you spend resources to listen and learn." Every node
// has a whisper. The verb is "Listen," not "Research." The rock stays central
// to every unlock.
//
// Tree layout: each node has tier + position in tier (col). The renderer
// computes pixel coords from these. Connections are inferred from `parents`.
// If a node has no parents, it connects directly to the root (the rock).
//
// Each node:
//   id, name, icon, whisper (italic body text from the rock)
//   cost: { resourceId: qty }     -- consumed when listened to
//   requires: { hutBuilt, ... }    -- gating predicates
//   effect: { gatherBonus, unlocksBuilding, addsResource, ... }
//   onLearnedMessage: log line when the player completes this research
//   tier: 1, 2, 3, ...             -- distance from root
//   col:  0, 1, 2, ...             -- position within tier
//   parents: ["nodeId", ...]       -- prerequisite teachings ([] = root)

export const RESEARCH = {
  foraging: {
    id: "foraging",
    name: "Foraging",
    icon: "🌿",
    whisper:
      "The stone speaks of berries that grow in the cracks. Of roots that hide where nothing else lives.",
    cost: { wood: 5, water: 5 },
    requires: { hutBuilt: true },
    effect: { addsResource: "food" },
    onLearnedMessage:
      "You listen, and the stone teaches you to look. The dead earth is not as empty as you thought.",
    tier: 1,
    col: 0,
    parents: [],
  },

  fire: {
    id: "fire",
    name: "Fire",
    icon: "🔥",
    whisper:
      "The stone speaks of fire. Of warmth. Of stones struck against dry wood until something catches and remembers what it is.",
    cost: { wood: 5, stone: 3 },
    requires: { hutBuilt: true },
    effect: { unlocksBuilding: "firepit" },
    onLearnedMessage:
      "You listen, and the stone teaches you fire. You can build a pit now, if you have the will.",
    tier: 1,
    col: 1,
    parents: [],
  },

  knapping: {
    id: "knapping",
    name: "Knapping",
    icon: "🪓",
    whisper:
      "The stone speaks of edges. Of striking one stone against another until something sharper than need is born.",
    cost: { stone: 10 },
    requires: { hutBuilt: true },
    effect: { gatherBonus: 1 },
    onLearnedMessage:
      "You listen, and the stone teaches you edges. Your hands take more from the earth now.",
    tier: 1,
    col: 2,
    parents: [],
  },

  // Tier 2 — defense / survival reinforcement
  vigilance: {
    id: "vigilance",
    name: "Vigilance",
    icon: "👁️",
    whisper:
      "The stone speaks of watching. Of the long quiet eye that sees what stirs in the ash before it is upon you.",
    cost: { food: 5, stone: 10 },
    requires: { hutBuilt: true },
    effect: { defense: 2 },
    onLearnedMessage:
      "You listen, and the stone teaches you to watch. Your eyes harden against the dust.",
    tier: 2,
    col: 0,
    parents: ["knapping"],
  },

  hiddenStores: {
    id: "hiddenStores",
    name: "Hidden Stores",
    icon: "📦",
    whisper:
      "The stone speaks of caches. Of placing what you must keep where the hungry cannot find it.",
    cost: { food: 5, wood: 10 },
    requires: { hutBuilt: true },
    effect: { foodStealReduction: 1 },
    onLearnedMessage:
      "You listen, and the stone teaches you to hide. The hungry find less when they come.",
    tier: 2,
    col: 1,
    parents: ["foraging"],
  },

  mending: {
    id: "mending",
    name: "Mending",
    icon: "🩹",
    whisper:
      "The stone speaks of slow knitting. Of bone that remembers itself, of skin that closes around what it must.",
    cost: { food: 5, water: 5 },
    requires: { hutBuilt: true },
    effect: { healBonus: 5 },
    onLearnedMessage:
      "You listen, and the stone teaches you mending. Rest and food restore more of the body's quiet weight.",
    tier: 2,
    col: 2,
    parents: ["foraging"],
  },
};

export const getResearch = (id) => RESEARCH[id] || null;
export const getAllResearch = () => Object.values(RESEARCH);

// Compute tree dimensions based on what's in RESEARCH.
// Used by the renderer to size the tree canvas.
export function getTreeBounds() {
  const all = getAllResearch();
  let maxTier = 0;
  let maxCol = 0;
  for (const r of all) {
    maxTier = Math.max(maxTier, r.tier);
    maxCol = Math.max(maxCol, r.col);
  }
  return { tiers: maxTier, cols: maxCol + 1 };
}
