// Crafting system. Reducer dispatches CRAFT_TOOL; this file owns the logic.

import { getTool, getAllTools } from "../content/tools.js";
import { gainXp, getSkillState } from "./skills.js";
import {
  decayForAction,
  survivalActive,
  boostStats,
} from "./survival.js";

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
    const seeded = typeof current === "number" ? current : dur.max;
    const next = seeded - 1;

    if (next <= 0) {
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
  return { run: { ...run, inventory, toolDurability }, events };
}

export function canCraft(state, toolId) {
  const tool = getTool(toolId);
  if (!tool) return { ok: false, reason: "Unknown tool." };

  // Stackable consumables (potions) can be crafted again to add to the
  // stack. Non-stackable tools (axe, bow, etc.) are unique items.
  if (!tool.isStackable && (state.run.inventory?.[toolId] || 0) > 0) {
    return { ok: false, reason: "You already have one." };
  }

  const req = tool.requires || {};
  if (req.researched && !state.run.researched?.[req.researched]) {
    return { ok: false, reason: "You haven't listened for the way of it yet." };
  }
  if (req.toolOwned && !(state.run.inventory?.[req.toolOwned] > 0)) {
    return { ok: false, reason: "You need another tool first." };
  }
  if (req.builtBuilding && !state.run.built?.[req.builtBuilding]) {
    return { ok: false, reason: "You need to build the right place first." };
  }
  if (req.skill) {
    for (const [skillId, minLevel] of Object.entries(req.skill)) {
      const { level } = getSkillState(state.run, skillId);
      if (level < minLevel) {
        return { ok: false, reason: `Your hands aren't ready (skill needs lvl ${minLevel}).` };
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

export function performCraft(state, toolId, rng = Math.random) {
  const tool = getTool(toolId);
  if (!tool) {
    return { run: state.run, persistent: state.persistent, events: [{ kind: "craftFail", message: "Unknown tool." }] };
  }
  const check = canCraft(state, toolId);
  if (!check.ok) {
    return { run: state.run, persistent: state.persistent, events: [{ kind: "craftFail", message: check.reason }] };
  }

  const inventory = { ...state.run.inventory };
  const { level: craftLevel } = getSkillState(state.run, "crafting");
  const refundChance = Math.min(0.02 * craftLevel, 0.30);

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

  inventory[toolId] = (inventory[toolId] || 0) + 1;

  const toolDurability = { ...(state.run.toolDurability || {}) };
  if (tool.durability && typeof tool.durability.max === "number") {
    toolDurability[toolId] = tool.durability.max;
  }

  const toolsCrafted = { ...(state.run.toolsCrafted || {}) };
  const prevCount = toolsCrafted[toolId]?.count || 0;
  toolsCrafted[toolId] = { craftedAt: Date.now(), count: prevCount + 1 };

  let run = { ...state.run, inventory, toolDurability, toolsCrafted };

  const events = [{ kind: "craft", message: tool.onCraftedMessage }];
  if (refunds.length > 0) {
    events.push({
      kind: "craft",
      message: `🪡 Skilled hands — saved ${refunds.length} material${refunds.length !== 1 ? "s" : ""}.`,
    });
  }

  const xpGain = (tool.tier || 1) * 4;
  const xpResult = gainXp(run, "crafting", xpGain);
  run = { ...run, skills: xpResult.skills };
  events.push(...xpResult.events);

  if (survivalActive({ ...state, run })) {
    let stats = decayForAction(run.stats || {}, "Craft");
    stats = boostStats(stats, { happiness: +3, sanity: +1 });
    run = { ...run, stats };
  }

  return { run, persistent: state.persistent, events };
}

export function getVisibleTools(state) {
  return getAllTools().filter((t) => {
    if ((state.run.inventory?.[t.id] || 0) > 0) return true;
    const req = t.requires || {};
    if (req.researched && !state.run.researched?.[req.researched]) return false;
    return true;
  });
}
