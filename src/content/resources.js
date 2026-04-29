// Resource definitions — DATA, not code.
// Adding a resource = new entry here. No code changes needed elsewhere.
// Eventually this will be one of many content files; for now it's enough.

export const RESOURCES = {
  wood: {
    id: "wood",
    name: "Wood",
    icon: "🪵",
    description: "Splintered remnants of dead trees.",
  },
  stone: {
    id: "stone",
    name: "Stone",
    icon: "🪨",
    description: "Cracked, weathered rock from the wasteland.",
  },
  water: {
    id: "water",
    name: "Water",
    icon: "💧",
    description: "Whatever moisture the dead earth still holds.",
  },
  fragments: {
    id: "fragments",
    name: "Fragments",
    icon: "✨",
    description: "Shimmering shards of something not-quite-of-this-world.",
  },
};

export const getResource = (id) => RESOURCES[id] || null;
export const getAllResources = () => Object.values(RESOURCES);
