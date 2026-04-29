// What gathering can yield, and at what rates.
// Three different tables based on rock state — gameplay phases shift the loot.
//
// Each entry has:
//   weight: relative chance vs other entries (raw numbers, not %)
//   kind:   "resource" | "nothing" | "rockFind"
//   id:     resource id (for "resource" kind only)
//   qty:    [min, max] inclusive (for "resource" kind only)
//
// Note: Food is NOT in any base table — it's added dynamically by the
// gathering system once Foraging research is complete. See systems/gathering.js.
//
// Water is intentionally rare (~8% of rolls) — the lore is a poisoned dead
// earth, and water is the limiting reagent for all major early-game unlocks
// (hut requires 5 water, foraging research requires 5 water).

export const GATHER_TABLE = {
  // Pre-rock: basic resources + a tiny chance to find the rock.
  preRock: [
    { weight: 38, kind: "resource", id: "wood",  qty: [1, 2] },
    { weight: 38, kind: "resource", id: "stone", qty: [1, 2] },
    { weight: 8,  kind: "resource", id: "water", qty: [1, 1] },
    { weight: 14, kind: "nothing" },
    { weight: 2,  kind: "rockFind" },
  ],

  // Rock found, not yet awakened: basic resources + frequent fragment drops.
  postRockPreAwaken: [
    { weight: 32, kind: "resource", id: "wood",  qty: [1, 2] },
    { weight: 32, kind: "resource", id: "stone", qty: [1, 2] },
    { weight: 8,  kind: "resource", id: "water", qty: [1, 1] },
    { weight: 5,  kind: "nothing" },
    { weight: 23, kind: "resource", id: "fragments", qty: [1, 1] },
  ],

  // Rock awakened: more generous wood/stone yields.
  postAwaken: [
    { weight: 38, kind: "resource", id: "wood",  qty: [1, 3] },
    { weight: 38, kind: "resource", id: "stone", qty: [1, 3] },
    { weight: 8,  kind: "resource", id: "water", qty: [1, 1] },
    { weight: 11, kind: "resource", id: "fragments", qty: [1, 1] },
    { weight: 5,  kind: "nothing" },
  ],
};

// Era 0 milestone: how many fragments before the rock awakens.
export const FRAGMENTS_TO_AWAKEN = 10;

// Additive entries injected by research/etc. when conditions are met.
// Keyed by the trigger condition (researched id, etc.).
export const GATHER_ADDITIONS = {
  foraging: { weight: 15, kind: "resource", id: "food", qty: [1, 2] },
};
