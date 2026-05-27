// What gathering can yield, and at what rates.
// Three different tables based on rock state — gameplay phases shift the loot.
//
// Each entry has:
//   weight: relative chance vs other entries (raw numbers, not %)
//   kind:   "resource" | "nothing" | "rockFind"
//   id:     resource id (for "resource" kind only)
//   qty:    [min, max] inclusive (for "resource" kind only)
//
// Food (grubs) appears in the base table at small weights once the rock is
// found — the wasteland is barren but not empty, and you can scratch up the
// occasional grub from rotting wood. Foraging research dramatically boosts
// the rate via GATHER_ADDITIONS — researching it is still the moment grubs
// become a reliable food source. This base presence prevents the player from
// being hard-walled out of tier-2 research (which costs grubs) when water is
// scarce and Foraging is hard to afford.
//
// Water is intentionally rare (~8% of rolls) — the lore is a poisoned dead
// earth, and water is the limiting reagent for all major early-game unlocks
// (hut requires 5 water, foraging research requires 5 water).

export const GATHER_TABLE = {
  // Pre-rock: BARREN. You're digging in dust with bare fingers.
  // Quantities are 1 and there's a high chance of nothing — every gather
  // should feel like effort, not reward. The wasteland yields slowly.
  preRock: [
    { weight: 32, kind: "resource", id: "wood",  qty: [1, 1] },
    { weight: 32, kind: "resource", id: "stone", qty: [1, 1] },
    { weight: 6,  kind: "resource", id: "water_stagnant", qty: [1, 1] },
    { weight: 28, kind: "nothing" },
    { weight: 2,  kind: "rockFind" },
  ],

  // Rock found, not yet awakened: a little better. You have purpose now.
  // Grubs at weight 4 — uncommon but findable. Foraging research multiplies
  // their availability later.
  postRockPreAwaken: [
    { weight: 30, kind: "resource", id: "wood",  qty: [1, 2] },
    { weight: 30, kind: "resource", id: "stone", qty: [1, 2] },
    { weight: 7,  kind: "resource", id: "water_stagnant", qty: [1, 1] },
    { weight: 4,  kind: "resource", id: "food",  qty: [1, 1] },
    { weight: 10, kind: "nothing" },
    { weight: 19, kind: "resource", id: "fragments", qty: [1, 1] },
  ],

  // Rock awakened: the world feels more generous. The earth gives more freely.
  // Grubs at weight 5 — slightly more frequent than pre-awakening.
  postAwaken: [
    { weight: 36, kind: "resource", id: "wood",  qty: [1, 3] },
    { weight: 36, kind: "resource", id: "stone", qty: [1, 3] },
    { weight: 8,  kind: "resource", id: "water_stagnant", qty: [1, 1] },
    { weight: 5,  kind: "resource", id: "food",  qty: [1, 1] },
    { weight: 11, kind: "resource", id: "fragments", qty: [1, 1] },
    { weight: 4,  kind: "nothing" },
  ],
};

// Era 0 milestone: how many fragments before the rock awakens.
export const FRAGMENTS_TO_AWAKEN = 10;

// Additive entries injected by research/etc. when conditions are met.
// Keyed by the trigger condition (researched id, etc.).
export const GATHER_ADDITIONS = {
  foraging: { weight: 15, kind: "resource", id: "food", qty: [1, 2] },
};
