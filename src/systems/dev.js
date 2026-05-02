// Dev / debug actions. Skip-the-grind helpers for testing what we've built
// without playing through Era 0 → Era 1 every time.
//
// Each helper is a pure function that takes the current { run, persistent }
// state and returns a patch (an object whose top-level keys merge into
// state). The reducer's DEV_PATCH case applies the patch.

import { getAllResources } from "../content/resources.js";
import { getAllBuildings } from "../content/buildings.js";
import { getAllResearch } from "../content/research.js";
import { getAllTools } from "../content/tools.js";
import { getActiveSkills } from "../content/skills.js";
import { SURVIVAL } from "../content/survival.js";
import { FRAGMENTS_TO_AWAKEN } from "../content/gatherTable.js";

// Set every known resource (including tools) to qty.
export function devGiveAll(state, qty = 999) {
  const inventory = { ...state.run.inventory };
  for (const r of getAllResources()) inventory[r.id] = qty;
  return {
    run: { ...state.run, inventory },
    msg: `🛠️ +${qty} of every resource.`,
  };
}

// Set inventory to a specific resource map (used by individual buttons).
export function devSetInventory(state, patch) {
  const inventory = { ...state.run.inventory, ...patch };
  return {
    run: { ...state.run, inventory },
    msg: `🛠️ Set inventory.`,
  };
}

// Mark every research learned.
export function devLearnAllResearch(state) {
  const researched = { ...(state.run.researched || {}) };
  for (const r of getAllResearch()) {
    researched[r.id] = { at: Date.now() };
  }
  return {
    run: { ...state.run, researched },
    msg: `🛠️ All research learned.`,
  };
}

// Build every building.
export function devBuildAll(state) {
  const built = { ...(state.run.built || {}) };
  for (const b of getAllBuildings()) built[b.id] = { at: Date.now() };
  // Activate survival (initial stats) if hut just appeared.
  let stats = state.run.stats;
  if (!state.run.built?.hut) {
    stats = { ...SURVIVAL.startValues };
  }
  return {
    run: { ...state.run, built, stats },
    msg: `🛠️ Every building raised.`,
  };
}

// Craft every tool with full durability.
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

// Set all active skills to a specific level (and matching XP).
// We just set xp high enough — the skills system recomputes level on read.
export function devLevelAllSkills(state, level = 5) {
  const skills = { ...(state.run.skills || {}) };
  // Generous XP — past most reasonable curves.
  const xpForLevel = (lvl) => Math.floor(5 * (Math.pow(1.8, lvl) - 1) / 0.8);
  const xp = xpForLevel(level);
  for (const s of getActiveSkills()) {
    skills[s.id] = { xp, level };
  }
  return {
    run: { ...state.run, skills },
    msg: `🛠️ All skills → lvl ${level}.`,
  };
}

// Reset all skills to zero.
export function devResetSkills(state) {
  return {
    run: { ...state.run, skills: {} },
    msg: `🛠️ Skills wiped.`,
  };
}

// Max all survival stats.
export function devMaxStats(state) {
  return {
    run: {
      ...state.run,
      stats: { hunger: 0, thirst: 0, energy: 100, hp: 100, happiness: 100, sanity: 100 },
    },
    msg: `🛠️ All stats maxed.`,
  };
}

// Hurt the player to red zones (test danger UI).
export function devHurtStats(state) {
  return {
    run: {
      ...state.run,
      stats: { hunger: 90, thirst: 90, energy: 5, hp: 15, happiness: 10, sanity: 10 },
    },
    msg: `🛠️ All stats nearly dead.`,
  };
}

// Skip forward N minutes. Rewinds last-tick timestamps so the next TICK
// processes that much elapsed time (passive production + spoilage).
export function devSkipTime(state, minutes = 10) {
  const offsetMs = minutes * 60 * 1000;
  const run = { ...state.run };
  if (run.lastPassiveTickAt > 0) run.lastPassiveTickAt -= offsetMs;
  else run.lastPassiveTickAt = Date.now() - offsetMs;
  if (run.lastSpoilTickAt > 0) run.lastSpoilTickAt -= offsetMs;
  else run.lastSpoilTickAt = Date.now() - offsetMs;
  // Clear gather/hunt cooldowns too.
  run.lastGatheredAt = 0;
  run.lastHuntAt = 0;
  return {
    run,
    msg: `🛠️ Skipped ${minutes} minutes (next tick processes them).`,
  };
}

// Activate a pest for testing.
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

// Clear all active pests.
export function devClearPests(state) {
  return {
    run: { ...state.run, activePests: {} },
    msg: `🛠️ All pests cleared.`,
  };
}

// Jump to Era 1: rock found + awakened + hut built. Sufficient for survival
// to activate. Use BuildAll for everything else.
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

// Force the rock to awaken (sets fragments to threshold then triggers).
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

// Just find the rock (no awakening yet).
export function devFindRock(state) {
  return {
    run: { ...state.run, rockFound: true },
    msg: `🛠️ Rock found.`,
  };
}

// Give just enough fragments to trigger awakening on next gather.
export function devGiveFragments(state, qty = FRAGMENTS_TO_AWAKEN) {
  return {
    run: {
      ...state.run,
      rockFound: true,
      inventory: {
        ...state.run.inventory,
        fragments: (state.run.inventory.fragments || 0) + qty,
      },
    },
    msg: `🛠️ +${qty} fragments.`,
  };
}

// Wipe the run only (keeps persistent — Echoes etc).
export function devWipeRun() {
  // Caller will dispatch RESET_RUN; this is a pass-through marker.
  return { msg: `🛠️ Wiping run...` };
}

// Hard-clear localStorage and reload.
export function devNuke() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("namigatchi-save");
  }
  if (typeof window !== "undefined") window.location.reload();
  return { msg: `💥 Nuked save. Reloading...` };
}

// "All Era 1": rock awakened + hut + all research learned + all buildings + all
// tools crafted + skills lvl 5 + decent inventory. The "I want to test the
// whole shipped state" button.
export function devUnlockAll(state) {
  let s = { ...state, run: { ...state.run } };
  // Era 1 baseline
  let patch = devJumpToEra1(s);
  s = { ...s, run: patch.run };
  // All research
  patch = devLearnAllResearch(s);
  s = { ...s, run: patch.run };
  // All buildings
  patch = devBuildAll(s);
  s = { ...s, run: patch.run };
  // All tools
  patch = devCraftAll(s);
  s = { ...s, run: patch.run };
  // Skills to lvl 5
  patch = devLevelAllSkills(s, 5);
  s = { ...s, run: patch.run };
  // Stats full
  patch = devMaxStats(s);
  s = { ...s, run: patch.run };
  // Inventory
  patch = devGiveAll(s, 999);
  s = { ...s, run: patch.run };
  return { run: s.run, msg: `🛠️ Full Era 1 unlocked.` };
}
