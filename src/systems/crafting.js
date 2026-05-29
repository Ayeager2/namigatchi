// Crafting system. Reducer dispatches CRAFT_TOOL; this file owns the logic.

import { getTool, getAllTools } from "../content/tools.js";
import { getAllWeapons } from "../content/weapons.js";
import { totalWater, spendWater } from "../content/resources.js";
import { getResourceCap } from "./storage.js";
import { getStudyPassives } from "./studies.js";
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

  // Study passives soften wear — Stone Mend (Elemental) 25%, Binding Mark
  // (Sigilcraft) 50%. They stack additively up to a cap of 90% reduction
  // (tools can never become fully unbreakable through studies alone).
  const passives = getStudyPassives(run);
  const wearReduction = Math.min(0.9, passives.toolDurabilityBonus || 0);
  // Convert wear reduction to a chance to SKIP this wear tick — gives a
  // smooth probabilistic feel rather than fractional durability.
  const skipChance = wearReduction;

  // Iterate both tools AND pure weapons so combat wear works on either.
  // Weapons share the same durability shape (`durability: { max, wearsOn }`)
  // and live in the same run.toolDurability keyed by item id. See
  // content/weapons.js + systems/equipment.js for the Combat Phase 1
  // foundation; Combat Phase 2 (#33) ticks combat wear here.
  for (const tool of [...getAllTools(), ...getAllWeapons()]) {
    if (!(inventory[tool.id] > 0)) continue;
    const dur = tool.durability;
    if (!dur || dur.wearsOn !== actionTag) continue;

    // Roll for the study-passive durability save.
    if (skipChance > 0 && Math.random() < skipChance) continue;

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

  // Resource-producing recipes (scrollCraft, inkCraft, etc.) — block when
  // the output resource is already at its baseCap, so the craft doesn't
  // silently lose the produced unit. See content/tools.js producesResource.
  if (tool.producesResource) {
    const { id: outId } = tool.producesResource;
    const cap = getResourceCap(state, outId);
    const have = state.run.inventory?.[outId] || 0;
    if (cap !== Infinity && have >= cap) {
      return { ok: false, reason: "No room to store more." };
    }
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
    if (res === "water") {
      if (totalWater(state.run.inventory) < qty) {
        return { ok: false, reason: "Not enough materials." };
      }
      continue;
    }
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

  let inventory = { ...state.run.inventory };
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
    if (res === "water") {
      inventory = spendWater(inventory, actual);
    } else {
      inventory[res] = (inventory[res] || 0) - actual;
    }
  }

  // Resource-producing recipes (scrollCraft, inkCraft) increment a *resource*
  // in inventory rather than the recipe id. Regular tool recipes still
  // increment under their tool id. Either way: clamp to baseCap if the
  // produced item has one (canCraft already blocks at-cap, so this is
  // belt-and-suspenders for the edge of an exactly-full inventory).
  if (tool.producesResource) {
    const { id: outId, qty = 1 } = tool.producesResource;
    const cap = getResourceCap(state, outId);
    const have = inventory[outId] || 0;
    const room = cap === Infinity ? qty : Math.max(0, cap - have);
    inventory[outId] = have + Math.min(qty, room);
  } else {
    inventory[toolId] = (inventory[toolId] || 0) + 1;
  }

  const toolDurability = { ...(state.run.toolDurability || {}) };
  // Resource-producing recipes don't have durability — durability tracks a
  // physical tool instance, not a stack of materials.
  if (
    !tool.producesResource &&
    tool.durability &&
    typeof tool.durability.max === "number"
  ) {
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
