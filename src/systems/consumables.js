// Consumables system. Reducer dispatches USE_TOOL; this owns the logic.
//
// A consumable is a tool with { consumable: true, useEffect: {...} }.
// "Using" one consumes 1 from inventory and applies useEffect to stats.
// No cooldowns or alignment cost — potions are an emergency button you paid
// for at craft time.

import { getTool } from "../content/tools.js";
import { applyEffect } from "./survival.js";

export function canUseTool(state, toolId) {
  const tool = getTool(toolId);
  if (!tool) return { ok: false, reason: "Unknown item." };
  if (!tool.consumable) return { ok: false, reason: "Not usable." };
  if ((state.run.inventory?.[toolId] || 0) <= 0) {
    return { ok: false, reason: "None left." };
  }
  return { ok: true };
}

export function performUseTool(state, toolId) {
  const tool = getTool(toolId);
  if (!tool) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "actionFail", message: "Unknown item." }],
    };
  }
  const check = canUseTool(state, toolId);
  if (!check.ok) {
    return {
      run: state.run,
      persistent: state.persistent,
      events: [{ kind: "actionFail", message: check.reason }],
    };
  }

  // Consume one.
  const inventory = { ...state.run.inventory };
  inventory[toolId] = (inventory[toolId] || 0) - 1;
  if (inventory[toolId] <= 0) delete inventory[toolId];

  // Apply effect.
  const stats = applyEffect(state.run.stats || {}, tool.useEffect || {});

  const run = { ...state.run, inventory, stats };
  const events = [
    {
      kind: "consume",
      message: tool.onUseMessage || `You use the ${tool.name}.`,
    },
  ];
  return { run, persistent: state.persistent, events };
}
