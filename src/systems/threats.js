// Threat system — rolls random encounters per gather.

import { getAllThreats } from "../content/threats.js";
import { getResearch } from "../content/research.js";
import { getBuilding } from "../content/buildings.js";
import { getToolEffects } from "../content/tools.js";
import { SURVIVAL } from "../content/survival.js";
import { applyEffect } from "./survival.js";
import { computeEra } from "./era.js";
import { randInt } from "../util/rng.js";

export function getDefense(state) {
  let def = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.defense) def += r.effect.defense;
  }
  for (const id of Object.keys(state.run.built || {})) {
    const b = getBuilding(id);
    if (b?.effect?.defense) def += b.effect.defense;
  }
  return def;
}

export function getFoodStealReduction(state) {
  let red = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.foodStealReduction) red += r.effect.foodStealReduction;
  }
  for (const id of Object.keys(state.run.built || {})) {
    const b = getBuilding(id);
    if (b?.effect?.foodStealReduction) red += b.effect.foodStealReduction;
  }
  return red;
}

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
    return resolveThreat(state, threat, rng);
  }
  return null;
}

function resolveThreat(state, threat, rng) {
  const inventory = { ...state.run.inventory };
  let stats = { ...(state.run.stats || {}) };
  const events = [];

  const defense = getDefense(state);
  const foodReduction = getFoodStealReduction(state);

  // Warding Talisman + future arcane wards apply only to demonic threats.
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
    if (stolen > 0) {
      inventory.food = (inventory.food || 0) - stolen;
    }
  }

  if (threat.effects?.damage) {
    const { min, max } = threat.effects.damage;
    const base = randInt(rng, min, max);
    const effectiveDefense = threat.effects.defenseHalf
      ? Math.floor(defense / 2)
      : defense;
    dmg = Math.max(0, base - effectiveDefense);
    if (dmg > 0 && dmgMult !== 1) {
      dmg = Math.max(0, Math.round(dmg * dmgMult));
    }
    if (dmg > 0) {
      stats.hp = Math.max(0, (stats.hp ?? 100) - dmg);
    }
  }

  if (threat.effects?.sanityDrain) {
    const { min, max } = threat.effects.sanityDrain;
    let raw = randInt(rng, min, max);
    if (sanMult !== 1) {
      raw = Math.max(0, Math.round(raw * sanMult));
    }
    drained = raw;
  }

  if (threat.effects?.happinessDrain) {
    const { min, max } = threat.effects.happinessDrain;
    let raw = randInt(rng, min, max);
    if (sanMult !== 1) {
      raw = Math.max(0, Math.round(raw * sanMult));
    }
    resolveDrained = raw;
    if (resolveDrained > 0) {
      stats = applyEffect(stats, { happiness: -resolveDrained });
    }
  }

  // Sanity book-keeping.
  const hasSanityDrain = !!threat.effects?.sanityDrain;
  let sanityChange = hasSanityDrain
    ? 0
    : SURVIVAL.sanityFromThreat?.perEncounter || 0;
  if (dmg > 0 && !hasSanityDrain) {
    sanityChange += (SURVIVAL.sanityFromThreat?.perDamagePoint || 0) * dmg;
  }
  sanityChange -= drained;
  if (sanityChange !== 0) {
    stats = applyEffect(stats, { sanity: sanityChange });
  }

  const isPureSanityThreat =
    hasSanityDrain && !threat.effects?.stealFood && !threat.effects?.damage;

  if (stolen > 0) {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.flavorMessages, rng, { food: stolen }),
    });
  } else if (drained > 0 && resolveDrained > 0 && !dmg) {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.flavorMessages, rng, {
        sanity: drained,
        happiness: resolveDrained,
      }),
    });
  } else if (isPureSanityThreat && drained > 0) {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.flavorMessages, rng, { sanity: drained }),
    });
  } else if (dmg > 0 && drained > 0) {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.flavorMessages, rng, {
        damage: dmg,
        sanity: drained,
      }),
    });
  } else {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.emptyMessages, rng),
    });
  }
  if (dmg > 0 && !hasSanityDrain) {
    events.push({
      kind: "damage",
      message: pickFlavor(threat.damageMessages, rng, { damage: dmg }),
    });
  }

  return { inventory, stats, events, threatId: threat.id };
}
