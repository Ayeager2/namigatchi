// Survival system. Pure functions for stat decay, action effects, and gating.
// Reducer dispatches EAT/DRINK/REST; this file owns the logic.
//
// Stats only matter when the hut is built. Until then, survivalActive() is
// false and decay/penalties are skipped.
//
// Six stats:
//   hunger   — 0..100, high = bad. Rises with action.
//   thirst   — 0..100, high = bad. Rises with action.
//   energy   — 0..100, high = good. Falls with action.
//   hp       — 0..100, high = good. Falls from threats; restored by eat/rest.
//   happiness— 0..100, high = good. Resolve / daily wellbeing. Drains from
//              physical needs; rises from progression (build, research) and
//              comfort (eat, rest). Displayed in UI as "Resolve."
//   sanity   — 0..100, high = good. Mental stability. Affected ONLY by horror
//              events (threats, damage, future eldritch). Rises from progression.

import { SURVIVAL } from "../content/survival.js";
import { getResearch } from "../content/research.js";
import { getResourcesByCategory, getResource } from "../content/resources.js";

export function survivalActive(state) {
  return !!state.run.built?.hut;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Apply decay from a named action ("Gather", "Build", "Research").
// Also applies extra Happiness drain when physical needs are in the red.
// Sanity does NOT decay from actions — only from explicit events.
export function decayForAction(stats, kind) {
  const key = `per${kind}`;
  const decay = SURVIVAL[key];
  if (!decay) return stats;

  // Compute extra happiness drain from being in the red.
  let extraHappiness = 0;
  if ((stats.hunger ?? 0) >= SURVIVAL.penalties.hungerHigh) {
    extraHappiness += SURVIVAL.happinessPenalties.perRedHunger;
  }
  if ((stats.thirst ?? 0) >= SURVIVAL.penalties.thirstHigh) {
    extraHappiness += SURVIVAL.happinessPenalties.perRedThirst;
  }
  if ((stats.energy ?? 100) <= SURVIVAL.penalties.energyLow) {
    extraHappiness += SURVIVAL.happinessPenalties.perLowEnergy;
  }

  return {
    hunger: clamp((stats.hunger ?? 0) + (decay.hunger || 0), 0, 100),
    thirst: clamp((stats.thirst ?? 0) + (decay.thirst || 0), 0, 100),
    energy: clamp((stats.energy ?? 100) + (decay.energy || 0), 0, 100),
    hp: clamp((stats.hp ?? 100) + (decay.hp || 0), 0, 100),
    happiness: clamp(
      (stats.happiness ?? 50) + (decay.happiness || 0) + extraHappiness,
      0,
      100
    ),
    sanity: clamp((stats.sanity ?? 50) + (decay.sanity || 0), 0, 100),
  };
}

// Compute the gather yield multiplier given current stats.
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

// Whether the player can perform a gather right now.
export function canGather(state) {
  if (!survivalActive(state)) return { ok: true };
  const stats = state.run.stats || {};
  if ((stats.energy ?? 100) <= SURVIVAL.penalties.energyZero) {
    return { ok: false, reason: "Too exhausted. Rest first." };
  }
  return { ok: true };
}

// Apply an effect object to stats. Handles all six stat fields.
export function applyEffect(stats, effect) {
  return {
    hunger: clamp((stats.hunger ?? 0) + (effect.hunger || 0), 0, 100),
    thirst: clamp((stats.thirst ?? 0) + (effect.thirst || 0), 0, 100),
    energy: clamp((stats.energy ?? 100) + (effect.energy || 0), 0, 100),
    hp: clamp((stats.hp ?? 100) + (effect.hp || 0), 0, 100),
    happiness: clamp((stats.happiness ?? 50) + (effect.happiness || 0), 0, 100),
    sanity: clamp((stats.sanity ?? 50) + (effect.sanity || 0), 0, 100),
  };
}

// Mending research: extra HP recovery from healing actions.
function getHealBonus(state) {
  let bonus = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.healBonus) bonus += r.effect.healBonus;
  }
  return bonus;
}

// Cooking research: extra hunger reduction (nutrition multiplier-style).
function getCookingBonus(state) {
  let bonus = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.cookingBonus) bonus += r.effect.cookingBonus;
  }
  return bonus;
}

// For category-consuming actions (eat), pick which specific resource to consume.
// Strategy:
//   1. If a `preferredId` is provided AND in inventory, eat that.
//   2. Otherwise default: lowest tier / lowest nutrition first.
function pickFoodToConsume(state, category, preferredId) {
  const inventory = state.run.inventory || {};
  if (preferredId) {
    const candidates = getResourcesByCategory(category).filter(
      (r) => r.id === preferredId && (inventory[r.id] || 0) > 0
    );
    if (candidates.length > 0) return candidates[0];
    // Preferred not available — fall through to default.
  }
  const candidates = getResourcesByCategory(category)
    .filter((r) => (inventory[r.id] || 0) > 0)
    .sort((a, b) => (a.nutrition || 0) - (b.nutrition || 0));
  return candidates[0] || null;
}

// Eligibility for a survival action.
export function canPerformSurvivalAction(state, actionId) {
  if (!survivalActive(state)) {
    return { ok: false, reason: "No needs yet." };
  }
  const def = SURVIVAL.actions[actionId];
  if (!def) return { ok: false, reason: "Unknown action." };

  // Category-consuming actions (e.g., eat) need at least one food in inventory.
  if (def.consumesCategory) {
    const food = pickFoodToConsume(state, def.consumesCategory);
    if (!food) {
      return { ok: false, reason: def.missingMessage || "Missing resources." };
    }
  }

  // Fixed-cost actions (e.g., drink) need specific resources.
  for (const [res, qty] of Object.entries(def.cost || {})) {
    if ((state.run.inventory[res] || 0) < qty) {
      return { ok: false, reason: def.missingMessage || "Missing resources." };
    }
  }
  return { ok: true };
}

// Perform a survival action. Returns { run, persistent, events }.
// Optional opts: { preferredFoodId } — for eat, picks that food first.
export function performSurvivalAction(state, actionId, opts = {}) {
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

  // Resolve dynamic food consumption (category-based actions like Eat).
  let effect = def.effect ? { ...def.effect } : { ...(def.baseEffect || {}) };
  let message = def.message;
  if (def.consumesCategory) {
    const food = pickFoodToConsume(state, def.consumesCategory, opts.preferredFoodId);
    if (food) {
      inventory[food.id] = (inventory[food.id] || 0) - 1;
      const cookingBonus = getCookingBonus(state);
      const nutrition = (food.nutrition || 10) + cookingBonus;
      effect = { ...effect, hunger: -nutrition };
      message = (message || "")
        .replace("{icon}", food.icon || "")
        .replace("{name}", food.name?.toLowerCase() || "food");
    }
  }
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
  if (effect.hp && effect.hp > 0) {
    const heal = getHealBonus(state);
    if (heal > 0) effect.hp += heal;
  }

  const stats = applyEffect(state.run.stats || SURVIVAL.startValues, effect);

  return {
    run: { ...state.run, inventory, stats },
    persistent: state.persistent,
    events: [{ kind: def.logKind || "consume", message }],
  };
}

// Generic boost helper — any system can call this to nudge stats up/down.
// Returns new stats; never mutates.
export function boostStats(stats, change) {
  return applyEffect(stats || SURVIVAL.startValues, change);
}

// Initial stats when survival activates.
export function initialStats() {
  return { ...SURVIVAL.startValues };
}
