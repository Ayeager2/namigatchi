// What gathering can yield, and at what rates.
// Three different tables based on rock state — gameplay phases shift the loot.
//
// Each entry has:
//   weight: relative chance vs other entries (raw numbers, not %)
//   kind:   "resource" | "nothing" | "rockFind"
//   id:     resource id (for "resource" kind only)
//   qty:    [min, max] inclusive (for "resource" kind only)

export const GATHER_TABLE = {
  // Pre-rock: basic resources + a tiny chance to find the rock.
  preRock: [
    { weight: 30, kind: "resource", id: "wood",  qty: [1, 2] },
    { weight: 30, kind: "resource", id: "stone", qty: [1, 2] },
    { weight: 30, kind: "resource", id: "water", qty: [1, 2] },
    { weight: 8,  kind: "nothing" },
    { weight: 2,  kind: "rockFind" },
  ],

  // Rock found, not yet awakened: basic resources + frequent fragment drops.
  postRockPreAwaken: [
    { weight: 25, kind: "resource", id: "wood",  qty: [1, 2] },
    { weight: 25, kind: "resource", id: "stone", qty: [1, 2] },
    { weight: 25, kind: "resource", id: "water", qty: [1, 2] },
    { weight: 5,  kind: "nothing" },
    { weight: 20, kind: "resource", id: "fragments", qty: [1, 1] },
  ],

  // Rock awakened: more generous resource yields.
  postAwaken: [
    { weight: 30, kind: "resource", id: "wood",  qty: [1, 3] },
    { weight: 30, kind: "resource", id: "stone", qty: [1, 3] },
    { weight: 30, kind: "resource", id: "water", qty: [1, 3] },
    { weight: 10, kind: "resource", id: "fragments", qty: [1, 1] },
  ],
};

// Era 0 milestone: how many fragments before the rock awakens.
export const FRAGMENTS_TO_AWAKEN = 10;
