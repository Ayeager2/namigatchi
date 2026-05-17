// Spells system. Pure functions for spell eligibility + casting.

import { getSpell, getAllSpells } from "../content/spells.js";
import { applyEffect } from "./survival.js";
import { computeEra } from "./era.js";

export function canCastSpell(state, spellId) {
  const spell = getSpell(spellId);
  if (!spell) return { ok: false, reason: "Unknown spell." };

  if (spell.requires?.era) {
    if (computeEra(state) < spell.requires.era) {
      return { ok: false, reason: "The stone has not opened this yet." };
    }
  }
  if (spell.requires?.researched) {
    if (!state.run.researched?.[spell.requires.researched]) {
      return { ok: false, reason: "Spell not learned." };
    }
  }
  if (spell.requires?.alignment) {
    const align = state.run.alignment || { good: 0, evil: 0 };
    if (spell.requires.alignment.good && (align.good || 0) < spell.requires.alignment.good) {
      return { ok: false, reason: "Not the soul for this." };
    }
    if (spell.requires.alignment.evil && (align.evil || 0) < spell.requires.alignment.evil) {
      return { ok: false, reason: "Not the soul for this." };
    }
  }
  if (spell.cost?.fragments) {
    if ((state.run.inventory?.fragments || 0) < spell.cost.fragments) {
      return { ok: false, reason: "Not enough fragments." };
    }
  }
  if (spell.cost?.spirit) {
    if ((state.run.stats?.spirit ?? 0) < spell.cost.spirit) {
      return { ok: false, reason: "Spirit too low." };
    }
  }
  const cd = state.run.spellCooldowns?.[spellId] || 0;
  if (Date.now() < cd) {
    return { ok: false, reason: "Recharging." };
  }
  return { ok: true };
}

export function performCastSpell(state, spellId) {
  const spell = getSpell(spellId);
  if (!spell) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "spellFail", message: "Unknown spell." }],
    };
  }
  const check = canCastSpell(state, spellId);
  if (!check.ok) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "spellFail", message: check.reason }],
    };
  }

  const inventory = { ...state.run.inventory };
  if (spell.cost?.fragments) {
    inventory.fragments = (inventory.fragments || 0) - spell.cost.fragments;
  }

  const effect = { ...(spell.effect || {}) };
  if (spell.cost?.spirit) {
    effect.spirit = (effect.spirit || 0) - spell.cost.spirit;
  }
  const stats = applyEffect(state.run.stats || {}, effect);

  const spellCooldowns = {
    ...(state.run.spellCooldowns || {}),
    [spellId]: Date.now() + (spell.cooldownMs || 0),
  };

  let alignment = state.run.alignment || { good: 0, evil: 0 };
  if (spell.alignmentDelta) {
    alignment = {
      good: (alignment.good || 0) + (spell.alignmentDelta.good || 0),
      evil: (alignment.evil || 0) + (spell.alignmentDelta.evil || 0),
    };
  }

  let statuses = { ...(state.run.statuses || {}) };
  if (spell.appliesStatus) {
    const { id, durationMs } = spell.appliesStatus;
    statuses[id] = { until: Date.now() + (durationMs || 0) };
  }

  const run = {
    ...state.run,
    inventory,
    stats,
    spellCooldowns,
    alignment,
    statuses,
  };
  const events = [
    { kind: spell.logKind || "spell_good", message: spell.castMessage },
  ];
  return { run, persistent: state.persistent, events };
}

export function hasStatus(run, statusId) {
  const s = run?.statuses?.[statusId];
  return !!(s && s.until && s.until > Date.now());
}

export function getKnownSpells(state) {
  const learned = state.run.researched || {};
  return getAllSpells().filter((s) => learned[s.requires?.researched]);
}
