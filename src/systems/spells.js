// Spells system. Pure functions for spell eligibility + casting.
// Reducer dispatches CAST_SPELL; this file owns the logic.

import { getSpell, getAllSpells } from "../content/spells.js";
import { applyEffect } from "./survival.js";
import { computeEra } from "./era.js";

// Whether the player can cast this spell right now. Returns { ok, reason }.
export function canCastSpell(state, spellId) {
  const spell = getSpell(spellId);
  if (!spell) return { ok: false, reason: "Unknown spell." };

  // Era gate
  if (spell.requires?.era) {
    if (computeEra(state) < spell.requires.era) {
      return { ok: false, reason: "The stone has not opened this yet." };
    }
  }
  // Research gate
  if (spell.requires?.researched) {
    if (!state.run.researched?.[spell.requires.researched]) {
      return { ok: false, reason: "Spell not learned." };
    }
  }
  // Cost: fragments come from inventory, spirit comes from stats.
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
  // Cooldown
  const cd = state.run.spellCooldowns?.[spellId] || 0;
  if (Date.now() < cd) {
    return { ok: false, reason: "Recharging." };
  }
  return { ok: true };
}

// Cast a spell. Returns { run, persistent, events }.
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

  // Pay cost.
  const inventory = { ...state.run.inventory };
  if (spell.cost?.fragments) {
    inventory.fragments = (inventory.fragments || 0) - spell.cost.fragments;
  }

  // Apply effect + spirit drain.
  const effect = { ...(spell.effect || {}) };
  if (spell.cost?.spirit) {
    effect.spirit = (effect.spirit || 0) - spell.cost.spirit;
  }
  const stats = applyEffect(state.run.stats || {}, effect);

  // Stamp cooldown.
  const spellCooldowns = {
    ...(state.run.spellCooldowns || {}),
    [spellId]: Date.now() + (spell.cooldownMs || 0),
  };

  const run = { ...state.run, inventory, stats, spellCooldowns };
  const events = [
    { kind: spell.logKind || "spell_good", message: spell.castMessage },
  ];
  return { run, persistent: state.persistent, events };
}

// All spells the player has learned. Used by the cast UI.
export function getKnownSpells(state) {
  const learned = state.run.researched || {};
  return getAllSpells().filter((s) => learned[s.requires?.researched]);
}
