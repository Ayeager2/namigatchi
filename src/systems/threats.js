// Threat system — rolls random encounters per gather.
//
// Two resolution paths live here. The router (rollThreatEncounter +
// resolveThreatById) sniffs `threat.combat` to decide:
//
//   • combat-class threats (have `combat: { hp, acc, eva, damage, ... }`)
//     route to systems/combat.js resolveFight — multi-round fight loop
//     with weapon stats, durability wear, narrative log.
//
//   • one-shot threats (legacy / atmospheric) keep the existing
//     resolveThreat path — narrative-rich single-event resolutions
//     (scavenger steals food and flees, whisperer's pressure passes).

import { getAllThreats } from "../content/threats.js";
import { getToolEffects } from "../content/tools.js";
import { SURVIVAL } from "../content/survival.js";
import { applyEffect } from "./survival.js";
import { getDefense, getFoodStealReduction } from "./defense.js";
import { resolveFight } from "./combat.js";
import { computeEra } from "./era.js";
import { randInt } from "../util/rng.js";

// Re-export defense helpers for back-compat (old callers may still import
// from threats.js — keep their imports working).
export { getDefense, getFoodStealReduction };

function isThreatActive(state, threat) {
  if (threat.requires?.hutBuilt && !state.run.built?.hut) return false;
  if (threat.requires?.era && computeEra(state) < threat.requires.era) return false;
  const minGathers = threat.minGathersAfterGate ?? 0;
  if ((state.run.gatherCount || 0) < minGathers) return false;
  if (threat.kind === "demon") {
    const warded = state.run.statuses?.warded;
    if (warded && warded.until && warded.until > Date.now()) return false;
  }
  return true;
}

function pickFlavor(messages, rng, substitutions = {}) {
  if (!messages || messages.length === 0) return "";
  const msg = messages[Math.floor(rng() * messages.length)];
  return Object.entries(substitutions).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, v),
    msg
  );
}

export function rollThreatEncounter(state, rng = Math.random) {
  const candidates = getAllThreats().filter((t) => isThreatActive(state, t));
  if (candidates.length === 0) return null;
  for (const threat of candidates) {
    if (rng() >= threat.encounterChance) continue;
    return routeThreat(state, threat, rng);
  }
  return null;
}

// Force-resolve a specific threat by id. Used by the dev panel for direct
// testing of demon encounters without waiting on the gather RNG.
export function resolveThreatById(state, threatId, rng = Math.random) {
  const threat = getAllThreats().find((t) => t.id === threatId);
  if (!threat) return null;
  return routeThreat(state, threat, rng);
}

// Internal router — picks between the combat fight loop and the legacy
// one-shot resolver, then normalizes the return shape so callers
// (gathering.js etc.) can consume either uniformly.
//
// Returned shape (always):
//   { inventory, stats, toolDurability?, events, threatId, outcome? }
//
// Combat-class results pass `outcome: "victory" | "defeat" | "stalemate"`
// in case callers want to react to it. One-shot results omit `outcome`.
function routeThreat(state, threat, rng) {
  if (threat.combat) {
    const result = resolveFight(state, threat, rng);
    return {
      inventory: result.run.inventory,
      stats: result.run.stats,
      toolDurability: result.run.toolDurability,
      events: result.events,
      threatId: result.threatId,
      outcome: result.outcome,
    };
  }
  return resolveThreat(state, threat, rng);
}

function resolveThreat(state, threat, rng) {
  const inventory = { ...state.run.inventory };
  let stats = { ...(state.run.stats || {}) };
  const events = [];

  const defense = getDefense(state);
  const foodReduction = getFoodStealReduction(state);

  const toolEff = getToolEffects(state.run);
  const isDemon = threat.kind === "demon";
  const dmgMult = isDemon ? (toolEff.demonDamageMult ?? 1) : 1;
  const sanMult = isDemon ? (toolEff.demonSanityMult ?? 1) : 1;

  let stolen = 0;
  let dmg = 0;
  let drained = 0;
  let resolveDrained = 0;

  if (threat.effects?.stealFood) {
    const { min, max } = threat.effects.stealFood;
    const base = randInt(rng, min, max);
    const wanted = Math.max(0, base - defense - foodReduction);
    stolen = Math.min(wanted, inventory.food || 0);
    if (stolen > 0) inventory.food = (inventory.food || 0) - stolen;
  }

  if (threat.effects?.damage) {
    const { min, max } = threat.effects.damage;
    const base = randInt(rng, min, max);
    const effectiveDefense = threat.effects.defenseHalf ? Math.floor(defense / 2) : defense;
    dmg = Math.max(0, base - effectiveDefense);
    if (dmg > 0 && dmgMult !== 1) dmg = Math.max(0, Math.round(dmg * dmgMult));
    if (dmg > 0) stats.hp = Math.max(0, (stats.hp ?? 100) - dmg);
  }

  if (threat.effects?.sanityDrain) {
    const { min, max } = threat.effects.sanityDrain;
    let raw = randInt(rng, min, max);
    if (sanMult !== 1) raw = Math.max(0, Math.round(raw * sanMult));
    drained = raw;
  }

  if (threat.effects?.happinessDrain) {
    const { min, max } = threat.effects.happinessDrain;
    let raw = randInt(rng, min, max);
    if (sanMult !== 1) raw = Math.max(0, Math.round(raw * sanMult));
    resolveDrained = raw;
    if (resolveDrained > 0) stats = applyEffect(stats, { happiness: -resolveDrained });
  }

  const hasSanityDrain = !!threat.effects?.sanityDrain;
  let sanityChange = hasSanityDrain ? 0 : SURVIVAL.sanityFromThreat?.perEncounter || 0;
  if (dmg > 0 && !hasSanityDrain) {
    sanityChange += (SURVIVAL.sanityFromThreat?.perDamagePoint || 0) * dmg;
  }
  sanityChange -= drained;
  if (sanityChange !== 0) stats = applyEffect(stats, { sanity: sanityChange });

  const isPureSanityThreat =
    hasSanityDrain && !threat.effects?.stealFood && !threat.effects?.damage;

  if (stolen > 0) {
    events.push({ kind: "threat", message: pickFlavor(threat.flavorMessages, rng, { food: stolen }) });
  } else if (drained > 0 && resolveDrained > 0 && !dmg) {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.flavorMessages, rng, { sanity: drained, happiness: resolveDrained }),
    });
  } else if (isPureSanityThreat && drained > 0) {
    events.push({ kind: "threat", message: pickFlavor(threat.flavorMessages, rng, { sanity: drained }) });
  } else if (dmg > 0 && drained > 0) {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.flavorMessages, rng, { damage: dmg, sanity: drained }),
    });
  } else {
    events.push({ kind: "threat", message: pickFlavor(threat.emptyMessages, rng) });
  }
  if (dmg > 0 && !hasSanityDrain) {
    events.push({ kind: "damage", message: pickFlavor(threat.damageMessages, rng, { damage: dmg }) });
  }

  return { inventory, stats, events, threatId: threat.id };
}
