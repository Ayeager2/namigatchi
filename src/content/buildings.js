// Building definitions — DATA, not code.

export const BUILDING_CATEGORIES = {
  shelter:     { id: "shelter",     name: "Shelter",     order: 1 },
  comfort:     { id: "comfort",     name: "Comfort",     order: 2 },
  tools:       { id: "tools",       name: "Tools",       order: 3 },
  industry:    { id: "industry",    name: "Industry",    order: 4 },
  arcane:      { id: "arcane",      name: "Arcane",      order: 5 },
  sovereignty: { id: "sovereignty", name: "Sovereignty", order: 6 },
  cosmos:      { id: "cosmos",      name: "Cosmos",      order: 7 },
};

export const BUILDINGS = {
  hut: {
    id: "hut",
    name: "Hut",
    icon: "🛖",
    category: "shelter",
    description: "A simple shelter of stone and wood.",
    cost: { wood: 60, stone: 25, water: 2 },
    requires: { rockAwakened: true },
    effect: { gatherBonus: 1, gatherSpeedup: 150 },
    effectSummary: "+1 gather yield · -150ms gather cooldown · activates survival",
    onBuiltMessage: "You raise a small hut from gathered timber and stone. The wasteland is no longer empty.",
    whisperOnAvailable: "The stone whispers: shelter, warmth, a place to call your own. Build a hut.",
    whisperOnBuilt: "The stone whispers: there are skills to learn. Listen, and the world will open.",
    tier: 1,
    col: 0,
    parents: [],
  },

  firepit: {
    id: "firepit",
    name: "Fire Pit",
    icon: "🔥",
    category: "comfort",
    description: "A ring of stones and a hollow of ember. The cold no longer rules you here.",
    cost: { wood: 8, stone: 10 },
    requires: { researched: "fire" },
    effect: { gatherBonus: 1, gatherSpeedup: 100 },
    effectSummary: "+1 gather yield · -100ms gather cooldown · +20 rest recovery",
    onBuiltMessage: "You strike sparks until something catches. The fire watches you back.",
    whisperOnBuilt: "The stone whispers: the cold is no longer your master. What else will you ask of the world?",
    tier: 2,
    col: 0,
    parents: ["hut"],
  },

  well: {
    id: "well",
    name: "Well",
    icon: "🪣",
    category: "comfort",
    description: "A pit dug deep, lined with stone. The earth holds water in its bones.",
    cost: { wood: 30, stone: 40, water: 5 },
    requires: { researched: "waterCarrying" },
    effect: {},
    passiveProduce: { water: { perMinute: 2 } },
    effectSummary: "+2 water / minute — passive trickle, even while away.",
    onBuiltMessage: "🪣 The well goes deep. Water seeps in slow.",
    whisperOnBuilt: "The stone whispers: the earth has been thirsty too. It will share, if you ask kindly.",
    tier: 3,
    col: 0,
    parents: ["hut"],
  },

  garden: {
    id: "garden",
    name: "Garden",
    icon: "🌱",
    category: "comfort",
    description: "A patch of soil, turned and tended. Grubs nest where the dirt is loosened.",
    cost: { wood: 25, stone: 15, water: 8, food: 3 },
    requires: { researched: "foraging" },
    effect: {},
    passiveProduce: { food: { perMinute: 3 } },
    effectSummary: "+3 grubs / minute — passive trickle. Halved while a flock is feeding.",
    onBuiltMessage: "🌱 You break the dust into soil. Something pale wriggles up. The wasteland accepts the offering.",
    whisperOnBuilt: "The stone whispers: the dust remembers being a garden, once.",
    tier: 3,
    col: 1,
    parents: ["hut"],
  },
};

export const getBuilding = (id) => BUILDINGS[id] || null;
export const getAllBuildings = () => Object.values(BUILDINGS);

export function getBuildingTreeBounds() {
  const all = getAllBuildings();
  let maxTier = 0;
  let maxCol = 0;
  for (const b of all) {
    maxTier = Math.max(maxTier, b.tier);
    maxCol = Math.max(maxCol, b.col);
  }
  return { tiers: maxTier, cols: maxCol + 1 };
}
