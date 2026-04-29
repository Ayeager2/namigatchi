// Survival system. Pure functions for stat decay, action effects, and gating.
// Reducer dispatches EAT/DRINK/REST; this file owns the logic.
//
// Stats only matter when the hut is built. Until then, survivalActive() is
// false and decay/penalties are skipped. This keeps Era 0 frictionless.

import { SURVIVAL } from "../content/survival.js";

// Whether survival mechanics are active for this state.
export function survivalActive(state) {
  return !!state.run.built?.hut;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Apply decay from a named action ("Gather", "Build", "Research").
// Returns new stats object; never mutates.
export function decayForAction(stats, kind) {
  const key = `per${kind}`;
  const decay = SURVIVAL[key];
  if (!decay) return stats;
  return {
    hunger: clamp((stats.hunger ?? 0) + (decay.hunger || 0), 0, 100),
    thirst: clamp((stats.thirst ?? 0) + (decay.thirst || 0), 0, 100),
    energy: clamp((stats.energy ?? 100) + (decay.energy || 0), 0, 100),
  };
}

// Compute the gather yield multiplier given current stats. Higher hunger/
// thirst lower yields; low energy lowers yields.
export function getYieldMultiplier(stats) {
  if (!stats) return 1.0;
  let mult = 1.0;
  if (stats.hunger >= SURVIVAL.penalties.hungerHigh) {
    mult *= SURVIVAL.yieldMultipliers.hungerHigh;
  }
  if (stats.thirst >= SURVIVAL.penalties.thirstHigh) {
    mult *= SURVIVAL.yieldMultipliers.thirstHigh;
  }
  if (stats.energy <= SURVIVAL.penalties.energyLow) {
    mult *= SURVIVAL.yieldMultipliers.energyLow;
  }
  return mult;
}

// Whether the player can perform a gather right now. When energy is exhausted,
// gathering is blocked — the player must rest first.
export function canGather(state) {
  if (!survivalActive(state)) return { ok: true };
  const stats = state.run.stats || {};
  if ((stats.energy ?? 100) <= SURVIVAL.penalties.energyZero) {
    return { ok: false, reason: "Too exhausted. Rest first." };
  }
  return { ok: true };
}

// Apply an effect object to stats. { hunger: -25, energy: +30, ... }
function applyEffect(stats, effect) {
  return {
    hunger: clamp((stats.hunger ?? 0) + (effect.hunger || 0), 0, 100),
    thirst: clamp((stats.thirst ?? 0) + (effect.thirst || 0), 0, 100),
    energy: clamp((stats.energy ?? 100) + (effect.energy || 0), 0, 100),
  };
}

// Eligibility for a survival action. Returns { ok, reason }.
export function canPerformSurvivalAction(state, actionId) {
  if (!survivalActive(state)) {
    return { ok: false, reason: "No needs yet." };
  }
  const def = SURVIVAL.actions[actionId];
  if (!def) return { ok: false, reason: "Unknown action." };

  for (const [res, qty] of Object.entries(def.cost || {})) {
    if ((state.run.inventory[res] || 0) < qty) {
      return { ok: false, reason: def.missingMessage || "Missing resources." };
    }
  }
  return { ok: true };
}

// Perform a survival action. Returns { run, persistent, events }.
export function performSurvivalAction(state, actionId) {
  const def = SURVIVAL.actions[actionId];
  if (!def) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "actionFail", message: "Unknown action." }],
    };
  }

  const check = canPerformSurvivalAction(state, actionId);
  if (!check.ok) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "actionFail", message: check.reason }],
    };
  }

  // Spend cost
  const inventory = { ...state.run.inventory };
  for (const [res, qty] of Object.entries(def.cost || {})) {
    inventory[res] = (inventory[res] || 0) - qty;
  }

  // Apply effect, plus any building bonus
  let effect = { ...def.effect };
  let message = def.message;
  if (def.bonusFromBuilding) {
    for (const [bid, bonus] of Object.entries(def.bonusFromBuilding)) {
      if (state.run.built?.[bid]) {
        for (const k of Object.keys(bonus)) {
          effect[k] = (effect[k] || 0) + bonus[k];
        }
        if (bid === "firepit" && def.messageWithFirepit) {
          message = def.messageWithFirepit;
        }
      }
    }
  }
  const stats = applyEffect(state.run.stats || SURVIVAL.startValues, effect);

  return {
    run: { ...state.run, inventory, stats },
    persistent: state.persistent,
    events: [{ kind: def.logKind || "consume", message }],
  };
}

// Initial stats when survival activates.
export function initialStats() {
  return { ...SURVIVAL.startValues };
}
