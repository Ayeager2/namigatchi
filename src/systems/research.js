// Research system — "the rock whispers a recipe; you spend resources to listen."
// Reducer dispatches RESEARCH; this file owns the actual logic.
//
// Research is run-local: it resets on prestige. Each new awakening teaches
// the rock anew. (Permanent speed-up of research will come from Echo upgrades.)

import { getResearch, getAllResearch } from "../content/research.js";

// Returns { ok: bool, reason: string } — eligibility check.
export function canListen(state, researchId) {
  const r = getResearch(researchId);
  if (!r) return { ok: false, reason: "Unknown teaching." };

  if (state.run.researched?.[researchId]) {
    return { ok: false, reason: "Already learned." };
  }

  if (r.requires) {
    if (r.requires.hutBuilt && !state.run.built?.hut) {
      return { ok: false, reason: "The stone is silent without a roof above." };
    }
  }

  for (const [res, qty] of Object.entries(r.cost || {})) {
    if ((state.run.inventory[res] || 0) < qty) {
      return { ok: false, reason: "Not enough offerings." };
    }
  }

  return { ok: true };
}

// Returns { run, persistent, events } — same shape as gather/build.
export function performListen(state, researchId) {
  const r = getResearch(researchId);
  if (!r) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "researchFail", message: "Unknown teaching." }],
    };
  }

  const check = canListen(state, researchId);
  if (!check.ok) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "researchFail", message: check.reason }],
    };
  }

  // Spend resources
  const inventory = { ...state.run.inventory };
  for (const [res, qty] of Object.entries(r.cost)) {
    inventory[res] = (inventory[res] || 0) - qty;
  }

  // Mark learned
  const researched = {
    ...(state.run.researched || {}),
    [researchId]: { at: Date.now() },
  };

  const run = { ...state.run, inventory, researched };
  const persistent = state.persistent;

  const events = [{ kind: "research", message: r.onLearnedMessage }];

  return { run, persistent, events };
}

// Visible research = nodes whose `requires` are met (so the player can see
// what's available). Already-learned ones still show, marked complete.
export function getVisibleResearch(state) {
  return getAllResearch().filter((r) => {
    if (state.run.researched?.[r.id]) return true;
    if (r.requires?.hutBuilt && !state.run.built?.hut) return false;
    return true;
  });
}

// Aggregated bonuses from completed research — applied in gathering, etc.
export function getResearchBonuses(run) {
  let gatherBonus = 0;
  for (const id of Object.keys(run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.gatherBonus) gatherBonus += r.effect.gatherBonus;
  }
  return { gatherBonus };
}

// Whether a specific resource has been "unlocked" in the gather table by
// a completed research node.
export function isResourceUnlocked(run, resourceId) {
  for (const id of Object.keys(run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.addsResource === resourceId) return true;
  }
  return false;
}
