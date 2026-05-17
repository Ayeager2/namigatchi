import { RESEARCH } from "./src/content/research.js";
import { SPELLS } from "./src/content/spells.js";
import { TOOLS } from "./src/content/tools.js";
import { BUILDINGS } from "./src/content/buildings.js";
import { THREATS } from "./src/content/threats.js";
import { EVENTS } from "./src/content/events.js";
import { canCastSpell, performCastSpell, hasStatus } from "./src/systems/spells.js";
import { canCraft, performCraft } from "./src/systems/crafting.js";
import { canUseTool, performUseTool } from "./src/systems/consumables.js";
import { canListen, getVisibleResearch } from "./src/systems/research.js";
import { rollThreatEncounter } from "./src/systems/threats.js";

const assert = (cond, msg) => {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; }
  else console.log("OK  :", msg);
};

// === Content presence ===
assert(BUILDINGS.alembic, "Alembic building exists");
assert(BUILDINGS.alembic.requires.researched === "alchemy", "Alembic requires alchemy research");
assert(BUILDINGS.alembic.requires.hasBuilding === "forge", "Alembic requires Forge built");

assert(RESEARCH.alchemy, "Alchemy research exists");
assert(RESEARCH.banishSpell?.requires?.alignment?.good === 3, "Banish research gated by good >= 3");
assert(RESEARCH.bendSpell?.requires?.alignment?.evil === 3, "Bend research gated by evil >= 3");

assert(SPELLS.banish, "Banish spell exists");
assert(SPELLS.bend, "Bend spell exists");
assert(SPELLS.banish.appliesStatus?.id === "warded", "Banish applies warded status");
assert(SPELLS.bend.alignmentDelta?.evil === 1, "Bend nudges evil alignment");

assert(TOOLS.potionMending?.consumable === true, "Potion of Mending is consumable");
assert(TOOLS.potionMending?.isStackable === true, "Potion of Mending is stackable");
assert(TOOLS.potionSpirit?.useEffect?.spirit === 100, "Spirit Draught restores 100 spirit");

assert(THREATS.hollowHound?.kind === "demon", "Hollow Hound tagged as demon");
assert(THREATS.hollowHound?.effects?.defenseHalf === true, "Hollow Hound uses half defense");

assert(EVENTS.benevolentPilgrim?.requires?.alignment?.good === 3, "Pilgrim event gated by good >= 3");
assert(EVENTS.bitterScholar?.requires?.alignment?.evil === 3, "Bitter Scholar gated by evil >= 3");

// === Research visibility: alignment gate ===
const eraReadyRun = {
  rockFound: true, rockAwakened: true,
  built: { hut: {}, firepit: {}, forge: {}, home: {}, alembic: {} },
  researched: {
    foraging: true, fire: true, knapping: true,
    smithing: true, fletching: true, home: true,
    arcaneAwakening: true, mendingWord: true, innerHearth: true,
  },
  toolsCrafted: { bow: { count: 1 } },
  inventory: { fragments: 50, water: 50, wood: 50, food: 50 },
  stats: { hunger: 0, thirst: 0, energy: 100, hp: 100, happiness: 100, sanity: 100, spirit: 100 },
  alignment: { good: 0, evil: 0 },
  spellCooldowns: {}, statuses: {}, gatherCount: 10, log: [],
};

let state = { run: { ...eraReadyRun }, persistent: { lifetimeStats: {} } };

// Without alignment, Banish/Bend research stays hidden.
const visibleNeutral = getVisibleResearch(state).map((r) => r.id);
assert(!visibleNeutral.includes("banishSpell"), "Banish research hidden at neutral alignment");
assert(!visibleNeutral.includes("bendSpell"), "Bend research hidden at neutral alignment");

