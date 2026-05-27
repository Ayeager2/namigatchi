// Resource definitions — DATA, not code.

import { TOOLS } from "./tools.js";

export const RESOURCE_CATEGORIES = {
  materials:     { id: "materials",     name: "Materials",         order: 1 },
  drink:         { id: "drink",         name: "Drink",             order: 2 },
  food:          { id: "food",          name: "Food",              order: 3 },
  tool:          { id: "tool",          name: "Tools",             order: 4 },
  // Craft materials are intermediate products — crafted from raw materials,
  // then consumed by *other* crafts or by Arcane Studies. Scrolls and ink
  // are the seed of this category (see ERA_PLAN.md "Arcane Studies").
  craftMaterial: { id: "craftMaterial", name: "Craft Materials",   order: 4.5 },
  fragment:      { id: "fragment",      name: "Arcane",            order: 5 },
  mystic:        { id: "mystic",        name: "Mystic",            order: 6 },
  unknown:       { id: "unknown",       name: "Unknown",           order: 99 },
};

// The set of resource ids that represent drinkable water, ordered from
// worst to best. Used by the virtual-water cost helper (see
// totalWater/spendWater in this file) and by DrinkButton.
//
// Tier ladder (Era 1–2 vertical slice — Era 3+ tiers Filtered/Purified/Beer
// come later, see ERA_PLAN.md "Water tiers + dysentery"):
//   water_stagnant — what you scoop from gathering puddles. Risky.
//   water_muddy    — Water Hole production. Less risky.
//   water_boiled   — fire + boiling research. Clean.
export const WATER_TIERS = ["water_stagnant", "water_muddy", "water_boiled"];

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
  // ─── Drink tier ladder ─────────────────────────────────────────────────
  //
  // `thirstRelief` — how much thirst the drink removes (lower thirst = better;
  //                  these values are passed straight to applyEffect as a
  //                  negative thirst delta).
  // `dysenteryChance` — probability (0..1) that drinking this tier triggers
  //                     the dysentery status. Rolled in performDrink.
  // `tier` — 1 = stagnant, 2 = muddy, 3 = boiled. DrinkButton sorts by tier
  //          for the "best available" auto-select.
  //
  // Stagnant and muddy water spoil — the dust gets in, things grow. Boiled
  // water is stable. (Era 3+ tiers Filtered/Purified will also be stable.)
  water_stagnant: {
    id: "water_stagnant",
    name: "Stagnant Water",
    icon: "🩸",
    category: "drink",
    description:
      "Whatever you scooped from a puddle or hollow. The taste is the taste of the dust. Drinkable, but the body remembers.",
    baseCap: 20,
    thirstRelief: 20,
    dysenteryChance: 0.25,
    tier: 1,
    spoilage: { perMinute: 0.15, atCapMultiplier: 3 },
  },

  water_muddy: {
    id: "water_muddy",
    name: "Muddy Water",
    icon: "💧",
    category: "drink",
    description:
      "From the Water Hole — sediment-streaked, but cool. Better than the puddle. Not by enough.",
    baseCap: 20,
    thirstRelief: 35,
    dysenteryChance: 0.1,
    tier: 2,
    spoilage: { perMinute: 0.08, atCapMultiplier: 3 },
  },

  water_boiled: {
    id: "water_boiled",
    name: "Boiled Water",
    icon: "🫖",
    category: "drink",
    description:
      "Driven over fire until whatever lived in it does not. Clean enough that the body answers.",
    baseCap: 15,
    thirstRelief: 50,
    dysenteryChance: 0.02,
    tier: 3,
    // Boiled water doesn't spoil — the fire took out what spoils it.
  },
  fragments: {
    id: "fragments",
    name: "Arcane Shards",
    icon: "✨",
    category: "fragment",
    description: "Pieces of a thing that broke, and remembers being whole. They hum against the skin and dim against your pulse. They are the fuel of every spell.",
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
    nutrition: 3,
    tier: 1,
    description: "Pale, wriggling. They squirm in the palm. Better than nothing. Barely.",
    baseCap: 15,
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

  // ─── Craft materials (Era 2+) ──────────────────────────────────────────
  //
  // Intermediate goods crafted from raw resources, then consumed by *other*
  // crafts or by Arcane Studies (timed magic study at the Stone Altar — see
  // ERA_PLAN.md "Arcane Studies"). Hidden until the player has researched
  // altarWork, so they don't clutter the inventory pre-Era-2.
  //
  // No spoilage — parchment and ink keep.
  scroll: {
    id: "scroll",
    name: "Scroll",
    icon: "📜",
    category: "craftMaterial",
    description:
      "Rolled parchment of beaten wood-fiber. Blank until something is written on it. The Stone says: write what I tell you, and the world will listen.",
    baseCap: 10,
    hiddenUntil: { researched: "altarWork" },
    hiddenName: "???",
    hiddenIcon: "❓",
    hiddenDescription: "A material you don't yet know how to make.",
    hiddenCategory: "unknown",
  },

  ink: {
    id: "ink",
    name: "Ink",
    icon: "🖋️",
    category: "craftMaterial",
    description:
      "Char and crushed grub-dark, mixed to a sluggish black. It thinks slower than you. That's the point.",
    baseCap: 10,
    hiddenUntil: { researched: "altarWork" },
    hiddenName: "???",
    hiddenIcon: "❓",
    hiddenDescription: "A material you don't yet know how to make.",
    hiddenCategory: "unknown",
  },
};

export const getResource = (id) => RESOURCES[id] || null;
export const getAllResources = () => Object.values(RESOURCES);
export const getResourcesByCategory = (category) =>
  getAllResources().filter((r) => r.category === category);

// ─── Virtual-water cost helpers ────────────────────────────────────────────
//
// Buildings, research, tools, and survival actions all carry `cost: { water: N }`
// in their data. With the tier ladder (water_stagnant / water_muddy /
// water_boiled), there is no longer a single `water` resource — so the cost
// key "water" becomes *virtual* and resolves to "any N units across the
// tier ladder."
//
// Spending order: lowest tier first. Save the good water for drinking; let
// builds and research drain the muddy/stagnant. The player can always
// override their drink preference, but they shouldn't have to micromanage
// what tier their hut cost.
//
// Used by canBuild, canListen, canCraft, canPerformSurvivalAction, and the
// corresponding perform* functions.

export function totalWater(inventory) {
  let n = 0;
  for (const id of WATER_TIERS) n += inventory?.[id] || 0;
  return n;
}

// Returns a NEW inventory with `qty` units of water drained from the
// lowest tiers first. Caller is responsible for verifying total >= qty
// (via totalWater) before calling.
export function spendWater(inventory, qty) {
  const out = { ...(inventory || {}) };
  let remaining = qty;
  for (const id of WATER_TIERS) {
    if (remaining <= 0) break;
    const have = out[id] || 0;
    if (have <= 0) continue;
    const take = Math.min(have, remaining);
    out[id] = have - take;
    remaining -= take;
  }
  return out;
}

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
