// Spells system. Pure functions for spell eligibility + casting.

import { getSpell, getAllSpells } from "../content/spells.js";
import { getAllTools } from "../content/tools.js";
import { applyEffect } from "./survival.js";
import { clearDysentery } from "./disease.js";
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
  // Arcane Studies — `requires.studied: <studyId>` gates spells unlocked
  // by completing a study at the Stone Altar. See content/studies.js and
  // ERA_PLAN.md "Arcane Studies".
  if (spell.requires?.studied) {
    if (!state.run.studiesCompleted?.[spell.requires.studied]) {
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

  let run = {
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

  // Mending Word also cures dysentery — see ERA_PLAN.md "Water tiers +
  // dysentery". It's "the word the body remembers," after all.
  if (spellId === "mendingWord") {
    const cure = clearDysentery(run, "mending");
    run = cure.run;
    events.push(...cure.events);
  }

  // ─── Arcane Studies spell side-effects ───────────────────────────────
  //
  // The Cleansing Word lifts a specific set of statuses (dysentery, curses,
  // future illnesses). Lighter than Mending which lifts dysentery as a
  // side-effect of healing — Cleansing Word's PURPOSE is to clear.
  if (Array.isArray(spell.clearsStatuses) && spell.clearsStatuses.length > 0) {
    const nextStatuses = { ...(run.statuses || {}) };
    for (const sid of spell.clearsStatuses) {
      if (nextStatuses[sid]) {
        delete nextStatuses[sid];
        events.push({
          kind: "spell_good",
          message: `🌬️ The ${sid} lifts.`,
        });
        // Specific narrative beat for dysentery — leverage the disease module
        // so its own state cleanup is consistent.
        if (sid === "dysentery") {
          const cure = clearDysentery({ ...run, statuses: nextStatuses }, "mending");
          run = cure.run;
        }
      }
    }
    run = { ...run, statuses: nextStatuses };
  }

  // Echo restores tool durability across ALL owned tools (Memory path —
  // see content/studies.js firstEcho). `repairsAllTools` is the fraction
  // of each tool's max durability to restore.
  if (typeof spell.repairsAllTools === "number") {
    const toolDurability = { ...(run.toolDurability || {}) };
    let anyRepaired = false;
    for (const tool of getAllTools()) {
      if (!(run.inventory?.[tool.id] > 0)) continue;
      const dur = tool.durability;
      if (!dur || typeof dur.max !== "number") continue;
      const current = typeof toolDurability[tool.id] === "number"
        ? toolDurability[tool.id]
        : dur.max;
      const restore = Math.floor(dur.max * spell.repairsAllTools);
      const next = Math.min(dur.max, current + restore);
      if (next > current) {
        toolDurability[tool.id] = next;
        anyRepaired = true;
      }
    }
    run = { ...run, toolDurability };
    if (anyRepaired) {
      events.push({ kind: "spell_good", message: "🔔 Your tools remember being whole." });
    }
  }

  // Voidcall (and other apex-dark spells) thin the world a little. World
  // Score lives under run for now (run-local, see Task #29). Negative
  // numbers are fine — Voidcall *erodes* the score.
  if (typeof spell.worldScoreDelta === "number") {
    run = {
      ...run,
      worldScore: (run.worldScore || 0) + spell.worldScoreDelta,
    };
  }

  return { run, persistent: state.persistent, events };
}

export function hasStatus(run, statusId) {
  const s = run?.statuses?.[statusId];
  return !!(s && s.until && s.until > Date.now());
}

export function getKnownSpells(state) {
  const researched = state.run.researched || {};
  const studied = state.run.studiesCompleted || {};
  return getAllSpells().filter((s) => {
    const req = s.requires || {};
    // A spell is "known" if EITHER its research OR its study has been
    // completed. Spells gated by both keys (rare) need both.
    if (req.researched && !researched[req.researched]) return false;
    if (req.studied && !studied[req.studied]) return false;
    // Spells with neither gate are always known (no current data has
    // this shape, but the default-true keeps it safe).
    if (!req.researched && !req.studied) return true;
    return true;
  });
}
