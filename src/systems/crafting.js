// Crafting system. Reducer dispatches CRAFT_TOOL; this file owns the logic.
//
// Crafting is a pure resource-spend → inventory-add transaction. The crafted
// tool slots into run.inventory under the tool's id (qty 1 minimum) and into
// run.toolsCrafted as a marker. Tool effects (declarative) apply automatically
// from inventory presence — no separate "equipped" concept. The Forge (Era 2)
// will gate higher-tier tools but is not required for primitives here.
//
// Skill XP: every successful craft grants Crafting skill XP. The crafting
// skill's own bonuses (refund chance) read back into this system on each craft.

import { getTool, getAllTools } from "../content/tools.js";
import { gainXp, getSkillState } from "./skills.js";
import {
  decayForAction,
  survivalActive,
  boostStats,
} from "./survival.js";

// Apply durability wear from an action ("hunt" | "gather" | "waterGather").
// Walks every owned tool whose durability.wearsOn matches the action; each
// matching tool ticks down by 1. If a tool hits 0:
//   - removed from inventory
//   - durability entry deleted
//   - a "broken" log event is emitted
// Returns { run, events } — pure function, replace caller's run slice.
export function applyToolWear(run, actionTag) {
  const inventory = { ...(run.inventory || {}) };
  const toolDurability = { ...(run.toolDurability || {}) };
  const events = [];
  let changed = false;

  for (const tool of getAllTools()) {
    if (!(inventory[tool.id] > 0)) continue;
    const dur = tool.durability;
    if (!dur || dur.wearsOn !== actionTag) continue;

    const current = toolDurability[tool.id];
    // Defensive: if durability isn't tracked yet (e.g., loaded from an older
    // save before the system existed), seed it to max so the tool has a
    // fighting chance and starts wearing from there.
    const seeded = typeof current === "number" ? current : dur.max;
    const next = seeded - 1;

    if (next <= 0) {
      // Break it.
      inventory[tool.id] = (inventory[tool.id] || 0) - 1;
      if (inventory[tool.id] <= 0) delete inventory[tool.id];
      delete toolDurability[tool.id];
      events.push({
        kind: "craftFail",
        message: tool.onBrokenMessage || `Your ${tool.name} broke.`,
      });
      changed = true;
    } else {
      toolDurability[tool.id] = next;
      changed = true;
    }
  }

  if (!changed) return { run, events: [] };
  return {
    run: { ...run, inventory, toolDurability },
    events,
  };
}

// Returns { ok: bool, reason: string } eligibility.
export function canCraft(state, toolId) {
  const tool = getTool(toolId);
  if (!tool) return { ok: false, reason: "Unknown tool." };

  // Already in inventory? Block re-craft to keep early-game inventory tidy.
  // (Era 2 may relax this when degradation/repair arrives.)
  if ((state.run.inventory?.[toolId] || 0) > 0) {
    return { ok: false, reason: "You already have one." };
  }

  const req = tool.requires || {};
  if (req.researched && !state.run.researched?.[req.researched]) {
    return { ok: false, reason: "You haven't listened for the way of it yet." };
  }
  if (req.toolOwned && !(state.run.inventory?.[req.toolOwned] > 0)) {
    return { ok: false, reason: "You need another tool first." };
  }
  if (req.skill) {
    for (const [skillId, minLevel] of Object.entries(req.skill)) {
      const { level } = getSkillState(state.run, skillId);
      if (level < minLevel) {
        return {
          ok: false,
          reason: `Your hands aren't ready (skill needs lvl ${minLevel}).`,
        };
      }
    }
  }

  for (const [res, qty] of Object.entries(tool.cost || {})) {
    if ((state.run.inventory?.[res] || 0) < qty) {
      return { ok: false, reason: "Not enough materials." };
    }
  }
  return { ok: true };
}

// Returns { run, persistent, events }.
export function performCraft(state, toolId, rng = Math.random) {
  const tool = getTool(toolId);
  if (!tool) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "craftFail", message: "Unknown tool." }],
    };
  }

  const check = canCraft(state, toolId);
  if (!check.ok) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "craftFail", message: check.reason }],
    };
  }

  // Spend resources — but check Crafting skill's refund chance per resource.
  const inventory = { ...state.run.inventory };
  const { level: craftLevel } = getSkillState(state.run, "crafting");
  // Local refund formula — kept here so the crafting math is obvious in one
  // place (not split between the skills bonus aggregator).
  const refundPerLevel = 0.02;
  const refundCap = 0.30;
  const refundChance = Math.min(refundPerLevel * craftLevel, refundCap);

  const refunds = [];
  for (const [res, qty] of Object.entries(tool.cost || {})) {
    let actual = qty;
    for (let i = 0; i < qty; i++) {
      if (refundChance > 0 && rng() < refundChance) {
        actual -= 1;
        refunds.push(res);
      }
    }
    inventory[res] = (inventory[res] || 0) - actual;
  }

  // Add the tool to inventory.
  inventory[toolId] = (inventory[toolId] || 0) + 1;

  // Seed durability for the new tool to its max.
  // (canCraft refuses while one is owned, so this always means a fresh copy.)
  const toolDurability = { ...(state.run.toolDurability || {}) };
  if (tool.durability && typeof tool.durability.max === "number") {
    toolDurability[toolId] = tool.durability.max;
  }

  // Record in toolsCrafted (run-local).
  const toolsCrafted = { ...(state.run.toolsCrafted || {}) };
  const prevCount = toolsCrafted[toolId]?.count || 0;
  toolsCrafted[toolId] = { craftedAt: Date.now(), count: prevCount + 1 };

  let run = { ...state.run, inventory, toolDurability, toolsCrafted };

  const events = [{ kind: "craft", message: tool.onCraftedMessage }];
  if (refunds.length > 0) {
    events.push({
      kind: "craft",
      message: `🪡 Skilled hands — saved ${refunds.length} material${
        refunds.length !== 1 ? "s" : ""
      }.`,
    });
  }

  // Skill XP: crafting a tool teaches Crafting. Grant scaled by tool tier.
  const xpGain = (tool.tier || 1) * 4;
  const xpResult = gainXp(run, "crafting", xpGain);
  run = { ...run, skills: xpResult.skills };
  events.push(...xpResult.events);

  // Survival decay (bench work) + small resolve boost from finishing
  // something with your hands.
  if (survivalActive({ ...state, run })) {
    let stats = decayForAction(run.stats || {}, "Craft");
    stats = boostStats(stats, { happiness: +3, sanity: +1 });
    run = { ...run, stats };
  }

  return { run, persistent: state.persistent, events };
}

// Visible tools = tools whose research/skill prerequisites are met (so the
// player can see what's available). Already-crafted ones still show, marked
// owned. Locked ones with no research connection stay hidden.
export function getVisibleTools(state) {
  return getAllTools().filter((t) => {
    if ((state.run.inventory?.[t.id] || 0) > 0) return true;
    const req = t.requires || {};
    if (req.researched && !state.run.researched?.[req.researched]) return false;
    return true;
  });
}
