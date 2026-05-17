// Research system — "the rock whispers a recipe; you spend resources to listen."

import { getResearch, getAllResearch } from "../content/research.js";
import { decayForAction, survivalActive, boostStats } from "./survival.js";
import { computeEra } from "./era.js";

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
    if (r.requires.era && computeEra(state) < r.requires.era) {
      return { ok: false, reason: "The stone has not opened this teaching yet." };
    }
    if (r.requires.alignment) {
      const align = state.run.alignment || { good: 0, evil: 0 };
      if (r.requires.alignment.good && (align.good || 0) < r.requires.alignment.good) {
        return { ok: false, reason: "The stone has not opened this teaching yet." };
      }
      if (r.requires.alignment.evil && (align.evil || 0) < r.requires.alignment.evil) {
        return { ok: false, reason: "The stone has not opened this teaching yet." };
      }
    }
  }

  for (const [res, qty] of Object.entries(r.cost || {})) {
    if ((state.run.inventory[res] || 0) < qty) {
      return { ok: false, reason: "Not enough offerings." };
    }
  }

  return { ok: true };
}

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

  const inventory = { ...state.run.inventory };
  for (const [res, qty] of Object.entries(r.cost)) {
    inventory[res] = (inventory[res] || 0) - qty;
  }

  const researched = {
    ...(state.run.researched || {}),
    [researchId]: { at: Date.now() },
  };

  let run = { ...state.run, inventory, researched };
  const persistent = state.persistent;

  const events = [{ kind: "research", message: r.onLearnedMessage }];

  if (survivalActive({ ...state, run })) {
    run = { ...run, stats: decayForAction(run.stats || {}, "Research") };
    run = { ...run, stats: boostStats(run.stats, { happiness: +3, sanity: +3 }) };
  }

  return { run, persistent, events };
}

export function getVisibleResearch(state) {
  return getAllResearch().filter((r) => {
    if (state.run.researched?.[r.id]) return true;
    if (r.requires?.hutBuilt && !state.run.built?.hut) return false;
    if (r.requires?.era && computeEra(state) < r.requires.era) return false;
    // Alignment-gated nodes stay hidden until the silent counter is high
    // enough. The player never sees a number — the node simply appears
    // when something inside them has tipped.
    if (r.requires?.alignment) {
      const align = state.run.alignment || { good: 0, evil: 0 };
      if (r.requires.alignment.good && (align.good || 0) < r.requires.alignment.good) {
        return false;
      }
      if (r.requires.alignment.evil && (align.evil || 0) < r.requires.alignment.evil) {
        return false;
      }
    }
    return true;
  });
}

export function getResearchBonuses(run) {
  let gatherBonus = 0;
  for (const id of Object.keys(run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.gatherBonus) gatherBonus += r.effect.gatherBonus;
  }
  return { gatherBonus };
}

export function isResourceUnlocked(run, resourceId) {
  for (const id of Object.keys(run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.addsResource === resourceId) return true;
  }
  return false;
}
