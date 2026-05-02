// Hunting system. Reducer dispatches HUNT; this file owns the logic.
//
// Hunting is gated by tool ownership (a Net or Snare in inventory). It has
// its own long cooldown, drains energy + thirst harder than gathering, and
// rolls a weighted drop table whose weights are modulated by Hunting skill
// level and equipped tools.
//
// Narrative framing: this is the moment the player goes from gathering
// scraps to actively pursuing prey. The first hunts are mostly failures —
// you scared up grubs, you missed the bird. The skill curve is the whole
// point: every clumsy attempt teaches you something.
//
// Returned shape matches gather/build: { run, persistent, events }.

import { HUNT_TABLE, HUNT_CONFIG } from "../content/huntTable.js";
import { RESOURCES } from "../content/resources.js";
import { getToolEffects } from "../content/tools.js";
import { getBonus, gainXp, getSkillState } from "./skills.js";
import { applyToolWear } from "./crafting.js";
import {
  decayForAction,
  survivalActive,
  applyEffect,
} from "./survival.js";
import { pickWeighted, randInt } from "../util/rng.js";

// Compute the current hunt cooldown in ms.
// Reductions stack from Hunting skill level + owned tools (Snare currently).
// Floor enforced at HUNT_CONFIG.minCooldownMs so hunts stay deliberate.
export function getHuntCooldownMs(state) {
  let ms = HUNT_CONFIG.baseCooldownMs;
  ms -= getBonus(state.run, "huntCooldownReduction");
  const toolEff = getToolEffects(state.run);
  ms -= toolEff.huntCooldownReduction || 0;
  return Math.max(HUNT_CONFIG.minCooldownMs, ms);
}

// Whether the player can hunt right now.
// Returns { ok, reason, msRemaining }.
export function canHunt(state) {
  // Must have a hunting tool in inventory.
  const toolEff = getToolEffects(state.run);
  if (!toolEff.unlocksAction?.hunt) {
    return { ok: false, reason: "You have nothing to hunt with.", msRemaining: 0 };
  }

  // Survival gate: hunting is energy-expensive, so we require a healthy floor.
  if (survivalActive(state)) {
    const stats = state.run.stats || {};
    if ((stats.energy ?? 100) <= HUNT_CONFIG.minEnergyToHunt) {
      return {
        ok: false,
        reason: "Too tired to stalk. Rest first.",
        msRemaining: 0,
      };
    }
  }

  // Cooldown gate.
  const lastAt = state.run.lastHuntAt || 0;
  if (lastAt > 0) {
    const cooldownMs = getHuntCooldownMs(state);
    const elapsed = Date.now() - lastAt;
    if (elapsed < cooldownMs) {
      return {
        ok: false,
        reason: "Catching your breath…",
        msRemaining: cooldownMs - elapsed,
      };
    }
  }
  return { ok: true, msRemaining: 0 };
}

// Build the live hunt table — weights modulated by skill + tools.
// Returns a fresh array suitable for pickWeighted.
function buildHuntTable(state) {
  const birdBonus =
    getBonus(state.run, "huntBirdWeightBonus") +
    (getToolEffects(state.run).huntBetterBirds || 0);
  const nothingReduction = getBonus(state.run, "huntNothingWeightReduction");

  return HUNT_TABLE.base.map((row) => {
    let weight = row.weight;
    if (row.tag === "bird") weight += birdBonus;
    else if (row.tag === "graze") weight += birdBonus * 0.4; // graze rides on bird shifts
    else if (row.tag === "nothing") weight = Math.max(2, weight - nothingReduction);
    // Never let weights go negative or below floor.
    return { ...row, weight: Math.max(1, weight) };
  });
}

