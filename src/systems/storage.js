// Storage system. Inventory caps + food spoilage.
//
// Caps: each resource declares an optional `baseCap` in content/resources.js.
// Buildings can declare `storageCaps: { resourceId: capIncrease }`. The
// effective cap is the sum. Resources without a baseCap are uncapped
// (fragments, tools — fragments are mystical, tools are qty 1 by design).
//
// Spoilage: food resources declare `spoilage: { perMinute, atCapMultiplier }`.
// On every TICK, processSpoilage walks held food and reduces it according
// to elapsed real time (with a cap on offline catch-up). Past-cap stockpiles
// spoil at the multiplier rate — food rots faster when you can't store it.
//
// Caps are CLAMPED on add, not enforced retroactively. If a save loaded
// from before caps existed has 200 wood, the player keeps it; subsequent
// gathers just don't add more until they're below cap.

import { getAllResources, getResource } from "../content/resources.js";
import { getAllBuildings } from "../content/buildings.js";

// Cap on how much offline spoilage we apply at once. Same idea as passive
// production catch-up — long absences shouldn't wipe stockpiles.
const MAX_CATCHUP_MIN = 30;

// Effective cap for a resource = baseCap + sum of storage from owned buildings.
// Returns Infinity if the resource has no baseCap (uncapped by design).
export function getResourceCap(state, resourceId) {
  const res = getResource(resourceId);
  if (!res || typeof res.baseCap !== "number") return Infinity;
  let cap = res.baseCap;
  for (const b of getAllBuildings()) {
    if (!state.run.built?.[b.id]) continue;
    const inc = b.storageCaps?.[resourceId];
    if (typeof inc === "number") cap += inc;
  }
  return cap;
}

// Clamp inventory to caps. Returns { inventory, overflow } — overflow is
// the per-resource amount that was lost. Caller decides whether to log it.
// Existing values above cap are PRESERVED (no retroactive trim) — clamping
// only blocks NEW additions past the cap.
export function clampToCap(inventory, state, prevInventory = {}) {
  const out = { ...inventory };
  const overflow = {};
  for (const [id, qty] of Object.entries(out)) {
    const cap = getResourceCap(state, id);
    if (cap === Infinity) continue;
    const prev = prevInventory[id] || 0;
    // Only clamp the NEW portion. Preserve existing oversupply.
    if (prev >= cap) {
      // Already at/above cap — don't accept any new additions of this type.
      if (qty > prev) {
        overflow[id] = qty - prev;
        out[id] = prev;
      }
    } else if (qty > cap) {
      overflow[id] = qty - cap;
      out[id] = cap;
    }
  }
  return { inventory: out, overflow };
}

// Process spoilage of food resources during TICK. Reads elapsed time from
// `run.lastSpoilTickAt`. Returns { run, events }.
export function processSpoilage(state) {
  const run = state.run;
  const now = Date.now();
  const lastAt = run.lastSpoilTickAt || now;
  const elapsedMs = Math.min(now - lastAt, MAX_CATCHUP_MIN * 60 * 1000);
  if (elapsedMs < 1000) {
    return {
      run: { ...run, lastSpoilTickAt: now },
      events: [],
    };
  }
  const elapsedMin = elapsedMs / 60000;

  const inventory = { ...(run.inventory || {}) };
  const spoilAccum = { ...(run.spoilAccum || {}) };
  const events = [];
  let changed = false;

  for (const res of getAllResources()) {
    if (!res.spoilage) continue;
    const have = inventory[res.id] || 0;
    if (have <= 0) continue;
    const cap = getResourceCap(state, res.id);
    const atCap = cap !== Infinity && have >= cap;
    const ratePerMin =
      res.spoilage.perMinute *
      (atCap ? res.spoilage.atCapMultiplier || 1 : 1);
    spoilAccum[res.id] = (spoilAccum[res.id] || 0) + ratePerMin * elapsedMin;
    const whole = Math.floor(spoilAccum[res.id]);
    if (whole > 0) {
      const lost = Math.min(have, whole);
      inventory[res.id] = have - lost;
      spoilAccum[res.id] -= lost;
      events.push({
        kind: "resource",
        message: `🦠 ${lost} ${res.name.toLowerCase()} spoiled.`,
      });
      changed = true;
    } else if (spoilAccum[res.id] !== (run.spoilAccum?.[res.id] || 0)) {
      changed = true;
    }
  }

  return {
    run: { ...run, inventory, spoilAccum, lastSpoilTickAt: now },
    events: changed ? events : [],
  };
}

// Helper: cap status for a resource — used by the inventory UI to color
// the count cell. Returns "ok" | "warn" (>=80% of cap) | "full" (at cap)
// | "uncapped".
export function getCapStatus(state, resourceId) {
  const cap = getResourceCap(state, resourceId);
  if (cap === Infinity) return { status: "uncapped", cap: Infinity };
  const have = state.run.inventory?.[resourceId] || 0;
  if (have >= cap) return { status: "full", cap, have };
  if (have / cap >= 0.8) return { status: "warn", cap, have };
  return { status: "ok", cap, have };
}

// Compute the spoilage status for an inventory row. Used by the inventory UI
// to render a countdown bar next to spoiling foods.
//
// Returns { spoils, perMinute, atCap, secondsUntilNextLoss, percent } where:
//   spoils — boolean, false for non-food / non-spoiling resources
//   perMinute — current effective spoil rate
//   atCap — true if the at-cap multiplier is active
//   secondsUntilNextLoss — how long until the accumulator crosses 1.0
//   percent — 0..1 progress toward the next loss (for the bar)
export function getSpoilStatus(state, resourceId) {
  const res = (state.run.inventory && state.run.inventory[resourceId] !== undefined)
    ? null : null; // resolve below
  // We need the full RESOURCE def, not the inventory slot — read directly.
  // (Lazy import path-style to dodge any circular concerns.)
  // eslint-disable-next-line no-undef
  const RESOURCES_MODULE = (typeof window !== "undefined" && window.__namigatchi_resources)
    ? window.__namigatchi_resources
    : null;
  // Fallback: caller will use getResource directly — see InventoryPanel.

  return null; // placeholder — InventoryPanel uses local helper instead
}

// Better: a pure helper that takes the resource definition + cap status +
// current accumulator. Caller pulls the def from RESOURCES.
//   resource: the resource def from RESOURCES (must have spoilage)
//   capStatus: result of getCapStatus(state, id)
//   accum: current run.spoilAccum[id] || 0
// Returns { spoils, perMinute, atCap, secondsUntilNextLoss, percent }.
export function spoilStatusFromDef(resource, capStatus, accum) {
  if (!resource?.spoilage) return { spoils: false };
  const atCap = capStatus.status === "full";
  const perMinute =
    resource.spoilage.perMinute *
    (atCap ? resource.spoilage.atCapMultiplier || 1 : 1);
  if (perMinute <= 0) return { spoils: false };
  const remaining = Math.max(0, 1 - (accum || 0));
  const secondsUntilNextLoss = (remaining / perMinute) * 60;
  const percent = Math.max(0, Math.min(1, accum || 0));
  return {
    spoils: true,
    perMinute,
    atCap,
    secondsUntilNextLoss,
    percent,
  };
}
