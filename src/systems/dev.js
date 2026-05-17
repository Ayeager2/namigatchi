// Dev / debug actions. Skip-the-grind helpers for testing.

import { getAllResources } from "../content/resources.js";
import { getAllBuildings } from "../content/buildings.js";
import { getAllResearch } from "../content/research.js";
import { getAllTools } from "../content/tools.js";
import { getActiveSkills } from "../content/skills.js";
import { SURVIVAL } from "../content/survival.js";
import { FRAGMENTS_TO_AWAKEN } from "../content/gatherTable.js";
import { resolveThreatById } from "./threats.js";

export function devGiveAll(state, qty = 999) {
  const inventory = { ...state.run.inventory };
  for (const r of getAllResources()) inventory[r.id] = qty;
  return { run: { ...state.run, inventory }, msg: `🛠️ +${qty} of every resource.` };
}

export function devSetInventory(state, patch) {
  const inventory = { ...state.run.inventory, ...patch };
  return { run: { ...state.run, inventory }, msg: `🛠️ Set inventory.` };
}

export function devLearnAllResearch(state) {
  const researched = { ...(state.run.researched || {}) };
  for (const r of getAllResearch()) researched[r.id] = { at: Date.now() };
  return { run: { ...state.run, researched }, msg: `🛠️ All research learned.` };
}

export function devBuildAll(state) {
  const built = { ...(state.run.built || {}) };
  for (const b of getAllBuildings()) built[b.id] = { at: Date.now() };
  let stats = state.run.stats;
  if (!state.run.built?.hut) stats = { ...SURVIVAL.startValues };
  return { run: { ...state.run, built, stats }, msg: `🛠️ Every building raised.` };
}

export function devCraftAll(state) {
  const inventory = { ...state.run.inventory };
  const toolDurability = { ...(state.run.toolDurability || {}) };
  const toolsCrafted = { ...(state.run.toolsCrafted || {}) };
  for (const t of getAllTools()) {
    inventory[t.id] = 1;
    if (t.durability?.max) toolDurability[t.id] = t.durability.max;
    toolsCrafted[t.id] = { craftedAt: Date.now(), count: 1 };
  }
  return {
    run: { ...state.run, inventory, toolDurability, toolsCrafted },
    msg: `🛠️ All tools crafted (full durability).`,
  };
}

export function devLevelAllSkills(state, level = 5) {
  const skills = { ...(state.run.skills || {}) };
  const xpForLevel = (lvl) => Math.floor(5 * (Math.pow(1.8, lvl) - 1) / 0.8);
  const xp = xpForLevel(level);
  for (const s of getActiveSkills()) skills[s.id] = { xp, level };
  return { run: { ...state.run, skills }, msg: `🛠️ All skills → lvl ${level}.` };
}

export function devResetSkills(state) {
  return { run: { ...state.run, skills: {} }, msg: `🛠️ Skills wiped.` };
}

export function devMaxStats(state) {
  return {
    run: {
      ...state.run,
      stats: { hunger: 0, thirst: 0, energy: 100, hp: 100, happiness: 100, sanity: 100, spirit: 100 },
    },
    msg: `🛠️ All stats maxed.`,
  };
}

export function devHurtStats(state) {
  return {
    run: {
      ...state.run,
      stats: { hunger: 90, thirst: 90, energy: 5, hp: 15, happiness: 10, sanity: 10, spirit: 10 },
    },
    msg: `🛠️ All stats nearly dead.`,
  };
}

export function devSkipTime(state, minutes = 10) {
  const offsetMs = minutes * 60 * 1000;
  const run = { ...state.run };
  if (run.lastPassiveTickAt > 0) run.lastPassiveTickAt -= offsetMs;
  else run.lastPassiveTickAt = Date.now() - offsetMs;
  if (run.lastSpoilTickAt > 0) run.lastSpoilTickAt -= offsetMs;
  else run.lastSpoilTickAt = Date.now() - offsetMs;
  run.lastGatheredAt = 0;
  run.lastHuntAt = 0;
  return { run, msg: `🛠️ Skipped ${minutes} minutes (next tick processes them).` };
}

export function devTriggerPest(state, pestId = "birdFlock", durationMin = 5) {
  const activePests = {
    ...(state.run.activePests || {}),
    [pestId]: { until: Date.now() + durationMin * 60 * 1000, intensity: 1 },
  };
  return {
    run: { ...state.run, activePests },
    msg: `🛠️ Pest "${pestId}" active for ${durationMin} min.`,
  };
}

export function devClearPests(state) {
  return { run: { ...state.run, activePests: {} }, msg: `🛠️ All pests cleared.` };
}

export function devJumpToEra1(state) {
  const built = { ...(state.run.built || {}), hut: { at: Date.now() } };
  return {
    run: {
      ...state.run,
      rockFound: true,
      rockAwakened: true,
      rockAwakenedAt: Date.now() - 5000,
      built,
      inventory: { ...state.run.inventory, fragments: 0 },
      stats: { ...SURVIVAL.startValues },
      splashSeen: true,
    },
    msg: `🛠️ Jumped to Era 1.`,
  };
}

export function devForceAwaken(state) {
  return {
    run: {
      ...state.run,
      rockFound: true,
      rockAwakened: true,
      rockAwakenedAt: Date.now(),
      inventory: { ...state.run.inventory, fragments: 0 },
    },
    msg: `🛠️ Rock awakened.`,
  };
}

export function devFindRock(state) {
  return { run: { ...state.run, rockFound: true }, msg: `🛠️ Rock found.` };
}

