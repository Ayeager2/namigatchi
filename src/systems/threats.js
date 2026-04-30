// Threat system — rolls random encounters per gather.
// Each gather, after the gather itself resolves, this system gets a chance
// to fire. If it does, a threat is picked, defense is computed, the threat's
// effects are applied (with defense mitigation), and log events are produced.
//
// Threats are disabled until their `requires` gates are met (e.g., hut built).
// A grace period (minGathersAfterGate) gives the player breathing room
// immediately after activation.

import { getAllThreats } from "../content/threats.js";
import { getResearch } from "../content/research.js";
import { randInt } from "../util/rng.js";

// Aggregate defense from all sources (research, future buildings).
export function getDefense(state) {
  let def = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.defense) def += r.effect.defense;
  }
  for (const id of Object.keys(state.run.built || {})) {
    // Future: buildings can grant defense via building.effect.defense
  }
  return def;
}

export function getFoodStealReduction(state) {
  let red = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.foodStealReduction) red += r.effect.foodStealReduction;
  }
  return red;
}

// Whether this threat is active for this state (gate met + grace period).
function isThreatActive(state, threat) {
  if (threat.requires?.hutBuilt && !state.run.built?.hut) return false;
  // Grace period: count gathers since hut was built. We don't track that
  // exactly — approximate with total gather count threshold.
  const minGathers = threat.minGathersAfterGate ?? 0;
  if ((state.run.gatherCount || 0) < minGathers) return false;
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

// Returns { run, persistent, events } — modifies inventory + stats and emits
// log events. If no threat fires, returns null (caller should noop).
export function rollThreatEncounter(state, rng = Math.random) {
  const candidates = getAllThreats().filter((t) => isThreatActive(state, t));
  if (candidates.length === 0) return null;

  for (const threat of candidates) {
    if (rng() >= threat.encounterChance) continue;

    // A threat fires.
    return resolveThreat(state, threat, rng);
  }

  return null;
}

function resolveThreat(state, threat, rng) {
  const inventory = { ...state.run.inventory };
  const stats = { ...(state.run.stats || {}) };
  const events = [];

  const defense = getDefense(state);
  const foodReduction = getFoodStealReduction(state);

  let stolen = 0;
  let dmg = 0;

  // Steal food
  if (threat.effects?.stealFood) {
    const { min, max } = threat.effects.stealFood;
    const base = randInt(rng, min, max);
    const wanted = Math.max(0, base - defense - foodReduction);
    stolen = Math.min(wanted, inventory.food || 0);
    if (stolen > 0) {
      inventory.food = (inventory.food || 0) - stolen;
    }
  }

  // Damage
  if (threat.effects?.damage) {
    const { min, max } = threat.effects.damage;
    const base = randInt(rng, min, max);
    dmg = Math.max(0, base - defense);
    if (dmg > 0) {
      stats.hp = Math.max(0, (stats.hp ?? 100) - dmg);
    }
  }

  // Build the log message(s)
  if (stolen > 0) {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.flavorMessages, rng, { food: stolen }),
    });
  } else {
    events.push({
      kind: "threat",
      message: pickFlavor(threat.emptyMessages, rng),
    });
  }
  if (dmg > 0) {
    events.push({
      kind: "damage",
      message: pickFlavor(threat.damageMessages, rng, { damage: dmg }),
    });
  }

  return { inventory, stats, events, threatId: threat.id };
}
