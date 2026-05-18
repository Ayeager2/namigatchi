import { ECHO_UPGRADES, getNextLevelCost } from "./src/content/echoes.js";
import { canBuyEchoUpgrade, performBuyEchoUpgrade, applyEchoUpgrades, getShopRows, getUpgradeLevel } from "./src/systems/echoes.js";

const assert = (cond, msg) => {
  if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; }
  else console.log("OK  :", msg);
};

// === Content ===
const allUpgrades = Object.values(ECHO_UPGRADES);
assert(allUpgrades.length === 14, `14 upgrades defined (got ${allUpgrades.length})`);

// Spot checks
assert(ECHO_UPGRADES.startWood.maxLevel === 5, "startWood is tiered to 5");
assert(ECHO_UPGRADES.toughBody.maxLevel === 1, "toughBody is one-time");
assert(ECHO_UPGRADES.skillForaging.effect.startSkillLevel.foraging === 1, "skillForaging adds 1 lvl per tier");

// === Cost curve ===
assert(getNextLevelCost(ECHO_UPGRADES.startWood, 0) === 2, "startWood first cost = 2");
assert(getNextLevelCost(ECHO_UPGRADES.startWood, 1) === 3, "startWood second cost = ceil(2*1.5) = 3");
assert(getNextLevelCost(ECHO_UPGRADES.startWood, 4) === 11, `startWood last cost = ceil(2*1.5^4) = 11 (got ${getNextLevelCost(ECHO_UPGRADES.startWood, 4)})`);
assert(getNextLevelCost(ECHO_UPGRADES.startWood, 5) === null, "startWood at max returns null");

// === Buy validation ===
const poor = { echoes: 1, echoUpgrades: {} };
assert(!canBuyEchoUpgrade(poor, "startWood").ok, "Can't buy startWood with 1 echo (costs 2)");

const rich = { echoes: 10, echoUpgrades: {} };
assert(canBuyEchoUpgrade(rich, "startWood").ok, "Can buy startWood with 10 echoes");

// === Buy + spend + level up ===
let p = { echoes: 10, echoUpgrades: {} };
let result = performBuyEchoUpgrade(p, "startWood");
assert(result.persistent.echoes === 8, `After 1st startWood buy: 10 - 2 = 8 echoes (got ${result.persistent.echoes})`);
assert(result.persistent.echoUpgrades.startWood === 1, "startWood level = 1");

result = performBuyEchoUpgrade(result.persistent, "startWood");
assert(result.persistent.echoes === 5, `After 2nd buy: 8 - 3 = 5 echoes (got ${result.persistent.echoes})`);
assert(result.persistent.echoUpgrades.startWood === 2, "startWood level = 2");

// === Apply to fresh run ===
const freshRun = {
  inventory: { wood: 0, stone: 0 },
  stats: { hp: 40, spirit: 50, sanity: 25, happiness: 15, hunger: 60, thirst: 60, energy: 50 },
  skills: {},
};

// Level 2 startWood → +20 wood at start.
const applied = applyEchoUpgrades(freshRun, result.persistent);
assert(applied.inventory.wood === 20, `startWood lvl 2 grants 20 wood at start (got ${applied.inventory.wood})`);

// === One-time upgrade ===
let p2 = { echoes: 10, echoUpgrades: {} };
let r2 = performBuyEchoUpgrade(p2, "toughBody");
assert(r2.persistent.echoes === 5, `toughBody costs 5 (got ${r2.persistent.echoes})`);
assert(!canBuyEchoUpgrade(r2.persistent, "toughBody").ok, "Can't buy toughBody twice");

const applied2 = applyEchoUpgrades(freshRun, r2.persistent);
assert(applied2.stats.hp === 60, `toughBody +20 HP (40+20=60, got ${applied2.stats.hp})`);

// === Skill upgrade ===
let p3 = { echoes: 20, echoUpgrades: {} };
let r3 = performBuyEchoUpgrade(p3, "skillForaging");
r3 = performBuyEchoUpgrade(r3.persistent, "skillForaging");
r3 = performBuyEchoUpgrade(r3.persistent, "skillForaging");
assert(r3.persistent.echoUpgrades.skillForaging === 3, "skillForaging at lvl 3");

const applied3 = applyEchoUpgrades(freshRun, r3.persistent);
assert(applied3.skills.foraging?.level === 3, `Skill foraging starts at lvl 3 (got ${applied3.skills.foraging?.level})`);
assert(applied3.skills.foraging?.xp > 0, "Skill foraging has XP seeded");

// === Stat clamp ===
const fullStats = { ...freshRun, stats: { ...freshRun.stats, hp: 95 } };
const p4 = { echoes: 0, echoUpgrades: { toughBody: 1 } };
const applied4 = applyEchoUpgrades(fullStats, p4);
assert(applied4.stats.hp === 100, `HP clamps at 100 (got ${applied4.stats.hp})`);

// === Multiple upgrades stack ===
const everything = {
  echoes: 0,
  echoUpgrades: {
    startWood: 3,
    startStone: 2,
    toughBody: 1,
    skillBuilding: 2,
  },
};
const applied5 = applyEchoUpgrades(freshRun, everything);
assert(applied5.inventory.wood === 30, `startWood lvl 3 → +30 wood (got ${applied5.inventory.wood})`);
assert(applied5.inventory.stone === 20, `startStone lvl 2 → +20 stone (got ${applied5.inventory.stone})`);
assert(applied5.stats.hp === 60, `toughBody → +20 HP (got ${applied5.stats.hp})`);
assert(applied5.skills.building?.level === 2, `skillBuilding lvl 2 (got ${applied5.skills.building?.level})`);

// === Shop rows ===
const rows = getShopRows(everything);
assert(rows.length === 14, "14 rows in shop");
const startWoodRow = rows.find((r) => r.upgrade.id === "startWood");
assert(startWoodRow.level === 3, "startWood row shows lvl 3");
assert(startWoodRow.cost > 0, "startWood row has next cost");
const toughBodyRow = rows.find((r) => r.upgrade.id === "toughBody");
assert(toughBodyRow.maxed === true, "toughBody row is maxed");
assert(toughBodyRow.cost === null, "toughBody maxed row has null cost");

console.log("\nAll prestige shop smoke tests passed.");