// Convert a hunt drop result into a flavored log message. The user wants
// the player to KNOW they're hunting birds — not just see "+1 meat" with
// no context.
function describeDrop(result, qty) {
  if (result.kind === "nothing") {
    // Pick a flavored miss reason for variety.
    const lines = [
      "The flock scatters. You stand still and breathe.",
      "You stalked. You waited. The birds knew.",
      "Empty hands. The hunt was a lesson, not a meal.",
      "Almost. A wing-beat past your fingers.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  if (result.id === "food") {
    // "you flushed grubs instead of birds" — keep the bird framing visible
    return `🪱 You flushed up grubs from the underbrush — +${qty} grub${
      qty !== 1 ? "s" : ""
    }. Better than nothing.`;
  }
  if (result.id === "bird_meat") {
    return `🍗 You took a bird. +${qty} bird meat — the first warm thing in a long time.`;
  }
  if (result.id === "feathers" && result.tag === "graze") {
    return `🪶 You clipped one — feathers, no meat. +${qty} feather${
      qty !== 1 ? "s" : ""
    }.`;
  }
  if (result.id === "feathers") {
    return `🪶 +${qty} feather${qty !== 1 ? "s" : ""} — torn from the kill.`;
  }
  // Fallback for anything unexpected.
  const res = RESOURCES[result.id];
  return `${res?.icon || ""} +${qty} ${res?.name || result.id}.`;
}

export function performHunt(state, rng = Math.random) {
  const check = canHunt(state);
  if (!check.ok) {
    // Cooldown rejections are silent (matches gather behavior).
    if (check.msRemaining > 0) {
      return {
        run: state.run,
        persistent: state.persistent,
        events: [],
      };
    }
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "huntFail", message: check.reason }],
    };
  }

  // Setup new state.
  let run = {
    ...state.run,
    inventory: { ...state.run.inventory },
    gathered: { ...(state.run.gathered || {}) },
    lastHuntAt: Date.now(),
  };
  const persistent = state.persistent;

  const events = [];
  events.push({ kind: "hunt", message: "🏹 You move into the brush." });

  // Roll the drop.
  const table = buildHuntTable(state);
  const result = pickWeighted(rng, table);

  // Track for skill XP scaling.
  let xpGain = 1; // base for any attempt — practice matters
  let bonusThirst = 0;

  if (result.kind === "resource") {
    const [lo, hi] = result.qty;
    const baseQty = randInt(rng, lo, hi);
    // Tool yield bonus.
    const toolEff = getToolEffects(state.run);
    const huntYieldBonus =
      (toolEff.huntYieldBonus || 0) + getBonus(state.run, "huntYieldBonus");
    // Skill yield is fractional (0..1.5). Round up at draw time so even
    // small bonuses are felt (otherwise low-level players never see them).
    const qty = Math.max(1, Math.round(baseQty + huntYieldBonus));
    run.inventory[result.id] = (run.inventory[result.id] || 0) + qty;
    run.gathered[result.id] = (run.gathered[result.id] || 0) + qty;

    events.push({ kind: "hunt", message: describeDrop(result, qty) });

    // XP scales with what came back: birds and feathers teach the most.
    if (result.tag === "bird") xpGain += 3;
    else if (result.tag === "graze") xpGain += 2;
    else if (result.tag === "grub") xpGain += 1;

    // Successful bird hunts cost an extra slug of thirst (per user direction).
    if (result.tag === "bird") {
      bonusThirst += HUNT_CONFIG.bonusThirstOnBird;
    }
  } else {
    // Failure still teaches something — but less.
    events.push({ kind: "hunt", message: describeDrop(result, 0) });
    // Whiff XP — half a base.
    xpGain = 1;
  }

  // Survival decay (perHunt is the harshest of the four action decays).
  if (survivalActive({ ...state, run })) {
    let stats = decayForAction(run.stats || {}, "Hunt");
    if (bonusThirst > 0) {
      stats = applyEffect(stats, { thirst: +bonusThirst });
    }
    run = { ...run, stats };
  }

  // Skill XP grant.
  const xpResult = gainXp(run, "hunting", xpGain);
  run = { ...run, skills: xpResult.skills };
  events.push(...xpResult.events);

  // Tool wear — every hunt frays the Net and chips at the Snare.
  const wear = applyToolWear(run, "hunt");
  run = wear.run;
  events.push(...wear.events);

  return { run, persistent, events };
}

// UI helper — human-readable hunting summary for the action panel.
// Returns { level, cooldownMs, ready, owned }.
export function getHuntStatus(state) {
  const toolEff = getToolEffects(state.run);
  const owned = !!toolEff.unlocksAction?.hunt;
  const { level } = getSkillState(state.run, "hunting");
  return {
    owned,
    level,
    cooldownMs: getHuntCooldownMs(state),
    ready: canHunt(state).ok,
  };
}
