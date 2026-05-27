// Random events system.

import { getAllEvents, getEvent } from "../content/events.js";
import { applyEffect } from "./survival.js";
import { totalWater, spendWater } from "../content/resources.js";
import { computeEra } from "./era.js";

export const INTERVAL_MS = 60 * 1000;
const GATHER_EVENT_CHANCE = 0.04;
const NOTHING_WEIGHT = 80;

function severityMultiplier(state) {
  const era = computeEra(state);
  return Math.max(1.0, 1 + (era - 1) * 0.5);
}

function isEventEligible(state, event, triggerType) {
  if (event.trigger !== "any" && event.trigger !== triggerType) return false;
  const era = computeEra(state);
  if (event.requires?.era && era < event.requires.era) return false;
  if (event.requires?.hutBuilt && !state.run.built?.hut) return false;
  if (
    event.requires?.hasBuilding &&
    !state.run.built?.[event.requires.hasBuilding]
  ) {
    return false;
  }
  if (event.requires?.notHasBuilding) {
    const ids = Array.isArray(event.requires.notHasBuilding)
      ? event.requires.notHasBuilding
      : [event.requires.notHasBuilding];
    for (const id of ids) {
      if (state.run.built?.[id]) return false;
    }
  }
  if (event.requires?.alignment) {
    const align = state.run.alignment || { good: 0, evil: 0 };
    if (event.requires.alignment.good && (align.good || 0) < event.requires.alignment.good) {
      return false;
    }
    if (event.requires.alignment.evil && (align.evil || 0) < event.requires.alignment.evil) {
      return false;
    }
  }
  const cd = state.run.events?.cooldowns?.[event.id] || 0;
  if (Date.now() < cd) return false;
  return true;
}

function pickEventFromPool(pool, rng, includeNothing = false) {
  const total =
    pool.reduce((s, e) => s + (e.weight || 0), 0) +
    (includeNothing ? NOTHING_WEIGHT : 0);
  if (total === 0) return null;
  let r = rng() * total;
  if (includeNothing) {
    if (r < NOTHING_WEIGHT) return null;
    r -= NOTHING_WEIGHT;
  }
  for (const e of pool) {
    if (r < (e.weight || 0)) return e;
    r -= e.weight || 0;
  }
  return null;
}

function applyEventEffects(state, effects, multiplier = 1.0) {
  const run = {
    ...state.run,
    inventory: { ...state.run.inventory },
    stats: { ...(state.run.stats || {}) },
    alignment: { ...(state.run.alignment || { good: 0, evil: 0 }) },
    activePests: { ...(state.run.activePests || {}) },
  };
  const persistent = { ...state.persistent };
  const events = [];

  if (effects.inventory) {
    for (const [k, v] of Object.entries(effects.inventory)) {
      const delta = Math.round(v * multiplier);
      // Virtual "water" key — grants land as water_muddy (the realistic
      // tier strangers/events would deliver). Negative deltas drain from
      // lowest tier first via spendWater. See ERA_PLAN.md "Water tiers".
      if (k === "water") {
        if (delta >= 0) {
          run.inventory.water_muddy =
            (run.inventory.water_muddy || 0) + delta;
        } else {
          const toSpend = Math.min(totalWater(run.inventory), -delta);
          run.inventory = spendWater(run.inventory, toSpend);
        }
        continue;
      }
      run.inventory[k] = Math.max(0, (run.inventory[k] || 0) + delta);
    }
  }

  if (effects.stats) {
    const scaled = {};
    for (const [k, v] of Object.entries(effects.stats)) {
      scaled[k] = k === "sanity" ? v : v * multiplier;
    }
    run.stats = applyEffect(run.stats, scaled);
  }

  if (effects.alignment) {
    run.alignment.good = (run.alignment.good || 0) + (effects.alignment.good || 0);
    run.alignment.evil = (run.alignment.evil || 0) + (effects.alignment.evil || 0);
  }

  if (effects.setsPest) {
    const { pestId, durationMs, intensity } = effects.setsPest;
    if (pestId && durationMs) {
      run.activePests[pestId] = {
        until: Date.now() + durationMs,
        intensity: intensity || 1,
      };
    }
  }

  if (effects.log) {
    events.push({ kind: effects.log.kind, message: effects.log.message });
  }

  return { run, persistent, events };
}

