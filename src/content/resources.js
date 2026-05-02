// Resource definitions — DATA, not code.
// Adding a resource = new entry here. No code changes needed elsewhere.

import { TOOLS } from "./tools.js";

export const RESOURCE_CATEGORIES = {
  materials: { id: "materials", name: "Materials", order: 1 },
  food:      { id: "food",      name: "Food",      order: 2 },
  tool:      { id: "tool",      name: "Tools",     order: 3 },
  fragment:  { id: "fragment",  name: "Arcane",    order: 4 },
  mystic:    { id: "mystic",    name: "Mystic",    order: 5 },
  unknown:   { id: "unknown",   name: "Unknown",   order: 99 },
};

// Storage caps:
//   baseCap: number — default storage limit before any building bonuses.
//                     Omit to mark as uncapped (fragments, tools).
//   spoilage:        — food-only. Resource decays over real time.
//     perMinute: number  — natural spoilage rate (units lost per minute).
//     atCapMultiplier: number — multiplier when held at or above cap.

export const RESOURCES = {
  wood: {
    id: "wood",
    name: "Wood",
    icon: "🪵",
    category: "materials",
    description: "Splintered remnants of dead trees.",
    baseCap: 50,
  },
  stone: {
    id: "stone",
    name: "Stone",
    icon: "🪨",
    category: "materials",
    description: "Cracked, weathered rock from the wasteland.",
    baseCap: 50,
  },
  water: {
    id: "water",
    name: "Water",
    icon: "💧",
    category: "materials",
    description: "Whatever moisture the dead earth still holds.",
    baseCap: 20,
  },
  fragments: {
    id: "fragments",
    name: "Fragments",
    icon: "✨",
    category: "fragment",
    description: "Shimmering shards of something not-quite-of-this-world.",
    // Mystical — does not follow physical storage rules. Omit baseCap.
    hiddenUntil: { researched: "arcaneAwakening" },
    hiddenName: "???",
    hiddenIcon: "❓",
    hiddenDescription: "Strange shards. They hum against the skin.",
    hiddenCategory: "unknown",
  },

  food: {
    id: "food",
    name: "Grubs",
    icon: "🪱",
    category: "food",
    nutrition: 10,
    tier: 1,
    description: "Pale, wriggling. They squirm in the palm. Better than nothing. Barely.",
    baseCap: 15,
    // Grubs spoil slowly normally, fast when stockpiled past cap.
    spoilage: { perMinute: 0.2, atCapMultiplier: 4 },
  },

  bird_meat: {
    id: "bird_meat",
    name: "Bird Meat",
    icon: "🍗",
    category: "food",
    nutrition: 22,
    tier: 2,
    description: "Stringy, dark, faintly metallic. The first warm meal in a long time.",
    baseCap: 10,
    // Meat spoils faster than grubs — no preservation yet.
    spoilage: { perMinute: 0.4, atCapMultiplier: 5 },
  },

  feathers: {
    id: "feathers",
    name: "Feathers",
    icon: "🪶",
    category: "materials",
    description: "Stiff vanes still flecked with old blood. Light. Useful, somehow.",
    baseCap: 30,
  },
};

export const getResource = (id) => RESOURCES[id] || null;
export const getAllResources = () => Object.values(RESOURCES);
export const getResourcesByCategory = (category) =>
  getAllResources().filter((r) => r.category === category);

export function isResourceHidden(state, resource) {
  const h = resource.hiddenUntil;
  if (!h) return false;
  if (h.researched && !state.run.researched?.[h.researched]) return true;
  if (h.built && !state.run.built?.[h.built]) return true;
  return false;
}

export function getDisplayResource(state, resource) {
  if (!resource) return null;
  if (isResourceHidden(state, resource)) {
    return {
      ...resource,
      name: resource.hiddenName || "???",
      icon: resource.hiddenIcon || "❓",
      description: resource.hiddenDescription || "Unknown.",
      _displayCategory: resource.hiddenCategory || "unknown",
    };
  }
  return { ...resource, _displayCategory: resource.category };
}

export function getInventoryItem(state, id) {
  const res = getResource(id);
  if (res) {
    const displayed = getDisplayResource(state, res);
    return { kind: "resource", id, raw: res, displayed };
  }
  const tool = TOOLS[id];
  if (tool) {
    return {
      kind: "tool",
      id,
      raw: tool,
      displayed: { ...tool, _displayCategory: "tool" },
    };
  }
  return null;
}
