// Random events system. Two trigger paths:
//   - Real-time interval: every INTERVAL_MS, the TICK action rolls.
//   - Action-triggered: each gather has a small chance to roll for "gather" events.
//
// Events come in two flavors:
//   - Fire-and-react: effects apply immediately, log entry written.
//   - Choice: sets state.run.activeEvent; UI shows modal; player picks; effects apply.
//
// Severity scales with era — numeric effect values are multiplied by an era
// factor. Sanity changes are NEVER scaled (they remain small in early game,
// per design — the player should rarely lose sanity at first).

import { getAllEvents, getEvent } from "../content/events.js";
import { applyEffect } from "./survival.js";
import { computeEra } from "./era.js";

// Roll an interval event approximately every minute of real time.
export const INTERVAL_MS = 60 * 1000;

// Action-triggered: each gather has this base chance to attempt an event roll.
const GATHER_EVENT_CHANCE = 0.04;

// "Nothing happens" weight added to interval rolls so most ticks are silent.
const NOTHING_WEIGHT = 80;

// Severity scaling — multiplier applied to numeric effect values based on era.
// Era 1 baseline is 1.0; each era beyond multiplies. Sanity is exempt.
function severityMultiplier(state) {
  const era = computeEra(state);
  return Math.max(1.0, 1 + (era - 1) * 0.5);
}

function isEventEligible(state, event, triggerType) {
  // Trigger match
  if (event.trigger !== "any" && event.trigger !== triggerType) return false;
  // Era / hut / building gate
  const era = computeEra(state);
  if (event.requires?.era && era < event.requires.era) return false;
  if (event.requires?.hutBuilt && !state.run.built?.hut) return false;
  if (
    event.requires?.hasBuilding &&
    !state.run.built?.[event.requires.hasBuilding]
  ) {
    return false;
  }
  // Cooldown
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
    if (r < NOTHING_WEIGHT) return null; // nothing happens
    r -= NOTHING_WEIGHT;
  }
  for (const e of pool) {
    if (r < (e.weight || 0)) return e;
    r -= e.weight || 0;
  }
  return null;
}

// Apply effects from an event. Pure — returns new run/persistent and log events.
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

  // Inventory deltas — scaled with severity, rounded.
  if (effects.inventory) {
    for (const [k, v] of Object.entries(effects.inventory)) {
      const delta = Math.round(v * multiplier);
      run.inventory[k] = Math.max(0, (run.inventory[k] || 0) + delta);
    }
  }

  // Stats deltas — sanity NEVER scales. Other stats DO scale.
  if (effects.stats) {
    const scaled = {};
    for (const [k, v] of Object.entries(effects.stats)) {
      scaled[k] = k === "sanity" ? v : v * multiplier;
    }
    run.stats = applyEffect(run.stats, scaled);
  }

  // Alignment — does NOT scale; choices have fixed weight.
  if (effects.alignment) {
    run.alignment.good = (run.alignment.good || 0) + (effects.alignment.good || 0);
    run.alignment.evil = (run.alignment.evil || 0) + (effects.alignment.evil || 0);
  }

  // Pest activation — durationMs is NOT scaled; pests are environmental,
  // not severity-driven. Sets `until` from current time + duration.
  if (effects.setsPest) {
    const { pestId, durationMs, intensity } = effects.setsPest;
    if (pestId && durationMs) {
      run.activePests[pestId] = {
        until: Date.now() + durationMs,
        intensity: intensity || 1,
      };
    }
  }

  // Log entry
  if (effects.log) {
    events.push({ kind: effects.log.kind, message: effects.log.message });
  }

  return { run, persistent, events };
}

// Stamp a cooldown for an event after it fires.
function stampCooldown(run, eventId, ms) {
  const cooldowns = { ...(run.events?.cooldowns || {}), [eventId]: Date.now() + ms };
  return {
    ...run,
    events: { ...(run.events || {}), cooldowns },
  };
}

