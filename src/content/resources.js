// Resource definitions — DATA, not code.
// Adding a resource = new entry here. No code changes needed elsewhere.
//
// Each resource has:
//   id, name, icon, description       — basic identity
//   category                            — grouping for game logic
//                                         (basic | food | fragment | tool | mystic)
//   nutrition (food only)               — hunger reduction when consumed
//   tier (food only)                    — quality tier; higher = better food
//
// CATEGORIES:
//   materials — wood, stone, water (core gather resources)
//   food      — anything that can be eaten (grubs, berries, meat, etc.)
//   fragment  — magical shards (special role in awakening + future arcane)
//   tool      — crafted tools (added in Era 2)
//   mystic    — Era 3+ magical resources

// Display metadata for resource categories. Used by the inventory panel to
// group items into collapsible sections.
//
// Note: "unknown" is the catchall for resources whose true nature hasn't been
// revealed yet (see resource.hiddenUntil). Order 99 places it at the bottom.
export const RESOURCE_CATEGORIES = {
  materials: { id: "materials", name: "Materials", order: 1 },
  food:      { id: "food",      name: "Food",      order: 2 },
  tool:      { id: "tool",      name: "Tools",     order: 3 },
  fragment:  { id: "fragment",  name: "Arcane",    order: 4 },
  mystic:    { id: "mystic",    name: "Mystic",    order: 5 },
  unknown:   { id: "unknown",   name: "Unknown",   order: 99 },
};

export const RESOURCES = {
  wood: {
    id: "wood",
    name: "Wood",
    icon: "🪵",
    category: "materials",
    description: "Splintered remnants of dead trees.",
  },
  stone: {
    id: "stone",
    name: "Stone",
    icon: "🪨",
    category: "materials",
    description: "Cracked, weathered rock from the wasteland.",
  },
  water: {
    id: "water",
    name: "Water",
    icon: "💧",
    category: "materials",
    description: "Whatever moisture the dead earth still holds.",
  },
  fragments: {
    id: "fragments",
    name: "Fragments",
    icon: "✨",
    category: "fragment",
    description: "Shimmering shards of something not-quite-of-this-world.",
    // Until the player learns what these are (a future research like
    // "arcaneAwakening"), they appear in the Unknown section as ??? and
    // their true nature is hidden.
    hiddenUntil: { researched: "arcaneAwakening" },
    hiddenName: "???",
    hiddenIcon: "❓",
    hiddenDescription: "Strange shards. They hum against the skin.",
    hiddenCategory: "unknown",
  },

  // Food — kept under the legacy id "food" for save backward-compat, but
  // displayed and described as Grubs. Survival food at first is shit.
  food: {
    id: "food",
    name: "Grubs",
    icon: "🪱",
    category: "food",
    nutrition: 10,
    tier: 1,
    description:
      "Pale, wriggling. They squirm in the palm. Better than nothing. Barely.",
  },

  // Bird meat — better food than grubs. Unlocked by hunting (which itself is
  // unlocked by Net Weaving research + a crafted Net). The first food the
  // player gets that actually feels like a meal.
  bird_meat: {
    id: "bird_meat",
    name: "Bird Meat",
    icon: "🍗",
    category: "food",
    nutrition: 22,
    tier: 2,
    description:
      "Stringy, dark, faintly metallic. The first warm meal in a long time.",
  },

  // Feathers — non-food material. Drops from successful bird hunts. Used in
  // future research (Fletching → arrows → ranged hunts). For now, a token of
  // mastery that accumulates on the way to the next tier.
  feathers: {
    id: "feathers",
    name: "Feathers",
    icon: "🪶",
    category: "materials",
    description:
      "Stiff vanes still flecked with old blood. Light. Useful, somehow.",
  },

  // ============== Future food (placeholders, ungated by anything yet) ==============
  // Uncomment / add real research gating when the relevant teachings exist.
  //
  // berries: {
  //   id: "berries", name: "Berries", icon: "🫐",
  //   category: "food", nutrition: 18, tier: 2,
  //   description: "Bitter, dust-coated, but sweet at the core.",
  // },
  // roastedGrubs: {
  //   id: "roastedGrubs", name: "Roasted Grubs", icon: "🍢",
  //   category: "food", nutrition: 22, tier: 2,
  //   description: "Cooked over fire. Crisper. Less wriggly. More filling.",
  // },
};

export const getResource = (id) => RESOURCES[id] || null;
export const getAllResources = () => Object.values(RESOURCES);
export const getResourcesByCategory = (category) =>
  getAllResources().filter((r) => r.category === category);

// Whether a resource's true identity is still hidden from the player.
// Currently checks: requires.researched. Extend with more conditions as
// reveal mechanics grow.
export function isResourceHidden(state, resource) {
  const h = resource.hiddenUntil;
  if (!h) return false;
  if (h.researched && !state.run.researched?.[h.researched]) return true;
  if (h.built && !state.run.built?.[h.built]) return true;
  return false;
}

// Returns the resource as it should be displayed right now (true identity
// or hidden form). Use this for any UI rendering. Logic systems should still
// look at the real `category` and `id` of the resource directly.
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

// Unified inventory lookup. Inventory ids may resolve to either a resource
// or a crafted tool. Returns a normalized display shape with id/name/icon/
// category — the InventoryPanel doesn't need to know which kind it is.
//
// tools.js does not import from this file, so this static import is safe
// (unidirectional dependency).
import { TOOLS } from "./tools.js";

export function getInventoryItem(state, id) {
  // First try resources.
  const res = getResource(id);
  if (res) {
    const displayed = getDisplayResource(state, res);
    return {
      kind: "resource",
      id,
      raw: res,
      displayed,
    };
  }
  // Fall through to tools.
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
