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
