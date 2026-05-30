// Combat resolution — passive multi-round fight loop with rich log
// narration. Task #33 (Combat Phase 2). Now also exposes single-turn
// rollers used by the boss-fight modal (#40).

import {
  getEquippedMeleeDef,
  getEquippedRangedDef,
} from "./equipment.js";
import { applyToolWear } from "./crafting.js";
import { applyEffect } from "./survival.js";
import { getStudyStatBonuses } from "./studies.js";
import { applyDeathDebuff } from "./death.js";
import { gainXp, getSkillState } from "./skills.js";
import { randInt } from "../util/rng.js";

// ─── Combat-skill routing (#34) ───────────────────────────────────────
const SUBFAMILY_TO_SKILL = {
  club: "swordplay",
  spear: "swordplay",
  mace: "swordplay",
  axe: "swordplay",
  sword: "swordplay",
  knife: "swordplay",
  pickaxe: "swordplay",
  bow: "archery",
  throwing: "archery",
};

export function getCombatSkillForWeapon(weapon) {
  if (!weapon || !weapon.subfamily) return null;
  return SUBFAMILY_TO_SKILL[weapon.subfamily] || null;
}

export function getCombatSkillBonuses(run, skillId) {
  if (!skillId) return { damageBonus: 0, accBonus: 0, critBonus: 0 };
  const { level } = getSkillState(run, skillId);
  return {
    damageBonus: Math.min(10, level * 0.5),
    accBonus: Math.min(0.20, level * 0.01),
    critBonus: Math.min(0.30, level * 0.02),
  };
}

export function getCombatXpForVictory(threatDef) {
  const foeHp = threatDef?.combat?.hp ?? 10;
  return Math.max(1, Math.floor(foeHp / 4));
}

// ─── Constants ─────────────────────────────────────────────────────────
const MAX_ROUNDS = 12;
const PLAYER_BASE_EVA = 0.05;

const FISTS = {
  id: "_fists",
  name: "your fists",
  icon: "👊",
  weaponStats: { damage: [1, 2], acc: 0.6, crit: 0.02, type: "melee" },
};

// ─── Narration templates (fallbacks) ──────────────────────────────────
const PLAYER_HIT_LINES = [
  "You raise the {weapon}. The strike lands. {dmg} dmg.",
  "{weapon} bites cleanly. {dmg} dmg.",
  "You step in. {weapon} connects. {dmg} dmg.",
  "A solid swing. {dmg} dmg.",
];
const PLAYER_CRIT_LINES = [
  "The {weapon} finds the soft place. The hit doubles. {dmg} dmg.",
  "Critical — {weapon} lands true. {dmg} dmg.",
  "You see the opening and take it. The {weapon} answers. {dmg} dmg.",
];
const PLAYER_MISS_LINES = [
  "{weapon} bites air.",
  "Your swing falls wide. The {threat} sidesteps.",
  "You overcommit. {weapon} passes harmless.",
  "A near miss. The {threat} pulls back unhurt.",
];
const THREAT_ATTACK_LINES = [
  "The {threat} strikes. {dmg} dmg.",
  "{threat} closes and hits hard. {dmg} dmg.",
];
const THREAT_MISS_LINES = [
  "The {threat} misses.",
  "Their swing falls short. They reset.",
];
const VICTORY_LINES = [
  "The {threat} falls. You stand over it, breathing hard.",
  "It drops. You step back. The wasteland takes it.",
];
const DEFEAT_LINES = [
  "Your legs give out. The world greys at the edges.",
  "You take one too many. The world goes dark.",
];

// ─── Helpers ──────────────────────────────────────────────────────────
function pickRandom(arr, rng) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

