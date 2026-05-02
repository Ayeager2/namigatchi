// Gathering system. Pure function: takes state + rng, returns new state + events.
// Reducer dispatches GATHER; this file owns all the actual logic.
//
// The gather table is composed dynamically: a base table (depending on rock
// state) + additional entries injected by completed research. So Foraging
// research adds Food to the loot pool, automatically and without UI changes.
//
// Survival: when the hut is built, gathering applies stat decay and yield
// multipliers. Energy must be > 0 to gather (caller checks via canGather).

import {
  GATHER_TABLE,
  GATHER_ADDITIONS,
  FRAGMENTS_TO_AWAKEN,
} from "../content/gatherTable.js";
import { RESOURCES } from "../content/resources.js";
import { getBuilding } from "../content/buildings.js";
import { getResearch } from "../content/research.js";
import { getToolEffects } from "../content/tools.js";
import { getBuildingBonuses } from "./building.js";
import { getResearchBonuses } from "./research.js";
import { getBonus, gainXp } from "./skills.js";
import { applyToolWear } from "./crafting.js";
import { isPestActive } from "./passive.js";
import {
  survivalActive,
  decayForAction,
  getYieldMultiplier,
  canGather as canGatherSurvival,
} from "./survival.js";
import { rollThreatEncounter } from "./threats.js";
import { rollGatherEvent } from "./events.js";
import { pickWeighted, randInt } from "../util/rng.js";
import { SURVIVAL } from "../content/survival.js";

// Compute the current gather cooldown in ms. Buildings, research, owned
// tools, and Foraging skill all reduce the base. Floored at
// SURVIVAL.gather.minCooldownMs so there's always SOME pause — full
// automation is a separate (future) system.
export function getGatherCooldownMs(state) {
  const cfg = SURVIVAL.gather || {};
  let ms = cfg.baseCooldownMs ?? 1500;

  // Buildings
  for (const id of Object.keys(state.run.built || {})) {
    const b = getBuilding(id);
    if (b?.effect?.gatherSpeedup) ms -= b.effect.gatherSpeedup;
  }
  // Research
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.gatherSpeedup) ms -= r.effect.gatherSpeedup;
  }
  // Tools (e.g. Digging Stick contributes -100ms)
  const toolEff = getToolEffects(state.run);
  if (toolEff.gatherSpeedup) ms -= toolEff.gatherSpeedup;
  // Skills (Foraging adds a tiny per-level reduction)
  ms -= getBonus(state.run, "gatherSpeedup");

  return Math.max(cfg.minCooldownMs ?? 250, ms);
}

