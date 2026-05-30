import {
  BOSSES,
  getBoss,
  getAllBosses,
  getBossesForEra,
  getBossesAvailable,
} from "./src/content/bosses.js";

const assert = (cond, msg) => {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; }
  else console.log("OK  :", msg);
};

// === Roster count + tier/era distribution ===
const all = getAllBosses();
assert(all.length === 6, `6 bosses total (got ${all.length})`);
assert(getBossesForEra(1).length === 2, `2 bosses in Era 1`);
assert(getBossesForEra(2).length === 2, `2 bosses in Era 2`);
assert(getBossesForEra(3).length === 2, `2 bosses in Era 3`);

// === Each era has 1 mini + 1 main ===
for (const era of [1, 2, 3]) {
  const inEra = getBossesForEra(era);
  const tiers = inEra.map((b) => b.tier).sort();
  assert(tiers[0] === "main" && tiers[1] === "mini", `Era ${era} has 1 main + 1 mini`);
}

// === Each boss has required shape ===
for (const b of all) {
  assert(typeof b.id === "string", `${b.name} has id`);
  assert(b.boss === true, `${b.name} marked as boss`);
  assert(b.encounterChance === 0, `${b.name} encounterChance === 0 (never random-rolls)`);
  assert(b.combat?.hp > 0, `${b.name} has combat.hp`);
  assert(Array.isArray(b.combat?.damage) || b.combat?.damage?.min !== undefined, `${b.name} has damage range`);
  assert(b.combatFlavor?.opener?.length >= 2, `${b.name} has opener pool`);
  assert(b.combatFlavor?.attack?.length >= 2, `${b.name} has attack pool`);
  assert(b.combatFlavor?.miss?.length >= 1, `${b.name} has miss pool`);
  assert(b.combatFlavor?.victory?.length >= 1, `${b.name} has victory pool`);
  assert(b.combatFlavor?.defeat?.length >= 1, `${b.name} has defeat pool`);
  assert(b.defeatReward, `${b.name} has defeatReward`);
  assert(b.firstDefeatLog, `${b.name} has firstDefeatLog`);
  assert(b.etching, `${b.name} has etching id`);
}

// === Era 3 elemental gates ===
const era3 = getBossesForEra(3);
for (const b of era3) {
  assert(typeof b.elementalGate === "string", `${b.name} (Era 3) has elementalGate`);
}
// Era 1 + 2 should NOT have elementalGate
const era12 = [...getBossesForEra(1), ...getBossesForEra(2)];
for (const b of era12) {
  assert(!b.elementalGate, `${b.name} (Era ${b.era}) does NOT have elementalGate`);
}

// === Stats sanity: difficulty escalates by era + tier ===
const e1m = BOSSES.era1_mini_dustCrownedScavenger;
const e1M = BOSSES.era1_main_longToothedOne;
const e2m = BOSSES.era2_mini_raiderCaptain;
const e2M = BOSSES.era2_main_ironHand;
const e3m = BOSSES.era3_mini_stilledChoir;
const e3M = BOSSES.era3_main_lastForager;

assert(e1M.combat.hp > e1m.combat.hp, "Era 1 main HP > Era 1 mini HP");
assert(e2m.combat.hp > e1M.combat.hp, "Era 2 mini HP > Era 1 main HP");
assert(e2M.combat.hp > e2m.combat.hp, "Era 2 main HP > Era 2 mini HP");
assert(e3M.combat.hp > e3m.combat.hp, "Era 3 main HP > Era 3 mini HP");
assert(e3M.combat.hp >= 150, "Era 3 main HP >= 150 (genuine threat tier)");

// === Damage type variety ===
const types = new Set(all.map((b) => b.combat.damageType));
assert(types.has("hp"), "At least one HP-damage boss");
assert(types.has("sanity"), "At least one sanity-damage boss (mind has no armor)");

// === getBossesAvailable: gating ===
// Empty state — no bosses available.
const emptyState = { run: { era: 0, built: {}, researched: {}, studiesCompleted: {} } };
assert(getBossesAvailable(emptyState).length === 0, "No bosses available at era 0 / nothing built");

// Era 1 with hut built — only Era 1 mini (era1 main also requires hutBuilt)
const era1State = {
  run: { era: 1, built: { hut: {} }, researched: {}, studiesCompleted: {} },
};
const era1Avail = getBossesAvailable(era1State).map((b) => b.id);
assert(era1Avail.includes("era1_mini_dustCrownedScavenger"), "Era 1 mini available with hut");
assert(era1Avail.includes("era1_main_longToothedOne"), "Era 1 main available with hut");
assert(era1Avail.length === 2, `Only Era 1 bosses available at era 1 (got ${era1Avail.length})`);

// Era 2 with home + forge — era 2 mini + main available
const era2State = {
  run: { era: 2, built: { hut: {}, home: {}, forge: {} }, researched: {}, studiesCompleted: {} },
};
const era2Avail = getBossesAvailable(era2State).map((b) => b.id);
assert(era2Avail.includes("era2_mini_raiderCaptain"), "Era 2 mini available");
assert(era2Avail.includes("era2_main_ironHand"), "Era 2 main available with forge");

// Era 3 WITHOUT elemental studies — bosses gated out
const era3StateNoStudy = {
  run: {
    era: 3,
    built: { hut: {}, home: {}, forge: {} },
    researched: { arcaneAwakening: { at: 1 } },
    studiesCompleted: {},
  },
};
const era3NoStudy = getBossesAvailable(era3StateNoStudy).map((b) => b.id);
assert(!era3NoStudy.includes("era3_mini_stilledChoir"), "Era 3 mini gated without memory study");
assert(!era3NoStudy.includes("era3_main_lastForager"), "Era 3 main gated without voidcall study");

// Era 3 WITH memory study — mini unlocks, main still gated
const era3StateMemory = {
  run: {
    era: 3,
    built: { hut: {}, home: {}, forge: {} },
    researched: { arcaneAwakening: { at: 1 } },
    studiesCompleted: { memory_firstEcho: { completedAt: 1 } },
  },
};
const era3Memory = getBossesAvailable(era3StateMemory).map((b) => b.id);
assert(era3Memory.includes("era3_mini_stilledChoir"), "Era 3 mini unlocks with memory study");
assert(!era3Memory.includes("era3_main_lastForager"), "Era 3 main still gated (needs voidcall)");

// Era 3 WITH voidcall study — main unlocks
const era3StateVoid = {
  run: {
    era: 3,
    built: { hut: {}, home: {}, forge: {} },
    researched: { arcaneAwakening: { at: 1 } },
    studiesCompleted: { voidcall_firstCall: { completedAt: 1 } },
  },
};
const era3Void = getBossesAvailable(era3StateVoid).map((b) => b.id);
assert(era3Void.includes("era3_main_lastForager"), "Era 3 main unlocks with voidcall study");

console.log("\nAll boss roster #41 smoke tests passed.");
