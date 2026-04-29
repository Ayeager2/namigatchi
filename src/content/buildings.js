// Building definitions — DATA, not code.
// Adding a building = new entry here. No code changes needed elsewhere.
//
// Each building has:
//   id, name, icon, description
//   cost: { resourceId: qty }            -- consumed on build
//   requires: { rockAwakened, era, ... } -- gating predicates
//   effect: { gatherBonus, ... }         -- passive bonuses while built
//   onBuiltMessage: log text on completion
//   whisperOnAvailable: rock whisper when first becomes buildable (optional)
//   whisperOnBuilt:     rock whisper after build (optional)

export const BUILDINGS = {
  hut: {
    id: "hut",
    name: "Hut",
    icon: "🛖",
    description: "A simple shelter of stone and wood. The wasteland will be less hostile from here.",
    cost: { wood: 20, stone: 15, water: 5 },
    requires: { rockAwakened: true },
    effect: { gatherBonus: 1 },
    onBuiltMessage:
      "You raise a small hut from gathered timber and stone. The wasteland is no longer empty.",
    whisperOnAvailable:
      "The stone whispers: shelter, warmth, a place to call your own. Build a hut.",
    whisperOnBuilt:
      "The stone whispers: there are skills to learn. Listen, and the world will open.",
  },

  firepit: {
    id: "firepit",
    name: "Fire Pit",
    icon: "🔥",
    description: "A ring of stones and a hollow of ember. The cold no longer rules you here.",
    cost: { wood: 8, stone: 10 },
    requires: { researched: "fire" },
    effect: { gatherBonus: 1 },
    onBuiltMessage:
      "You strike sparks until something catches. The fire watches you back.",
    whisperOnBuilt:
      "The stone whispers: the cold is no longer your master. What else will you ask of the world?",
  },
};

export const getBuilding = (id) => BUILDINGS[id] || null;
export const getAllBuildings = () => Object.values(BUILDINGS);
