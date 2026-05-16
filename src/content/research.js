// Research definitions — DATA, not code.

export const RESEARCH = {
  foraging: {
    id: "foraging", name: "Foraging", icon: "🌿",
    whisper: "The stone speaks of berries that grow in the cracks. Of roots that hide where nothing else lives.",
    cost: { wood: 5, water: 5 },
    requires: { hutBuilt: true },
    effect: { addsResource: "food" },
    onLearnedMessage: "You listen, and the stone teaches you to look. The dead earth is not as empty as you thought.",
    tier: 1, col: 0, parents: [],
  },

  fire: {
    id: "fire", name: "Fire", icon: "🔥",
    whisper: "The stone speaks of fire. Of warmth. Of stones struck against dry wood until something catches and remembers what it is.",
    cost: { wood: 5, stone: 3 },
    requires: { hutBuilt: true },
    effect: { unlocksBuilding: "firepit" },
    onLearnedMessage: "You listen, and the stone teaches you fire. You can build a pit now, if you have the will.",
    tier: 1, col: 1, parents: [],
  },

  knapping: {
    id: "knapping", name: "Knapping", icon: "🪓",
    whisper: "The stone speaks of edges. Of striking one stone against another until something sharper than need is born.",
    cost: { stone: 10 },
    requires: { hutBuilt: true },
    effect: { gatherBonus: 1, gatherSpeedup: 250 },
    onLearnedMessage: "You listen, and the stone teaches you edges. Your hands take more from the earth now, and faster.",
    tier: 1, col: 2, parents: [],
  },

  vigilance: {
    id: "vigilance", name: "Vigilance", icon: "👁️",
    whisper: "The stone speaks of watching. Of the long quiet eye that sees what stirs in the ash before it is upon you.",
    cost: { food: 5, stone: 10 },
    requires: { hutBuilt: true },
    effect: { defense: 2 },
    onLearnedMessage: "You listen, and the stone teaches you to watch. Your eyes harden against the dust.",
    tier: 2, col: 0, parents: ["knapping"],
  },

  hiddenStores: {
    id: "hiddenStores", name: "Hidden Stores", icon: "📦",
    whisper: "The stone speaks of caches. Of placing what you must keep where the hungry cannot find it.",
    cost: { food: 5, wood: 10 },
    requires: { hutBuilt: true },
    effect: { foodStealReduction: 1 },
    onLearnedMessage: "You listen, and the stone teaches you to hide. The hungry find less when they come.",
    tier: 2, col: 1, parents: ["foraging"],
  },

  mending: {
    id: "mending", name: "Mending", icon: "🩹",
    whisper: "The stone speaks of slow knitting. Of bone that remembers itself, of skin that closes around what it must.",
    cost: { food: 5, water: 5 },
    requires: { hutBuilt: true },
    effect: { healBonus: 5 },
    onLearnedMessage: "You listen, and the stone teaches you mending. Rest and food restore more of the body's quiet weight.",
    tier: 2, col: 2, parents: ["foraging"],
  },

  netWeaving: {
    id: "netWeaving", name: "Net Weaving", icon: "🕸️",
    whisper: "The stone speaks of cordage. Of fibers twisted against themselves until they hold what they would not alone.",
    cost: { wood: 8, stone: 3 },
    requires: { hutBuilt: true },
    effect: { unlocksTool: "net" },
    onLearnedMessage: "You listen, and the stone teaches you weaving. You can make a net now — and what is a net for, if not the things that fly?",
    tier: 2, col: 3, parents: ["knapping"],
  },

  diggingStickCraft: {
    id: "diggingStickCraft", name: "Hardened Wood", icon: "🥢",
    whisper: "The stone speaks of fire and patience. Of wood held over embers until the tip refuses to break.",
    cost: { wood: 6, stone: 2 },
    requires: { hutBuilt: true },
    effect: { unlocksTool: "diggingStick" },
    onLearnedMessage: "You listen, and the stone teaches you the fire-tempered point. The earth will give up what it has hidden.",
    tier: 2, col: 4, parents: ["fire"],
  },

  cooking: {
    id: "cooking", name: "Cooking", icon: "🍳",
    whisper: "The stone speaks of fire and meat. Of heat that breaks the cold thing into something the body can use.",
    cost: { wood: 10, food: 5 },
    requires: { hutBuilt: true },
    effect: { cookingBonus: 5 },
    onLearnedMessage: "You listen, and the stone teaches you cooking. Food is more filling now, when warmed.",
    tier: 3, col: 1, parents: ["fire"],
  },

  tracking: {
    id: "tracking", name: "Tracking", icon: "🐾",
    whisper: "The stone speaks of sign. Of broken twigs, of pressed dust, of the way the world remembers what walks across it.",
    cost: { stone: 8, food: 3 },
    requires: { hutBuilt: true },
    effect: { fragmentChance: 0.05, gatherBonus: 1, gatherSpeedup: 100 },
    onLearnedMessage: "You listen, and the stone teaches you to read the dust. The world gives up more of what it hides, and your hand finds it sooner.",
    tier: 3, col: 0, parents: ["vigilance"],
  },

  waterCarrying: {
    id: "waterCarrying", name: "Water Carrying", icon: "🧴",
    whisper: "The stone speaks of vessels. Of skins stitched and sealed, of the slow generosity of water that does not run away.",
    cost: { water: 5, wood: 3 },
    requires: { hutBuilt: true },
    effect: { unlocksTool: "waterSkin" },
    onLearnedMessage: "You listen, and the stone teaches you to carry. Water no longer runs through your hands.",
    tier: 3, col: 2, parents: ["mending"],
  },

  trapping: {
    id: "trapping", name: "Trapping", icon: "🪤",
    whisper: "The stone speaks of waiting. Of the loop set where the foot will find it, of the patience that needs no muscle.",
    cost: { wood: 12, stone: 6, feathers: 1 },
    requires: { hutBuilt: true },
    effect: { unlocksTool: "snare" },
    onLearnedMessage: "You listen, and the stone teaches you the snare. The wasteland feeds those who set their loops well.",
    tier: 4, col: 0, parents: ["tracking"],
  },

  smithing: {
    id: "smithing", name: "Smithing", icon: "⚒️",
    whisper: "The stone speaks of heat that softens what was hard, and a hammer that makes it harder still. Of stones bound to handles, of edges that hold their grudge against the world.",
    cost: { stone: 40, wood: 20, food: 5 },
    requires: { hutBuilt: true, era: 2 },
    effect: { unlocksBuilding: "forge" },
    onLearnedMessage: "You listen, and the stone teaches you smithing. The Forge is no longer a memory — it is a place you can raise.",
    tier: 4, col: 2, parents: ["knapping", "fire"],
  },

  fletching: {
    id: "fletching", name: "Fletching", icon: "🏹",
    whisper: "The stone speaks of feathers and shafts. Of the long reach. Of the bird that does not see you because you are very far away.",
    cost: { feathers: 5, wood: 10, stone: 5 },
    requires: { hutBuilt: true, era: 2 },
    effect: { unlocksTool: "bow" },
    onLearnedMessage: "You listen, and the stone teaches you fletching. Reach has been added to your hand. The wasteland will know it.",
    tier: 4, col: 3, parents: ["netWeaving", "tracking"],
  },

  home: {
    id: "home", name: "Home", icon: "🏠",
    whisper: "The stone speaks of staying. Of a roof above the same ground, day after day. Of a door that knows your hand, and walls that learn your voice.",
    cost: { wood: 40, stone: 30, food: 5, water: 3 },
    requires: { hutBuilt: true, era: 2 },
    effect: { unlocksBuilding: "home" },
    onLearnedMessage: "You listen, and the stone teaches you what it means to stay. The hut was a shelter. What you build now will be yours.",
    tier: 5, col: 1, parents: ["smithing"],
  },

  // ============== Era 3 (Awakened World) ==============

  arcaneAwakening: {
    id: "arcaneAwakening", name: "Arcane Awakening", icon: "✨",
    whisper: "The stone speaks differently now. Lower. Older. It speaks of the shards in your pack, and what they truly are. It speaks of what they were when the world was whole.",
    cost: { fragments: 10 },
    requires: { hutBuilt: true, era: 3 },
    effect: { revealsFragments: true },
    onLearnedMessage: "You listen, and the stone teaches you the shape of what you have been carrying. The fragments in your pack are not stone. They never were. They are Arcane Shards — pieces of a thing that broke, and remembers being whole.",
    tier: 6, col: 0, parents: ["home"],
  },

  mendingWord: {
    id: "mendingWord", name: "Mending Word", icon: "💗",
    whisper: "The stone speaks of a word the body remembers. Of breath drawn deliberately. Of blood that listens.",
    cost: { fragments: 5, water: 5 },
    requires: { hutBuilt: true, era: 3 },
    effect: { unlocksSpell: "mendingWord" },
    onLearnedMessage: "You listen, and the stone teaches you the Mending Word. Speak it, and the body answers.",
    tier: 7, col: 0, parents: ["arcaneAwakening"],
  },

  soothe: {
    id: "soothe", name: "Soothe", icon: "🕊️",
    whisper: "The stone speaks of stillness. Of the panicked mind that, given a long enough breath, returns to itself.",
    cost: { fragments: 5, food: 3 },
    requires: { hutBuilt: true, era: 3 },
    effect: { unlocksSpell: "soothe" },
    onLearnedMessage: "You listen, and the stone teaches you to Soothe. The shaking quiets. The eyes settle.",
    tier: 7, col: 1, parents: ["arcaneAwakening"],
  },

  innerHearth: {
    id: "innerHearth", name: "Inner Hearth", icon: "🔆",
    whisper: "The stone speaks of a fire under the breastbone. The one that does not need wood. The one that decides whether you go on.",
    cost: { fragments: 5, wood: 5 },
    requires: { hutBuilt: true, era: 3 },
    effect: { unlocksSpell: "innerHearth" },
    onLearnedMessage: "You listen, and the stone teaches you the Inner Hearth. The resolve is yours to kindle now, when the wasteland tries to put you out.",
    tier: 7, col: 2, parents: ["arcaneAwakening"],
  },
};

export const getResearch = (id) => RESEARCH[id] || null;
export const getAllResearch = () => Object.values(RESEARCH);

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
