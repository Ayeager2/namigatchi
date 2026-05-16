import { THREATS } from "./src/content/threats.js";
import { rollThreatEncounter } from "./src/systems/threats.js";

const baseRun = {
  rockFound: true, rockAwakened: true,
  built: { hut: {}, firepit: {}, forge: {}, home: {} },
  researched: { foraging: true, fire: true, knapping: true, smithing: true, fletching: true },
  toolsCrafted: { bow: { count: 1 } },
  inventory: { fragments: 50, water: 50, wood: 50, food: 50 },
  stats: { hunger: 0, thirst: 0, energy: 100, hp: 80, happiness: 50, sanity: 50, spirit: 80 },
  spellCooldowns: {}, gatherCount: 10, log: [],
};

const state = { run: baseRun };

// Stateful rng: first call returns 0.5 (skips Scavenger at 0.07), second
// returns 0.01 (under Whisperer's 0.04 → fires).
function makeRng(seq) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

// First: skip scavenger (0.5 > 0.07), then fire whisperer (0.01 < 0.04),
// then any further rng calls just return 0 (for substitution lookups).
const result = rollThreatEncounter(state, makeRng([0.5, 0.01, 0, 0, 0]));
if (!result || result.threatId !== "whisperer") {
  console.error("FAIL: Whisperer did not fire; got:", result?.threatId || "null");
  process.exit(1);
}
const sanityBefore = state.run.stats.sanity;
const sanityAfter = result.stats.sanity;
const drained = sanityBefore - sanityAfter;
if (drained < 3 || drained > 5) {
  console.error(`FAIL: Whisperer should drain 3-5 sanity, got ${drained}`);
  process.exit(1);
}
console.log(`OK  : Whisperer fires at era 3 and drains ${drained} sanity`);

// Verify defense doesn't reduce sanity drain.
const defendedRun = { ...baseRun, researched: { ...baseRun.researched, vigilance: true } };
const r2 = rollThreatEncounter({ run: defendedRun }, makeRng([0.5, 0.01, 0, 0, 0]));
const drainedDefended = defendedRun.stats.sanity - r2.stats.sanity;
if (drainedDefended < 3 || drainedDefended > 5) {
  console.error(`FAIL: Defense should not reduce sanityDrain, got ${drainedDefended}`);
  process.exit(1);
}
console.log(`OK  : Defense doesn't reduce Whisperer sanity drain (still ${drainedDefended})`);

console.log("\nWhisperer threat tests passed.");
