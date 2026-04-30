// Building definitions — DATA, not code.
// Adding a building = new entry here. No code changes needed elsewhere.
//
// Each building has:
//   id, name, icon, description     — basic identity
//   category                         — color/grouping in tree
//   cost: { resourceId: qty }       — consumed on build
//   requires: { rockAwakened, researched } — gating predicates
//   effect: { gatherBonus, ... }    — passive bonuses while built
//   effectSummary                    — human-readable summary for UI
//   onBuiltMessage                   — log line on completion
//   whisperOnAvailable, whisperOnBuilt — rock voice (optional)
//
// Tree layout (LEFT TO RIGHT — root on left, branches grow right):
//   tier:    1, 2, 3, ...   distance from root (column in the tree)
//   col:     0, 1, 2, ...   vertical position within tier
//   parents: [buildingId]   prerequisite buildings ([] = root)
//
// New buildings tier outward: Era 1 buildings at tier 1-2, Era 2 at 2-4,
// Era 3+ at 4+. Tree absorbs the future automatically.

// Categories used for color-coding nodes in the tree. Ordered by where they
// appear in the era progression.
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
    description: "A simple shelter of stone and wood. The wasteland will be less hostile from here.",
    cost: { wood: 20, stone: 15, water: 5 },
    requires: { rockAwakened: true },
    effect: { gatherBonus: 1 },
    effectSummary: "+1 to all gather yields · activates survival mechanics",
    onBuiltMessage:
      "You raise a small hut from gathered timber and stone. The wasteland is no longer empty.",
    whisperOnAvailable:
      "The stone whispers: shelter, warmth, a place to call your own. Build a hut.",
    whisperOnBuilt:
      "The stone whispers: there are skills to learn. Listen, and the world will open.",
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
    effect: { gatherBonus: 1 },
    effectSummary: "+1 to all gather yields · +20 to rest recovery",
    onBuiltMessage:
      "You strike sparks until something catches. The fire watches you back.",
    whisperOnBuilt:
      "The stone whispers: the cold is no longer your master. What else will you ask of the world?",
    tier: 2,
    col: 0,
    parents: ["hut"],
  },
};

export const getBuilding = (id) => BUILDINGS[id] || null;
export const getAllBuildings = () => Object.values(BUILDINGS);

// Compute tree dimensions from BUILDINGS data.
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