// Returns { ok, reason, msRemaining } for the gather action including
// both survival energy gating and the new cooldown.
export function canGatherFull(state) {
  // Energy gate (existing)
  const survivalCheck = canGatherSurvival(state);
  if (!survivalCheck.ok) return { ...survivalCheck, msRemaining: 0 };

  // Cooldown gate (new)
  const lastAt = state.run.lastGatheredAt || 0;
  if (lastAt > 0) {
    const cooldownMs = getGatherCooldownMs(state);
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

// Build the live gather table from base + research additions.
// While the bird-flock pest is active, grub weights are halved (the flock
// has eaten what was easy to find).
function buildGatherTable(run) {
  let entries;
  if (!run.rockFound) entries = [...GATHER_TABLE.preRock];
  else if (!run.rockAwakened) entries = [...GATHER_TABLE.postRockPreAwaken];
  else entries = [...GATHER_TABLE.postAwaken];

  for (const researchId of Object.keys(run.researched || {})) {
    const addition = GATHER_ADDITIONS[researchId];
    if (addition) entries.push({ ...addition });
  }

  // Pest modulation — entries with id "food" get their weight halved while
  // a bird flock is active. Done after additions so the effect catches both
  // the base table and Foraging's bonus food weight.
  if (isPestActive(run, "birdFlock")) {
    entries = entries.map((e) =>
      e.kind === "resource" && e.id === "food"
        ? { ...e, weight: Math.max(1, Math.floor(e.weight * 0.5)) }
        : e
    );
  }

  return entries;
}

export function performGather(state, rng = Math.random) {
  // Energy gate AND cooldown gate.
  const gateCheck = canGatherFull(state);
  if (!gateCheck.ok) {
    // Cooldown rejections happen silently — no log spam from key-mashing.
    if (gateCheck.msRemaining > 0) {
      return {
        run: state.run,
        persistent: state.persistent,
        events: [],
      };
    }
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "actionFail", message: gateCheck.reason }],
    };
  }

  // Build new state from immutable copies.
  // `let` so the skill-XP step at the end can replace the skills slice.
  let run = {
    ...state.run,
    inventory: { ...state.run.inventory },
    gathered: { ...(state.run.gathered || {}) },
    gatherCount: (state.run.gatherCount || 0) + 1,
    lastGatheredAt: Date.now(),
  };
  const persistent = {
    ...state.persistent,
    lifetimeStats: {
      ...state.persistent.lifetimeStats,
      resourcesByType: { ...state.persistent.lifetimeStats.resourcesByType },
    },
  };

  const table = buildGatherTable(run);
  const result = pickWeighted(rng, table);

  const buildingBonuses = getBuildingBonuses(run);
  const researchBonuses = getResearchBonuses(run);
  const toolEff = getToolEffects(run);
  // Skills add a fractional gather bonus (rounded into the qty calc).
  const skillGatherBonus = getBonus(run, "gatherBonus");
  const gatherBonus =
    (buildingBonuses.gatherBonus || 0) +
    (researchBonuses.gatherBonus || 0) +
    (toolEff.gatherBonus || 0) +
    skillGatherBonus;

  // Survival yield penalty (only when survival active).
  const yieldMult = survivalActive(state) ? getYieldMultiplier(run.stats) : 1.0;

  persistent.lifetimeStats.totalGathers += 1;

  const events = [];

  switch (result.kind) {
    case "nothing":
      events.push({
        kind: "nothing",
        message: "You search and find nothing of value.",
      });
      break;

    case "resource": {
      const [lo, hi] = result.qty;
      const baseQty = randInt(rng, lo, hi);
      // Water-specific bonus from Digging Stick / Water Skin tools.
      const waterBonus = result.id === "water" ? (toolEff.waterBonus || 0) : 0;
      // Apply gather bonus + water bonus, then yield multiplier
      // (rounded, min 1 if anything).
      const rawQty = baseQty + gatherBonus + waterBonus;
      const qty = Math.max(1, Math.round(rawQty * yieldMult));
      run.inventory[result.id] = (run.inventory[result.id] || 0) + qty;
      run.gathered[result.id] = (run.gathered[result.id] || 0) + qty;
      persistent.lifetimeStats.totalResourcesGathered += qty;
      persistent.lifetimeStats.resourcesByType[result.id] =
        (persistent.lifetimeStats.resourcesByType[result.id] || 0) + qty;
      const res = RESOURCES[result.id];
      events.push({
        kind: "resource",
        message: `${res.icon} +${qty} ${res.name}`,
      });
      break;
    }

    case "rockFind":
      run.rockFound = true;
      persistent.lifetimeStats.rocksFound += 1;
      events.push({
        kind: "rockFind",
        message: "Among the dust, a smooth stone — warm, somehow. You pocket it.",
      });
      break;

    default:
      events.push({ kind: "nothing", message: "Nothing happens." });
  }

  // Awakening check — uses the UPDATED run state.
  if (
    run.rockFound &&
    !run.rockAwakened &&
    run.inventory.fragments >= FRAGMENTS_TO_AWAKEN
  ) {
    run.rockAwakened = true;
    run.rockAwakenedAt = Date.now();
    // The rock consumes the fragments — all of them. Player sees the
    // Unknown inventory section vanish in real time.
    run.inventory.fragments = 0;
    persistent.lifetimeStats.rocksAwakened += 1;
    events.push({
      kind: "awaken",
      message:
        "The fragments leap from your hand to the stone — and the stone OPENS its eye.",
    });
    const hut = getBuilding("hut");
    if (hut?.whisperOnAvailable) {
      events.push({ kind: "whisper", message: hut.whisperOnAvailable });
    }
  }

  // Tracking research: separate chance to find a bonus fragment after the rock
  // is found. Pure additive — doesn't intrude on the main gather table.
  if (run.rockFound) {
    for (const id of Object.keys(run.researched || {})) {
      const r = getResearch(id);
      if (r?.effect?.fragmentChance && rng() < r.effect.fragmentChance) {
        run.inventory.fragments = (run.inventory.fragments || 0) + 1;
        run.gathered.fragments = (run.gathered.fragments || 0) + 1;
        persistent.lifetimeStats.totalResourcesGathered += 1;
        persistent.lifetimeStats.resourcesByType.fragments =
          (persistent.lifetimeStats.resourcesByType.fragments || 0) + 1;
        events.push({
          kind: "resource",
          message: "✨ +1 (something extra glints in the dust)",
        });
      }
    }
  }

  // Apply survival decay (after gather, AFTER any awakening/build state changes).
  if (survivalActive({ ...state, run })) {
    run.stats = decayForAction(run.stats || {}, "Gather");
  }

  // Threat encounter — roll AFTER decay so defense/HP reflect current state.
  if (survivalActive({ ...state, run })) {
    const threat = rollThreatEncounter({ ...state, run }, rng);
    if (threat) {
      run.inventory = threat.inventory;
      run.stats = threat.stats;
      events.push(...threat.events);
      persistent.lifetimeStats.threatsEncountered =
        (persistent.lifetimeStats.threatsEncountered || 0) + 1;
    }
  }

  // Random event — roll for a gather-triggered event after threats resolve.
  if (survivalActive({ ...state, run })) {
    const ev = rollGatherEvent({ ...state, run, persistent }, rng);
    if (ev) {
      Object.assign(run, ev.run);
      Object.assign(persistent, ev.persistent);
      events.push(...ev.events);
    }
  }

  // Skill XP — Foraging earns from every gather. Bonus on food drops
  // (the rarer outcome that teaches the most about reading the wasteland).
  // XP grants happen LAST so any earlier state changes are visible.
  let xpGain = 1;
  if (result.kind === "resource" && result.id === "food") xpGain += 1;
  if (result.kind === "rockFind") xpGain += 2;
  const xpResult = gainXp(run, "foraging", xpGain);
  run = { ...run, skills: xpResult.skills };
  events.push(...xpResult.events);

  // Tool wear — generic gather first (Digging Stick), then water-specific
  // (Water Skin) only when this was a water drop.
  const wearGather = applyToolWear(run, "gather");
  run = wearGather.run;
  events.push(...wearGather.events);
  if (result.kind === "resource" && result.id === "water") {
    const wearWater = applyToolWear(run, "waterGather");
    run = wearWater.run;
    events.push(...wearWater.events);
  }

  return { run, persistent, events };

}inXp(run, "foraging", xpGain);
  run = { ...run, skills: xpResult.skills };
  events.push(...xpResult.events);

  // Tool wear — generic gather first (Digging Stick), then water-specific
  // (Water Skin) only when this was a water drop.
  const wearGather = applyToolWear(run, "gather");
  run = wearGather.run;
  events.push(...wearGather.events);
  if (result.kind === "resource" && result.id === "water") {
    const wearWater = applyToolWear(run, "waterGather");
    run = wearWater.run;
    events.push(...wearWater.events);
  }

  return { run, persistent, events };
}