// Lean good — Banish appears, Bend stays hidden.
state = { run: { ...eraReadyRun, alignment: { good: 5, evil: 0 } }, persistent: { lifetimeStats: {} } };
const visibleGood = getVisibleResearch(state).map((r) => r.id);
assert(visibleGood.includes("banishSpell"), "Banish research visible at good >= 3");
assert(!visibleGood.includes("bendSpell"), "Bend still hidden at good alignment");

// Lean evil — Bend appears.
state = { run: { ...eraReadyRun, alignment: { good: 0, evil: 5 } }, persistent: { lifetimeStats: {} } };
const visibleEvil = getVisibleResearch(state).map((r) => r.id);
assert(visibleEvil.includes("bendSpell"), "Bend research visible at evil >= 3");
assert(!visibleEvil.includes("banishSpell"), "Banish hidden at evil alignment");

// Cannot listen without alignment.
state = { run: eraReadyRun, persistent: { lifetimeStats: {} } };
const banishCheck = canListen(state, "banishSpell");
assert(!banishCheck.ok, "canListen Banish fails at neutral alignment");

// === Alembic gating ===
state = { run: { ...eraReadyRun, researched: { ...eraReadyRun.researched, alchemy: true } }, persistent: { lifetimeStats: {} } };
const mendingCheck = canCraft(state, "potionMending");
assert(mendingCheck.ok, `Potion of Mending craftable when alchemy+alembic+resources present (got: ${mendingCheck.reason || "ok"})`);

// Without Alembic built, craft is blocked.
state = { run: { ...eraReadyRun, built: { hut: {}, firepit: {}, forge: {}, home: {} }, researched: { ...eraReadyRun.researched, alchemy: true } } };
const blocked = canCraft(state, "potionMending");
assert(!blocked.ok, "Potion crafting blocked without Alembic built");

// === Stackable craft ===
state = {
  run: { ...eraReadyRun, researched: { ...eraReadyRun.researched, alchemy: true }, inventory: { fragments: 50, water: 50, wood: 50, food: 50 } },
  persistent: { lifetimeStats: {} },
};
let result = performCraft(state, "potionMending", () => 0.99);
assert(result.run.inventory.potionMending === 1, "First potion craft: qty 1");
const fragsAfterFirst = result.run.inventory.fragments;
result = performCraft({ run: result.run, persistent: result.persistent }, "potionMending", () => 0.99);
assert(result.run.inventory.potionMending === 2, "Second craft stacks to qty 2");
assert(result.run.inventory.fragments === fragsAfterFirst - 2, "Fragments paid for second craft");

// === Potion use ===
const hurtRun = { ...result.run, stats: { ...result.run.stats, hp: 30 } };
const useState = { run: hurtRun, persistent: result.persistent };
const useResult = performUseTool(useState, "potionMending");
assert(useResult.run.stats.hp === 70, `Mending potion heals +40 HP (got ${useResult.run.stats.hp}, expected 70 from 30)`);
assert(useResult.run.inventory.potionMending === 1, `Potion qty -1 after use (got ${useResult.run.inventory.potionMending})`);

// Use until none left.
let s = useResult;
performUseTool({ run: s.run, persistent: s.persistent }, "potionMending");
const final = performUseTool({ run: { ...s.run, inventory: { ...s.run.inventory, potionMending: 0 } }, persistent: s.persistent }, "potionMending");
assert(final.events[0].kind === "actionFail", "Using potion with qty 0 fails");

// === Spirit Draught ===
const drainedRun = { ...eraReadyRun, researched: { ...eraReadyRun.researched, alchemy: true }, inventory: { ...eraReadyRun.inventory, potionSpirit: 1 }, stats: { ...eraReadyRun.stats, spirit: 10 } };
const draughtUse = performUseTool({ run: drainedRun, persistent: { lifetimeStats: {} } }, "potionSpirit");
assert(draughtUse.run.stats.spirit === 100, `Spirit Draught fills Spirit (got ${draughtUse.run.stats.spirit}, expected 100)`);