// Try to roll an interval event. Called by the TICK action.
// Returns { run, persistent, events, activeEvent } or null if nothing to do.
export function rollIntervalEvent(state, rng = Math.random) {
  // Don't fire if a choice event is already pending.
  if (state.run.activeEvent) return null;

  const pool = getAllEvents().filter((e) => isEventEligible(state, e, "interval"));
  const picked = pickEventFromPool(pool, rng, /* includeNothing */ true);
  if (!picked) return null;

  return fireEvent(state, picked, rng);
}

// Try to roll a gather-triggered event. Called from gathering.js after a gather.
export function rollGatherEvent(state, rng = Math.random) {
  if (state.run.activeEvent) return null;
  if (rng() >= GATHER_EVENT_CHANCE) return null;

  const pool = getAllEvents().filter((e) => isEventEligible(state, e, "gather"));
  const picked = pickEventFromPool(pool, rng, /* includeNothing */ false);
  if (!picked) return null;

  return fireEvent(state, picked, rng);
}

// Fire a specific event — apply onFire effects or set as activeEvent for choice.
function fireEvent(state, event, rng) {
  const multiplier = severityMultiplier(state);

  if (event.choices && event.choices.length > 0) {
    // Choice event — set as active, don't apply anything yet.
    let run = { ...state.run, activeEvent: { id: event.id, firedAt: Date.now() } };
    run = stampCooldown(run, event.id, event.cooldownMs || 0);
    return {
      run,
      persistent: state.persistent,
      events: [
        {
          kind: "event_choice",
          message: `❓ ${event.flavor}`,
        },
      ],
    };
  }

  // Fire-and-react
  const result = applyEventEffects(
    state,
    event.onFire?.effects || {},
    multiplier
  );
  result.run = stampCooldown(result.run, event.id, event.cooldownMs || 0);
  // Track persistent count
  result.persistent = {
    ...result.persistent,
    lifetimeStats: {
      ...result.persistent.lifetimeStats,
      eventsTriggered:
        (result.persistent.lifetimeStats.eventsTriggered || 0) + 1,
    },
  };
  return result;
}

// Player picked a choice on the active event. Apply that choice's effect.
// Called by RESPOND_TO_EVENT action.
export function respondToActiveEvent(state, choiceId) {
  const eventId = state.run.activeEvent?.id;
  if (!eventId) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [],
    };
  }
  const event = getEvent(eventId);
  if (!event) {
    // Stale — clear it.
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
      events: [
        { kind: "event_choice", message: "Unknown response." },
      ],
    };
  }

  // Cost check
  if (choice.cost) {
    for (const [res, qty] of Object.entries(choice.cost)) {
      if ((state.run.inventory[res] || 0) < qty) {
        return {
          run: state.run,
          persistent: state.persistent,
          events: [
            {
              kind: "actionFail",
              message: choice.missingMessage || "You haven't enough to spare.",
            },
          ],
        };
      }
    }
  }

  // Spend cost
  const inventory = { ...state.run.inventory };
  if (choice.cost) {
    for (const [res, qty] of Object.entries(choice.cost)) {
      inventory[res] = (inventory[res] || 0) - qty;
    }
  }

  // Apply effects (alignment is unscaled)
  const multiplier = severityMultiplier(state);
  const stateBeforeEffect = {
    ...state,
    run: { ...state.run, inventory },
  };
  const result = applyEventEffects(
    stateBeforeEffect,
    choice.effect || {},
    multiplier
  );

  // Clear the active event
  result.run = { ...result.run, activeEvent: null };
  result.persistent = {
    ...result.persistent,
    lifetimeStats: {
      ...result.persistent.lifetimeStats,
      eventsTriggered:
        (result.persistent.lifetimeStats.eventsTriggered || 0) + 1,
    },
  };
  return result;
}

// Called on TICK to advance interval timing. Returns the result if an event
// fires this tick, or null otherwise.
export function maybeRollInterval(state, rng = Math.random) {
  const now = Date.now();
  const last = state.run.events?.lastIntervalMs ?? 0;
  if (now - last < INTERVAL_MS) return null;

  // Update lastIntervalMs even if no event fires (so we don't catch up by spam).
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
  // Stamp lastIntervalMs on the result.
  next.run = {
    ...next.run,
    events: { ...(next.run.events || {}), lastIntervalMs: now },
  };
  return next;
}
