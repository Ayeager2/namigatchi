// What hunting can yield, and at what rates.
// Hunting is the second active gathering loop in Era 1, gated behind owning
// a Net (or Snare). Drop weights start tilted heavily toward grubs and
// nothing — at level 0 the player IS bad at this, and the wasteland's birds
// are quick. As Hunting skill levels up, weights shift toward birds.
//
// Each entry has:
//   weight: base relative chance vs other entries
//   kind:   "resource" | "nothing"
//   id:     resource id (for "resource" kind only)
//   qty:    [min, max] inclusive (for "resource" kind only)
//   tag:    "bird" | "grub" | null  — used by the hunting system to apply
//           skill-based weight modifications (more birds at higher skill)
//
// The tags let the hunting system shift weights without rewriting the table:
// huntBirdWeightBonus from skills/tools adds to entries tagged "bird";
// huntNothingWeightReduction subtracts from "nothing"; etc.
//
// Tuning philosophy: at level 0, ~40% of hunts return nothing or grubs
// (cheap consolation). Bird drops climb meaningfully by level 5; level 10+
// makes hunting reliably productive. Feathers always trail bird_meat — they
// can also drop solo on a "graze" outcome (nicked one).

export const HUNT_TABLE = {
  // The base table — weights modulated by skill level + owned tools at runtime.
  // See systems/hunting.js for the modifier logic.
  base: [
    { weight: 28, kind: "nothing", tag: "nothing" },
    { weight: 38, kind: "resource", id: "food",      qty: [1, 2], tag: "grub" },
    { weight: 22, kind: "resource", id: "bird_meat", qty: [1, 1], tag: "bird" },
    { weight: 8,  kind: "resource", id: "feathers",  qty: [1, 2], tag: "bird" },
    { weight: 4,  kind: "resource", id: "feathers",  qty: [1, 1], tag: "graze" },
  ],
};

// Hunt pacing constants. The system's getHuntCooldownMs reads these and
// applies skill/tool reductions on top.
export const HUNT_CONFIG = {
  // Initial cooldown — a full eight seconds. You suck at hunting. Stalking
  // takes time. Failed strikes take longer. Recovery between attempts is
  // real. The whole rhythm is intentionally slower than gathering.
  baseCooldownMs: 8000,
  // Floor — even at max skill + best tools, hunts shouldn't be spammable.
  // The point is that hunting is a deliberate, energy-expensive choice.
  minCooldownMs: 2500,
  // Energy gate. Hunting is brutal; you need actual energy to attempt it.
  minEnergyToHunt: 40,
  // Bonus thirst spike on successful bird drops (you sprinted, you wrestled).
  bonusThirstOnBird: 2,
};
