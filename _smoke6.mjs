import * as dev from "./src/systems/dev.js";
import { computeEra } from "./src/systems/era.js";

const assert = (cond, msg) => {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; }
  else console.log("OK  :", msg);
};

const empty = {
  run: {
    rockFound: false, rockAwakened: false, built: {}, researched: {},
    toolsCrafted: {}, inventory: {}, stats: {}, alignment: { good: 0, evil: 0 },
    spellCooldowns: {}, statuses: {}, log: [],
  },
  persistent: { lifetimeStats: {} },
};

// === Era jumps ===
const e1 = dev.devJumpToEra1(empty);
assert(computeEra({ run: e1.run }) === 1, `devJumpToEra1 → era 1 (got ${computeEra({ run: e1.run })})`);

const e2 = dev.devJumpToEra2(empty);
assert(computeEra({ run: e2.run }) === 2, `devJumpToEra2 → era 2 (got ${computeEra({ run: e2.run })})`);

const e3 = dev.devJumpToEra3(empty);
assert(computeEra({ run: e3.run }) === 3, `devJumpToEra3 → era 3 (got ${computeEra({ run: e3.run })})`);

// === Unlock all variants ===
const unlock1 = dev.devUnlockAll(empty);
assert(computeEra({ run: unlock1.run }) >= 1, "devUnlockAll → era >= 1");
const unlock2 = dev.devUnlockAllEra2(empty);
assert(computeEra({ run: unlock2.run }) >= 2, "devUnlockAllEra2 → era >= 2");
const unlock3 = dev.devUnlockAllEra3(empty);
assert(computeEra({ run: unlock3.run }) >= 3, "devUnlockAllEra3 → era >= 3");
assert(unlock3.run.inventory.fragments === 999, "devUnlockAllEra3 gave 999 fragments");

// === Alignment ===
const setGood = dev.devSetAlignment(empty, "good", 5);
assert(setGood.run.alignment.good === 5 && setGood.run.alignment.evil === 0, "setAlignment good 5");

const setEvil = dev.devSetAlignment(empty, "evil", 10);
assert(setEvil.run.alignment.evil === 10 && setEvil.run.alignment.good === 0, "setAlignment evil 10");

const reset = dev.devSetAlignment(setGood, "neutral", 0);
assert(reset.run.alignment.good === 0 && reset.run.alignment.evil === 0, "setAlignment neutral resets");

// === Spell cooldowns ===
const withCD = { ...empty, run: { ...empty.run, spellCooldowns: { mendingWord: Date.now() + 60000 } } };
const cleared = dev.devClearSpellCooldowns(withCD);
assert(Object.keys(cleared.run.spellCooldowns).length === 0, "Spell cooldowns cleared");

// === Statuses ===
const warded = dev.devApplyStatus(empty, "warded", 60);
assert(warded.run.statuses.warded.until > Date.now(), "Warded status applied");
const cleared2 = dev.devApplyStatus(warded, "warded", 0);
assert(!cleared2.run.statuses.warded, "Warded status cleared with duration 0");

// === Force threat ===
const era3Run = {
  run: {
    ...e3.run,
    inventory: { ...e3.run.inventory, food: 50 },
    stats: { hp: 100, hunger: 0, thirst: 0, energy: 100, happiness: 100, sanity: 100, spirit: 100 },
    gatherCount: 10,
  },
  persistent: { lifetimeStats: {} },
};
const forced = dev.devForceThreat(era3Run, "whisperer");
assert(forced.run, "devForceThreat returns run state");
assert(Array.isArray(forced.events) && forced.events.length > 0, "devForceThreat returns events");
const sanLost = era3Run.run.stats.sanity - forced.run.stats.sanity;
assert(sanLost >= 3 && sanLost <= 5, `Forced Whisperer drained 3-5 sanity (got ${sanLost})`);

const badThreat = dev.devForceThreat(era3Run, "nonexistent");
assert(!badThreat.run && badThreat.msg.includes("not found"), "Unknown threat handled gracefully");

console.log("\nAll dev panel slice smoke tests passed.");