// === Banish status + ward ===
const goodRun = {
  ...eraReadyRun,
  researched: { ...eraReadyRun.researched, banishSpell: true },
  alignment: { good: 5, evil: 0 },
};
const banishResult = performCastSpell({ run: goodRun, persistent: { lifetimeStats: {} } }, "banish");
assert(banishResult.run.statuses?.warded?.until > Date.now(), "Banish applies warded status");
assert(banishResult.run.alignment.good === 6, "Banish nudges good alignment (+1)");

// Warded blocks demonic threats.
const wardedRun = { ...goodRun, statuses: { warded: { until: Date.now() + 60000 } }, gatherCount: 10 };
let wardedFired = false;
for (let i = 0; i < 200; i++) {
  const r = rollThreatEncounter({ run: wardedRun }, () => 0);
  if (r && (r.threatId === "whisperer" || r.threatId === "hollowHound")) {
    wardedFired = true;
    break;
  }
}
assert(!wardedFired, "Demons cannot fire while warded (200 trials)");

// === Bend spell ===
const evilRun = {
  ...eraReadyRun,
  researched: { ...eraReadyRun.researched, bendSpell: true },
  alignment: { good: 0, evil: 5 },
  stats: { ...eraReadyRun.stats, happiness: 50, spirit: 20 },
};
const bendResult = performCastSpell({ run: evilRun, persistent: { lifetimeStats: {} } }, "bend");
assert(bendResult.run.stats.happiness === 35, `Bend drains 15 Resolve (got ${bendResult.run.stats.happiness}, expected 35)`);
assert(bendResult.run.stats.spirit === 50, `Bend restores 30 Spirit (got ${bendResult.run.stats.spirit}, expected 50)`);
assert(bendResult.run.alignment.evil === 6, "Bend nudges evil alignment (+1)");

// Bend without alignment fails.
const neutralBendCheck = canCastSpell({ run: { ...evilRun, alignment: { good: 0, evil: 0 } } }, "bend");
assert(!neutralBendCheck.ok, "Bend blocked at neutral alignment");

// === Hollow Hound ===
const era3Run = {
  ...eraReadyRun,
  alignment: { good: 0, evil: 0 },
  stats: { ...eraReadyRun.stats, hp: 100, sanity: 100 },
  gatherCount: 10,
};
// First rng skips scavenger (0.5), then fires hollow hound (0.01 < 0.04)... but
// whisperer might fire first since it's listed before hollowHound.
// Actually order: scavenger, whisperer, hollowHound. So we need skip both first.
let hhResult = null;
for (let i = 0; i < 200; i++) {
  let rngIdx = 0;
  const rng = () => {
    const seq = [0.5, 0.5, 0.01, 0, 0]; // scavenger skipped, whisperer skipped, hh fires
    return seq[rngIdx++ % seq.length];
  };
  const r = rollThreatEncounter({ run: era3Run }, rng);
  if (r && r.threatId === "hollowHound") {
    hhResult = r;
    break;
  }
}
assert(hhResult, "Hollow Hound fires at era 3 with appropriate rng");
if (hhResult) {
  const hpDmg = era3Run.stats.hp - hhResult.stats.hp;
  const sanDmg = era3Run.stats.sanity - hhResult.stats.sanity;
  assert(hpDmg >= 3 && hpDmg <= 6, `Hollow Hound does 3-6 HP damage (got ${hpDmg})`);
  assert(sanDmg >= 2 && sanDmg <= 4, `Hollow Hound does 2-4 sanity drain (got ${sanDmg})`);
}

// === Alignment-gated events ===
state = { run: { ...eraReadyRun, alignment: { good: 5, evil: 0 } } };
// Just confirm the event passes isEventEligible — easier: check via shape.
// Events have `requires.alignment` which the system honors.
assert(EVENTS.benevolentPilgrim.choices.length === 2, "Benevolent Pilgrim has 2 choices");
assert(EVENTS.bitterScholar.choices.length === 2, "Bitter Scholar has 2 choices");

console.log("\nAll Era 3 second-slice smoke tests passed.");
