// Passive production system. Reducer's TICK case calls this every 15s.
//
// Buildings can declare `passiveProduce: { resource: { perMinute, ... }, ... }`.
// On each tick, real-time elapsed since `run.lastPassiveTickAt` is converted
// to a fractional production amount per resource, accumulated, and whole
// units spilled into inventory. Fractional carry-over lives in `run.passiveAccum`
// so a Garden producing 3 grubs/min on a 15s tick (0.75 grubs/tick) doesn't
// silently lose the 0.75.
//
// Catch-up: if the player closes the tab and returns hours later, we cap the
// elapsed delta at MAX_CATCHUP_MIN. Vacation farming is bounded but a real
// "I left it alone overnight" still gives meaningful return.
//
// Pests modulate production. The bird flock pest, while active, halves Garden
// output (the birds eat the seeds). Modulators are read from
// `getProductionModulators(run)` so new pests can plug in declaratively.

import { getAllBuildings } from "../content/buildings.js";

// Cap on how much offline time we credit at once. Prevents the player from
// getting hours of overnight resources from a 30-second-pause-while-typing
// glitch, but still rewards genuine multi-hour absences modestly.
export const MAX_CATCHUP_MIN = 30;

// Threshold below which we don't bother emitting a "you got X" log entry.
// Avoids log spam when 0.25/min trickles produce a single grub every 4 minutes.
const LOG_DROP_THRESHOLD = 1;

// Returns { multiplier: 1.0 } per resource. Pests can drag this down.
function getProductionModulators(run) {
  const mods = {};
  // Bird flock: while present, Garden output halves. We model this as
  // "any food production is halved" so it generalizes to future veggie
  // patches too.
  if (run.activePests?.birdFlock?.until > Date.now()) {
    mods.food = (mods.food ?? 1) * 0.5;
  }
  return mods;
}

// Sum production rates across all owned buildings, applying any modulators.
// Returns { resourceId: perMinute }.
export function getProductionRates(run) {
  const rates = {};
  for (const b of getAllBuildings()) {
    if (!run.built?.[b.id]) continue;
    if (!b.passiveProduce) continue;
    for (const [res, conf] of Object.entries(b.passiveProduce)) {
      const perMin = conf.perMinute || 0;
      rates[res] = (rates[res] || 0) + perMin;
    }
  }
  // Apply modulators (pests, etc.).
  const mods = getProductionModulators(run);
  for (const res of Object.keys(rates)) {
    if (typeof mods[res] === "number") rates[res] *= mods[res];
  }
  return rates;
}

// Process passive production. Returns { run, events } — pure.
// Called from the reducer's TICK case BEFORE the events roll, so newly
// produced resources are visible to events that read inventory.
export function applyPassiveProduction(state) {
  const run = state.run;
  const rates = getProductionRates(run);
  // No production sources? Don't even update the timestamp — keeps state
  // diffs minimal until something actually starts producing.
  if (Object.keys(rates).length === 0) return { run, events: [] };

  const now = Date.now();
  const lastAt = run.lastPassiveTickAt || now;
  // Cap elapsed time to prevent vacation farming.
  const elapsedMs = Math.min(now - lastAt, MAX_CATCHUP_MIN * 60 * 1000);
  // If less than ~250ms passed (multiple TICKs in a row), skip — saves work.
  if (elapsedMs < 250) {
    return {
      run: { ...run, lastPassiveTickAt: now },
      events: [],
    };
  }
  const elapsedMin = elapsedMs / 60000;

  const inventory = { ...(run.inventory || {}) };
  const accum = { ...(run.passiveAccum || {}) };
  const events = [];

  // Aggregate per-resource gains so we emit one log line per resource even
  // if multiple buildings produce the same resource.
  const gains = {};
  for (const [res, perMin] of Object.entries(rates)) {
    if (perMin <= 0) continue;
    accum[res] = (accum[res] || 0) + perMin * elapsedMin;
    const whole = Math.floor(accum[res]);
    if (whole > 0) {
      inventory[res] = (inventory[res] || 0) + whole;
      accum[res] -= whole;
      gains[res] = (gains[res] || 0) + whole;
    }
  }

  // Emit a single "you found X" line per resource that crossed the threshold.
  // Below threshold it just accumulates silently — the player sees the number
  // climb in inventory without log spam.
  if (Object.keys(gains).length > 0) {
    for (const [res, qty] of Object.entries(gains)) {
      if (qty < LOG_DROP_THRESHOLD) continue;
      events.push({
        kind: "resource",
        message: passiveLogLine(res, qty),
      });
    }
  }

  return {
    run: {
      ...run,
      inventory,
      passiveAccum: accum,
      lastPassiveTickAt: now,
    },
    events,
  };
}

// Flavored log line per resource. Falls back to a generic line for new types.
function passiveLogLine(res, qty) {
  const lines = {
    water: `💧 The well yields water. +${qty}.`,
    food: `🪱 The garden gives. +${qty} grub${qty !== 1 ? "s" : ""}.`,
  };
  return lines[res] || `+${qty} ${res}`;
}

// Clear pests whose `until` has passed. Returns { run, events } — events
// announce the pest leaving so the player gets closure.
export function clearStalePests(run) {
  const active = run.activePests || {};
  const remaining = {};
  const events = [];
  let changed = false;
  for (const [id, pest] of Object.entries(active)) {
    if (pest && pest.until && pest.until > Date.now()) {
      remaining[id] = pest;
    } else {
      changed = true;
      events.push({ kind: "event_good", message: pestExitLine(id) });
    }
  }
  if (!changed) return { run, events: [] };
  return { run: { ...run, activePests: remaining }, events };
}

function pestExitLine(id) {
  const lines = {
    birdFlock: "🦅 The flock has gone. The garden grows quiet again.",
  };
  return lines[id] || `The ${id} has gone.`;
}

// Whether a specific pest is currently active. Used by gathering / UI.
export function isPestActive(run, pestId) {
  const p = run.activePests?.[pestId];
  return !!(p && p.until && p.until > Date.now());
}
