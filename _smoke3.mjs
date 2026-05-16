import { RESEARCH } from "./src/content/research.js";
import { SPELLS, getAllSpells } from "./src/content/spells.js";
import { THREATS } from "./src/content/threats.js";
import { RESOURCES, getDisplayResource } from "./src/content/resources.js";
import { computeEra, getNextEraRequirements } from "./src/systems/era.js";
import { performCastSpell, canCastSpell, getKnownSpells } from "./src/systems/spells.js";
import { rollThreatEncounter } from "./src/systems/threats.js";

const assert = (cond, msg) => {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; }
  else console.log("OK  :", msg);
};

const baseRun = {
  rockFound: true, rockAwakened: true,
  built: { hut: {}, firepit: {}, forge: {}, home: {} },
  researched: { foraging: true, fire: true, knapping: true, smithing: true, fletching: true },
  toolsCrafted: { bow: { count: 1 } },
  inventory: { fragments: 50, water: 50, wood: 50, food: 50 },
  stats: { hunger: 0, thirst: 0, energy: 100, hp: 80, happiness: 50, sanity: 50, spirit: 80 },
  spellCooldowns: {},
  gatherCount: 10,
  log: [],
};

let state = { run: baseRun, persistent: { lifetimeStats: {} } };
assert(computeEra(state) === 3, `Era 3 reached when all conditions met (got ${computeEra(state)})`);

// Missing Bow → not Era 3.
state = { run: { ...baseRun, toolsCrafted: {} }, persistent: { lifetimeStats: {} } };
assert(computeEra(state) === 2, "Without bow crafted, era stays at 2");
const reqs = getNextEraRequirements(state);
assert(reqs.some((r) => r.toLowerCase().includes("bow")), "getNextEraRequirements mentions Bow");

// Missing Home → not Era 3.
state = { run: { ...baseRun, built: { hut: {}, firepit: {}, forge: {} } }, persistent: { lifetimeStats: {} } };
assert(computeEra(state) === 2, "Without home built, era stays at 2");

// === Research nodes exist ===
for (const id of ["arcaneAwakening", "mendingWord", "soothe", "innerHearth"]) {
  assert(RESEARCH[id], `Research ${id} exists`);
  assert(RESEARCH[id].requires.era === 3, `${id} gated by era 3`);
}
assert(RESEARCH.arcaneAwakening.effect.revealsFragments === true, "arcaneAwakening has revealsFragments effect");

// === Spells exist ===
const spellList = getAllSpells();
assert(spellList.length === 3, `3 spells defined (got ${spellList.length})`);
for (const id of ["mendingWord", "soothe", "innerHearth"]) {
  assert(SPELLS[id], `Spell ${id} exists`);
  assert(SPELLS[id].cost.fragments > 0, `${id} costs fragments`);
  assert(SPELLS[id].cost.spirit > 0, `${id} costs spirit`);
}

// === Spell casting ===
state = { run: { ...baseRun, researched: { ...baseRun.researched, mendingWord: true } }, persistent: { lifetimeStats: {} } };
const castCheck = canCastSpell(state, "mendingWord");
assert(castCheck.ok, `Can cast Mending Word with all conditions met (got: ${castCheck.reason || "ok"})`);

// Cast — verify HP up, fragments and spirit down, cooldown stamped.
const result = performCastSpell(state, "mendingWord");
assert(result.run.inventory.fragments === 49, `Fragments paid (got ${result.run.inventory.fragments}, expected 49)`);
assert(result.run.stats.spirit === 65, `Spirit drained (got ${result.run.stats.spirit}, expected 65 = 80-15)`);
assert(result.run.stats.hp === 100, `HP healed (got ${result.run.stats.hp}, expected clamped at 100)`);
assert(result.run.spellCooldowns.mendingWord > Date.now(), "Cooldown stamped");

// Cast again immediately → blocked by cooldown.
const result2 = performCastSpell(result, "mendingWord");
assert(result2.events[0].kind === "spellFail", "Second cast blocked by cooldown");

// Without learning the spell, can't cast.
state = { run: baseRun, persistent: { lifetimeStats: {} } };
assert(!canCastSpell(state, "mendingWord").ok, "Can't cast spell without learning it");

// === Fragments reveal ===
const noResearch = { run: { researched: {} } };
const hiddenView = getDisplayResource(noResearch, RESOURCES.fragments);
assert(hiddenView.name === "???", `Fragments hidden as ??? before arcaneAwakening (got ${hiddenView.name})`);

const withResearch = { run: { researched: { arcaneAwakening: true } } };
const revealedView = getDisplayResource(withResearch, RESOURCES.fragments);
assert(revealedView.name === "Arcane Shards", `Fragments reveal as Arcane Shards after research (got ${revealedView.name})`);

// === Whisperer threat ===
assert(THREATS.whisperer, "Whisperer threat exists");
assert(THREATS.whisperer.requires.era === 3, "Whisperer gated to era 3");
assert(THREATS.whisperer.effects.sanityDrain, "Whisperer has sanityDrain effect");

// Era 2 state — Whisperer should never fire.
state = { run: { ...baseRun, toolsCrafted: {}, gatherCount: 10 }, persistent: { lifetimeStats: {} } };
const era = computeEra(state);
assert(era < 3, `Era is ${era} (< 3, so Whisperer ineligible)`);
let fired = false;
for (let i = 0; i < 500; i++) {
  const r = rollThreatEncounter(state, () => 0);
  if (r && r.threatId === "whisperer") { fired = true; break; }
}
assert(!fired, "Whisperer never fires before era 3 (500 trials)");

// Era 3 state — Whisperer CAN fire.
state = { run: { ...baseRun, gatherCount: 10 }, persistent: { lifetimeStats: {} } };
let whispererFired = false;
let whispererSanityDrained = 0;
for (let i = 0; i < 100; i++) {
  const r = rollThreatEncounter(state, () => 0);
  if (r && r.threatId === "whisperer") {
    whispererFired = true;
    const sanityBefore = state.run.stats.sanity;
    const sanityAfter = r.stats.sanity;
    whispererSanityDrained = sanityBefore - sanityAfter;
    break;
  }
}
assert(whispererFired, "Whisperer fires at era 3");
assert(whispererSanityDrained >= 3 && whispererSanityDrained <= 5, `Whisperer drained 3-5 sanity (got ${whispererSanityDrained})`);

// === getKnownSpells ===
state = { run: { ...baseRun, researched: { ...baseRun.researched, mendingWord: true, soothe: true } } };
const known = getKnownSpells(state);
assert(known.length === 2, `2 spells known after learning 2 (got ${known.length})`);

console.log("\nAll Era 3 smoke tests passed.");