function stampCooldown(run, eventId, ms) {
  const cooldowns = { ...(run.events?.cooldowns || {}), [eventId]: Date.now() + ms };
  return {
    ...run,
    events: { ...(run.events || {}), cooldowns },
  };
}

export function rollIntervalEvent(state, rng = Math.random) {
  if (state.run.activeEvent) return null;
  const pool = getAllEvents().filter((e) => isEventEligible(state, e, "interval"));
  const picked = pickEventFromPool(pool, rng, true);
  if (!picked) return null;
  return fireEvent(state, picked, rng);
}

export function rollGatherEvent(state, rng = Math.random) {
  if (state.run.activeEvent) return null;
  if (rng() >= GATHER_EVENT_CHANCE) return null;
  const pool = getAllEvents().filter((e) => isEventEligible(state, e, "gather"));
  const picked = pickEventFromPool(pool, rng, false);
  if (!picked) return null;
  return fireEvent(state, picked, rng);
}

function fireEvent(state, event, rng) {
  const multiplier = severityMultiplier(state);

  if (event.choices && event.choices.length > 0) {
    let run = { ...state.run, activeEvent: { id: event.id, firedAt: Date.now() } };
    run = stampCooldown(run, event.id, event.cooldownMs || 0);
    return {
      run,
      persistent: state.persistent,
      events: [{ kind: "event_choice", message: `❓ ${event.flavor}` }],
    };
  }

  const result = applyEventEffects(state, event.onFire?.effects || {}, multiplier);
  result.run = stampCooldown(result.run, event.id, event.cooldownMs || 0);
  result.persistent = {
    ...result.persistent,
    lifetimeStats: {
      ...result.persistent.lifetimeStats,
      eventsTriggered: (result.persistent.lifetimeStats.eventsTriggered || 0) + 1,
    },
  };
  return result;
}

export function respondToActiveEvent(state, choiceId) {
  const eventId = state.run.activeEvent?.id;
  if (!eventId) {
    return { run: state.run, persistent: state.persistent, events: [] };
  }
  const event = getEvent(eventId);
  if (!event) {
    return {
      run: { ...state.run, activeEvent: null },
      persistent: state.persistent,
      events: [],
    };
  }
  const choice = event.choices?.find((c) => c.id === choiceId);
  if (!choice) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "event_choice", message: "Unknown response." }],
    };
  }

  if (choice.cost) {
    for (const [res, qty] of Object.entries(choice.cost)) {
      const have =
        res === "water" ? totalWater(state.run.inventory) : (state.run.inventory[res] || 0);
      if (have < qty) {
        return {
          run: state.run,
          persistent: state.persistent,
          events: [{
            kind: "actionFail",
            message: choice.missingMessage || "You haven't enough to spare.",
          }],
        };
      }
    }
  }

  let inventory = { ...state.run.inventory };
  if (choice.cost) {
    for (const [res, qty] of Object.entries(choice.cost)) {
      if (res === "water") {
        inventory = spendWater(inventory, qty);
        continue;
      }
      inventory[res] = (inventory[res] || 0) - qty;
    }
  }

  const multiplier = severityMultiplier(state);
  const stateBeforeEffect = { ...state, run: { ...state.run, inventory } };
  const result = applyEventEffects(stateBeforeEffect, choice.effect || {}, multiplier);

  result.run = { ...result.run, activeEvent: null };
  result.persistent = {
    ...result.persistent,
    lifetimeStats: {
      ...result.persistent.lifetimeStats,
      eventsTriggered: (result.persistent.lifetimeStats.eventsTriggered || 0) + 1,
    },
  };
  return result;
}

export function maybeRollInterval(state, rng = Math.random) {
  const now = Date.now();
  const last = state.run.events?.lastIntervalMs ?? 0;
  if (now - last < INTERVAL_MS) return null;

  let next = rollIntervalEvent(state, rng);
  if (!next) {
    return {
      run: {
        ...state.run,
        events: { ...(state.run.events || {}), lastIntervalMs: now },
      },
      persistent: state.persistent,
      events: [],
    };
  }
  next.run = {
    ...next.run,
    events: { ...(next.run.events || {}), lastIntervalMs: now },
  };
  return next;
}
