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
    tier: 1, col: 0, parents: [],
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
    tier: 2, col: 0, parents: ["hut"],
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
    whisperOnBuilt: "The stone whispers: the earth has been thirsty too.",
    tier: 3, col: 0, parents: ["hut"],
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
    effectSummary: "+3 grubs / minute · halved while a flock is feeding.",
    onBuiltMessage: "🌱 You break the dust into soil. Something pale wriggles up.",
    whisperOnBuilt: "The stone whispers: the dust remembers being a garden, once.",
    tier: 3, col: 1, parents: ["hut"],
  },

  forge: {
    id: "forge",
    name: "Forge",
    icon: "⚒️",
    category: "industry",
    description: "Stones stacked into a hollow. Coal and bellows. Heat enough to soften the world's hardest pieces.",
    cost: { stone: 80, wood: 50, water: 10 },
    requires: { researched: "smithing" },
    effect: {},
    effectSummary: "Required for Era 2 tools (Stone Axe, Pickaxe, Bone Knife, Bow).",
    onBuiltMessage: "⚒️ The forge takes shape. The first heat rises. The wasteland's old shapes give way.",
    whisperOnBuilt: "The stone whispers: now there is no edge the world can hold against you that you cannot break.",
    tier: 5, col: 0, parents: ["firepit"],
  },

  cairn: {
    id: "cairn",
    name: "Cairn",
    icon: "🗿",
    category: "shelter",
    description: "A stacked-stone cellar dug half into the dust. Holds what you would otherwise lose.",
    cost: { wood: 30, stone: 50 },
    requires: { researched: "hiddenStores" },
    effect: {},
    storageCaps: {
      wood: 50, stone: 50, water: 20, food: 15, bird_meat: 10, feathers: 20,
    },
    effectSummary: "+50 wood/stone · +20 water · +15 grubs · +10 bird meat · +20 feathers — caps raised.",
    onBuiltMessage: "🗿 You stack the cairn slow, fitting stone to stone.",
    whisperOnBuilt: "The stone whispers: keeping is its own kind of work.",
    tier: 4, col: 0, parents: ["hut"],
  },

  home: {
    id: "home",
    name: "Home",
    icon: "🏡",
    category: "shelter",
    description: "Daub and timber. Rough thatching. A door that closes. Not a place you sleep — a place you live.",
    cost: { wood: 60, stone: 50, water: 5 },
    requires: { researched: "home" },
    effect: { gatherBonus: 1, restBonus: { energy: 10, happiness: 3, sanity: 2 } },
    effectSummary: "+1 gather yield · Rest restores more here · Resolve & Sanity boost on build.",
    onBuiltMessage: "🏡 You raise a true house. The roof sets. The door swings true. Something in you settles that has been pacing for a long time.",
    whisperOnBuilt: "The stone whispers: now you have a place to return to. Even the wasteland respects that.",
    tier: 5, col: 1, parents: ["hut"],
  },

  walls: {
    id: "walls",
    name: "Stone Walls",
    icon: "🧱",
    category: "shelter",
    description: "Stacked stone, packed earth. Low at first, then waist-high. The wasteland gets in slower now.",
    cost: { stone: 100, wood: 30 },
    requires: { researched: "home", hasBuilding: "home" },
    effect: { defense: 3, foodStealReduction: 2 },
    effectSummary: "+3 defense vs. threats · -2 food stolen per raid.",
    onBuiltMessage: "🧱 You stack the wall slow, lifting each stone until your shoulders burn. When you stand back, the camp looks like a place worth defending.",
    whisperOnBuilt: "The stone whispers: a line drawn against the dust. They will still come — but slower, now.",
    tier: 6, col: 0, parents: ["home"],
  },

  silo: {
    id: "silo",
    name: "Rudimentary Silo",
    icon: "🏚️",
    category: "shelter",
    description: "Stones laid in a ring, a wooden lid above. Cool air settles inside. What you store keeps longer.",
    cost: { stone: 50, wood: 40 },
    requires: { researched: "home", hasBuilding: "home" },
    effect: { spoilageMultiplier: 0.7 },
    storageCaps: { food: 30, bird_meat: 20 },
    effectSummary: "+30 grubs · +20 bird meat caps · food spoils ~30% slower.",
    onBuiltMessage: "🏚️ You ring the silo with stone and seal the lid. The food keeps longer here. The wasteland will not pry it open quickly.",
    whisperOnBuilt: "The stone whispers: keeping is more than holding. Keeping is patience.",
    tier: 6, col: 1, parents: ["home", "garden"],
  },

  farmhouse: {
    id: "farmhouse",
    name: "Rudimentary Farmhouse",
    icon: "🏘️",
    category: "shelter",
    description: "Rough timber framing. A hearth at the heart of it. The earth here knows you now.",
    cost: { stone: 30, wood: 60, food: 5 },
    requires: { researched: "home", hasBuilding: "home" },
    effect: { gardenBoost: 0.5 },
    passiveProduce: { wood: { perMinute: 0.5 } },
    effectSummary: "+50% Garden output · +0.5 wood / minute (scrub clearing).",
    onBuiltMessage: "🏘️ You frame the farmhouse, raise the hearth, and stand in the doorway. The garden out front looks like it belongs there. So do you.",
    whisperOnBuilt: "The stone whispers: now the dust remembers you. The soil pays attention.",
    tier: 6, col: 2, parents: ["home", "garden"],
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