function substitute(template, subs) {
  if (!template) return "";
  return Object.entries(subs).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

export function getEffectiveWeapon(run) {
  const melee = getEquippedMeleeDef(run);
  if (melee && melee.weaponStats) return melee;
  const ranged = getEquippedRangedDef(run);
  if (ranged && ranged.weaponStats) return ranged;
  return FISTS;
}

export function getPersonalArmor(state) {
  const bonuses = getStudyStatBonuses(state.run);
  return bonuses.armor || 0;
}

// ─── Single-turn rollers (boss modal #40) ─────────────────────────────
export function rollPlayerAttack(state, threatDef, rng = Math.random) {
  const weapon = getEffectiveWeapon(state.run);
  const wStats = weapon.weaponStats || FISTS.weaponStats;
  const cb = threatDef.combat || {};
  const threatEva = cb.eva ?? 0.05;
  const skillId = getCombatSkillForWeapon(weapon);
  const sb = getCombatSkillBonuses(state.run, skillId);
  const effAcc = wStats.acc + sb.accBonus;
  const effCrit = (wStats.crit || 0) + sb.critBonus;
  const flatDmg = Math.floor(sb.damageBonus);

  const hit = rng() < (effAcc - threatEva);
  if (!hit) {
    const flavor = threatDef.combatFlavor || {};
    const line = pickRandom(flavor.playerMiss, rng) || pickRandom(PLAYER_MISS_LINES, rng);
    return {
      hit: false,
      isCrit: false,
      dmg: 0,
      weaponName: weapon.name,
      skillId,
      message: substitute(line, { weapon: weapon.name, threat: threatDef.name }),
    };
  }
  const [lo, hi] = wStats.damage;
  let dmg = randInt(rng, lo, hi) + flatDmg;
  const isCrit = rng() < effCrit;
  if (isCrit) dmg *= 2;
  const line = isCrit
    ? pickRandom(PLAYER_CRIT_LINES, rng)
    : pickRandom(PLAYER_HIT_LINES, rng);
  return {
    hit: true,
    isCrit,
    dmg,
    weaponName: weapon.name,
    skillId,
    message: substitute(line, {
      weapon: weapon.name,
      threat: threatDef.name,
      dmg,
    }),
  };
}

export function rollFoeAttack(state, threatDef, rng = Math.random) {
  const weapon = getEffectiveWeapon(state.run);
  const cb = threatDef.combat || {};
  const threatAcc = cb.acc ?? 0.7;
  const threatDmg = cb.damage || { min: 2, max: 4 };
  const damageType = cb.damageType || "hp";
  const armor = damageType === "hp" ? getPersonalArmor(state) : 0;
  const flavor = threatDef.combatFlavor || {};

  const hit = rng() < (threatAcc - PLAYER_BASE_EVA);
  if (!hit) {
    const line = pickRandom(flavor.miss, rng) || pickRandom(THREAT_MISS_LINES, rng);
    return {
      hit: false,
      dmg: 0,
      damageType,
      message: substitute(line, { threat: threatDef.name, weapon: weapon.name }),
    };
  }
  const raw = randInt(rng, threatDmg.min, threatDmg.max);
  const dmg = Math.max(0, raw - armor);
  const line = pickRandom(flavor.attack, rng) || pickRandom(THREAT_ATTACK_LINES, rng);
  return {
    hit: true,
    dmg,
    damageType,
    message: substitute(line, { threat: threatDef.name, weapon: weapon.name, dmg }),
  };
}

export function pickOpener(threatDef, rng = Math.random) {
  const flavor = threatDef.combatFlavor || {};
  return pickRandom(flavor.opener, rng) || `⚔️ A ${threatDef.name} closes the distance.`;
}

export function pickVictoryLine(threatDef, rng = Math.random) {
  const flavor = threatDef.combatFlavor || {};
  const line = pickRandom(flavor.victory, rng) || pickRandom(VICTORY_LINES, rng);
  return substitute(line, { threat: threatDef.name });
}

export function pickDefeatLine(threatDef, rng = Math.random) {
  const flavor = threatDef.combatFlavor || {};
  const line = pickRandom(flavor.defeat, rng) || pickRandom(DEFEAT_LINES, rng);
  return substitute(line, { threat: threatDef.name });
}

// ─── Main resolver ────────────────────────────────────────────────────
export function resolveFight(state, threatDef, rng = Math.random) {
  const weapon = getEffectiveWeapon(state.run);
  const wStats = weapon.weaponStats || FISTS.weaponStats;
  const cb = threatDef.combat || {};
  const threatAcc = cb.acc ?? 0.7;
  const threatEva = cb.eva ?? 0.05;
  const threatDmg = cb.damage || { min: 2, max: 4 };
  const damageType = cb.damageType || "hp";

  const combatSkillId = getCombatSkillForWeapon(weapon);
  const skillBonuses = getCombatSkillBonuses(state.run, combatSkillId);
  const effAcc = wStats.acc + skillBonuses.accBonus;
  const effCrit = (wStats.crit || 0) + skillBonuses.critBonus;
  const flatDamageBonus = Math.floor(skillBonuses.damageBonus);

  const startStats = state.run.stats || {};
  let playerHp = startStats.hp ?? 100;
  let playerSanity = startStats.sanity ?? 50;
  let playerSpirit = startStats.spirit ?? 50;
  let foeHp = cb.hp ?? 10;

  const playerArmor = getPersonalArmor(state);

  const events = [];
  const flavor = threatDef.combatFlavor || {};

  const openerLine = pickRandom(flavor.opener, rng);
  events.push({
    kind: "combat",
    message: openerLine || `⚔️ A ${threatDef.name} closes the distance.`,
  });

  let round = 0;
  let outcome = "stalemate";
  while (round < MAX_ROUNDS) {
    round++;

    const playerHitRoll = rng();
    const playerHits = playerHitRoll < (effAcc - threatEva);
    if (playerHits) {
      const [lo, hi] = wStats.damage;
      let dmg = randInt(rng, lo, hi) + flatDamageBonus;
      const isCrit = rng() < effCrit;
      if (isCrit) dmg *= 2;
      foeHp = Math.max(0, foeHp - dmg);
      const line = isCrit ? pickRandom(PLAYER_CRIT_LINES, rng) : pickRandom(PLAYER_HIT_LINES, rng);
      events.push({ kind: "combat", message: substitute(line, { weapon: weapon.name, threat: threatDef.name, dmg }) });
    } else {
      const line = pickRandom(PLAYER_MISS_LINES, rng);
      events.push({ kind: "combat", message: substitute(line, { weapon: weapon.name, threat: threatDef.name }) });
    }

    if (foeHp <= 0) {
      outcome = "victory";
      break;
    }

    const threatHitRoll = rng();
    const threatHits = threatHitRoll < (threatAcc - PLAYER_BASE_EVA);
    if (threatHits) {
      const raw = randInt(rng, threatDmg.min, threatDmg.max);
      let reduced = raw;
      if (damageType === "hp") reduced = Math.max(0, raw - playerArmor);
      if (damageType === "sanity") playerSanity = Math.max(0, playerSanity - reduced);
      else if (damageType === "spirit") playerSpirit = Math.max(0, playerSpirit - reduced);
      else playerHp = Math.max(0, playerHp - reduced);
      const line = pickRandom(flavor.attack, rng) || pickRandom(THREAT_ATTACK_LINES, rng);
      events.push({ kind: "combat", message: substitute(line, { threat: threatDef.name, weapon: weapon.name, dmg: reduced }) });
    } else {
      const line = pickRandom(flavor.miss, rng) || pickRandom(THREAT_MISS_LINES, rng);
      events.push({ kind: "combat", message: substitute(line, { threat: threatDef.name, weapon: weapon.name }) });
    }

    if (playerHp <= 0) {
      outcome = "defeat";
      break;
    }
  }

  if (outcome === "victory") {
    const line = pickRandom(flavor.victory, rng) || pickRandom(VICTORY_LINES, rng);
    events.push({ kind: "combat", message: substitute(line, { threat: threatDef.name }) });
  } else if (outcome === "defeat") {
    const line = pickRandom(flavor.defeat, rng) || pickRandom(DEFEAT_LINES, rng);
    events.push({ kind: "combat", message: substitute(line, { threat: threatDef.name }) });
  } else {
    events.push({ kind: "combat", message: "⚔️ The fight grinds past patience. You break off and stagger away." });
  }

  const newStats = applyEffect(state.run.stats || {}, {
    hp: playerHp - (startStats.hp ?? 100),
    sanity: playerSanity - (startStats.sanity ?? 50),
    spirit: playerSpirit - (startStats.spirit ?? 50),
  });

  let run = { ...state.run, stats: newStats };

  if (outcome === "victory" && combatSkillId) {
    const xpGain = getCombatXpForVictory(threatDef);
    const xpResult = gainXp(run, combatSkillId, xpGain);
    run = { ...run, skills: xpResult.skills };
    events.push(...xpResult.events);
  }

  if (outcome === "defeat") {
    const dd = applyDeathDebuff(run);
    run = dd.run;
    events.push(...dd.events);
  }

  const wear = applyToolWear(run, "combat");
  run = wear.run;
  events.push(...wear.events);

  return {
    run,
    persistent: state.persistent,
    events,
    outcome,
    threatId: threatDef.id,
  };
}