export function devGiveFragments(state, qty = FRAGMENTS_TO_AWAKEN) {
  return {
    run: {
      ...state.run,
      rockFound: true,
      inventory: { ...state.run.inventory, fragments: (state.run.inventory.fragments || 0) + qty },
    },
    msg: `🛠️ +${qty} fragments.`,
  };
}

export function devWipeRun() {
  return { msg: `🛠️ Wiping run...` };
}

export function devNuke() {
  if (typeof localStorage !== "undefined") localStorage.removeItem("namigatchi-save");
  if (typeof window !== "undefined") window.location.reload();
  return { msg: `💥 Nuked save. Reloading...` };
}

export function devUnlockAll(state) {
  let s = { ...state, run: { ...state.run } };
  let patch = devJumpToEra1(s); s = { ...s, run: patch.run };
  patch = devLearnAllResearch(s); s = { ...s, run: patch.run };
  patch = devBuildAll(s); s = { ...s, run: patch.run };
  patch = devCraftAll(s); s = { ...s, run: patch.run };
  patch = devLevelAllSkills(s, 5); s = { ...s, run: patch.run };
  patch = devMaxStats(s); s = { ...s, run: patch.run };
  patch = devGiveAll(s, 999); s = { ...s, run: patch.run };
  return { run: s.run, msg: `🛠️ Full Era 1 unlocked.` };
}

// ============== Era 2 / Era 3 helpers ==============

export function devJumpToEra2(state) {
  let s = { ...state, run: { ...state.run } };
  let patch = devJumpToEra1(s); s = { ...s, run: patch.run };
  const built = { ...(s.run.built || {}), firepit: { at: Date.now() } };
  const researched = {
    ...(s.run.researched || {}),
    foraging: { at: Date.now() },
    fire: { at: Date.now() },
    knapping: { at: Date.now() },
  };
  return { run: { ...s.run, built, researched }, msg: `🛠️ Jumped to Era 2.` };
}

export function devJumpToEra3(state) {
  let s = { ...state, run: { ...state.run } };
  let patch = devJumpToEra2(s); s = { ...s, run: patch.run };
  const built = {
    ...(s.run.built || {}),
    forge: { at: Date.now() },
    home: { at: Date.now() },
  };
  const researched = {
    ...(s.run.researched || {}),
    smithing: { at: Date.now() },
    fletching: { at: Date.now() },
    home: { at: Date.now() },
  };
  const toolsCrafted = {
    ...(s.run.toolsCrafted || {}),
    bow: { craftedAt: Date.now(), count: 1 },
  };
  return { run: { ...s.run, built, researched, toolsCrafted }, msg: `🛠️ Jumped to Era 3.` };
}

export function devUnlockAllEra2(state) {
  let s = { ...state, run: { ...state.run } };
  let patch = devJumpToEra2(s); s = { ...s, run: patch.run };
  patch = devLearnAllResearch(s); s = { ...s, run: patch.run };
  patch = devBuildAll(s); s = { ...s, run: patch.run };
  patch = devCraftAll(s); s = { ...s, run: patch.run };
  patch = devLevelAllSkills(s, 10); s = { ...s, run: patch.run };
  patch = devMaxStats(s); s = { ...s, run: patch.run };
  patch = devGiveAll(s, 999); s = { ...s, run: patch.run };
  return { run: s.run, msg: `🛠️ Full Era 2 unlocked.` };
}

export function devUnlockAllEra3(state) {
  let s = { ...state, run: { ...state.run } };
  let patch = devJumpToEra3(s); s = { ...s, run: patch.run };
  patch = devLearnAllResearch(s); s = { ...s, run: patch.run };
  patch = devBuildAll(s); s = { ...s, run: patch.run };
  patch = devCraftAll(s); s = { ...s, run: patch.run };
  patch = devLevelAllSkills(s, 15); s = { ...s, run: patch.run };
  patch = devMaxStats(s); s = { ...s, run: patch.run };
  patch = devGiveAll(s, 999); s = { ...s, run: patch.run };
  return { run: s.run, msg: `🛠️ Full Era 3 unlocked.` };
}

export function devSetAlignment(state, side, value = 5) {
  const align = { good: 0, evil: 0, ...(state.run.alignment || {}) };
  if (side === "good") { align.good = value; align.evil = 0; }
  else if (side === "evil") { align.evil = value; align.good = 0; }
  else { align.good = 0; align.evil = 0; }
  return { run: { ...state.run, alignment: align }, msg: `🛠️ Alignment → ${side} ${value}.` };
}

export function devClearSpellCooldowns(state) {
  return { run: { ...state.run, spellCooldowns: {} }, msg: `🛠️ Spell cooldowns cleared.` };
}

export function devApplyStatus(state, statusId, durationSec = 5 * 60) {
  const statuses = { ...(state.run.statuses || {}) };
  if (durationSec <= 0) {
    delete statuses[statusId];
    return { run: { ...state.run, statuses }, msg: `🛠️ Status "${statusId}" cleared.` };
  }
  statuses[statusId] = { until: Date.now() + durationSec * 1000 };
  return { run: { ...state.run, statuses }, msg: `🛠️ Status "${statusId}" set for ${durationSec}s.` };
}

export function devForceThreat(state, threatId) {
  const result = resolveThreatById(state, threatId);
  if (!result) return { msg: `🛠️ Threat "${threatId}" not found.` };
  return {
    run: { ...state.run, inventory: result.inventory, stats: result.stats },
    events: result.events,
    msg: `🛠️ Forced threat "${threatId}".`,
  };
}
