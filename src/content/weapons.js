// Weapon definitions — DATA, not code.
//
// Weapons are equippable items the player wields in their hand or ranged
// slots (see systems/equipment.js for slot rules). They carry `weaponStats`
// that combat resolution (Task #33) will read for damage / accuracy / crit
// rolls. Phase 1 (this file): defs + DUAL-USE pattern only — combat math
// itself comes in Phase 2.
//
// See ERA_PLAN.md "Combat + Weapons + Specialized Skills" for the design.
//
// ─── DUAL-USE pattern (locked decision 2026-05) ────────────────────────
//
// Items with BOTH tool-effects AND weaponStats are dual-use. Equipping a
// Stone Axe (`stoneAxe` in tools.js) puts it in your hand slot — its
// `weaponStats` apply when you fight, its tool `effect` (gather bonus)
// still applies because you're holding it.
//
// Tools that get dual-use stats live in `tools.js` (their craft path is
// already wired there). This file holds PURE weapons — items whose only
// purpose is combat. Same craft / inventory system; just split by intent.
//
// ─── Subfamily pattern ─────────────────────────────────────────────────
//
// Same family (e.g. axe) can split into subfamilies with different stat
// distributions:
//   Hatchet (stoneAxe in tools.js)  — wood-leaning, modest combat
//   Battle Axe (battleAxe, future)  — combat-leaning, modest woodBonus
// Same skill (`woodcutting` for the chop, `swordplay` for the swing).
// The math tells the player why their pickaxe makes a bad sword.

// ─── Weapon shape ─────────────────────────────────────────────────────
//
//   id, name, icon
//   category: "primitive" | "bronze" | "iron" | "arcane"
//   type:     "melee" | "ranged" | "two-handed"  — slot routing
//   subfamily: "club" | "spear" | "mace" | "axe" | "sword" | "knife" |
//              "pickaxe" | "bow" | "throwing"  — skill + tool-pair tag
//
//   weaponStats: { damage: [min, max], acc, crit }
//   durability:  { max, wearsOn: "combat" }
//   cost, requires, tier, col
//   onCraftedMessage, onBrokenMessage
//
// Future fields (Phase 3+):
//   xpToLevel: [n1, n2, ...]
//   levelBonus: { damage: +n/lvl, crit: +0.01/lvl }
//   enchantSlots: 0/1/2/3

export const WEAPON_CATEGORIES = {
  primitive: { id: "primitive", name: "Primitive", order: 1 },
  bronze:    { id: "bronze",    name: "Bronze",    order: 2 },
  iron:      { id: "iron",      name: "Iron",      order: 3 },
  arcane:    { id: "arcane",    name: "Arcane",    order: 4 },
};

export const WEAPONS = {
  // ─── Tier 1 — Primitive melee ──────────────────────────────────────

  woodenClub: {
    id: "woodenClub",
    name: "Wooden Club",
    icon: "🥢",
    category: "primitive",
    type: "melee",
    subfamily: "club",
    description:
      "A hardwood length, rough at one end, weighted at the other. The first weapon — barely a weapon. You hit with it and it hits back into your wrist.",
    weaponStats: { damage: [2, 4], acc: 0.7, crit: 0.02 },
    durability: { max: 20, wearsOn: "combat" },
    cost: { wood: 6, stone: 1 },
    requires: {},
    effectSummary: "Damage 2–4 · Acc 70% · Crit 2% · 20 swings.",
    onCraftedMessage: "🥢 You shape the club. It's not much. It's something.",
    onBrokenMessage: "🥢 The club splinters on a hard strike.",
    tier: 1, col: 0,
  },

  stoneSpear: {
    id: "stoneSpear",
    name: "Stone Spear",
    icon: "🗡️",
    category: "primitive",
    type: "melee",
    subfamily: "spear",
    description:
      "A knapped stone point bound to a hardwood haft. The first reach you've had. The bird falls before it knows you stood up.",
    weaponStats: { damage: [3, 7], acc: 0.82, crit: 0.04 },
    durability: { max: 30, wearsOn: "combat" },
    cost: { wood: 8, stone: 5 },
    requires: { researched: "knapping" },
    effectSummary: "Damage 3–7 · Acc 82% · Crit 4% · 30 thrusts.",
    onCraftedMessage: "🗡️ You bind the point to the shaft. Heavy. Reaches farther than your arm did.",
    onBrokenMessage: "🗡️ The point cracks free of the haft. Time for a new one.",
    tier: 1, col: 1,
  },

  stoneMace: {
    id: "stoneMace",
    name: "Stone Mace",
    icon: "🔨",
    category: "primitive",
    type: "melee",
    subfamily: "mace",
    description:
      "A weighty stone bound to a heavy haft. No edge — just mass meeting bone. You don't slice things; you stop them.",
    weaponStats: { damage: [4, 8], acc: 0.65, crit: 0.06 },
    durability: { max: 25, wearsOn: "combat" },
    cost: { wood: 6, stone: 10 },
    requires: { researched: "knapping" },
    effectSummary: "Damage 4–8 · Acc 65% · Crit 6% · 25 swings.",
    onCraftedMessage: "🔨 You bind the stone-head. It is heavier than you thought. Good.",
    onBrokenMessage: "🔨 The haft cracks where the stone meets the wood.",
    tier: 1, col: 2,
  },
};

export const getWeapon = (id) => WEAPONS[id] || null;
export const getAllWeapons = () => Object.values(WEAPONS);
