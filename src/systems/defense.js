// Defense helpers — shared between threats.js (one-shot resolution) and
// combat.js (multi-round fight loop). Extracted into its own file to
// break the cycle that would form if both imported from each other.
//
// `defense` here is the SETTLEMENT defense stat — from buildings (Stone
// Walls etc.) and research (Vigilance, Hidden Stores). It applies to:
//   • Food stolen in raid-style threats (resolveThreat in threats.js)
//   • HP damage reduction in combat (combat.js — until Task #39 splits
//     personal `armor` from settlement `defense`)
//
// `foodStealReduction` is the raid-specific food-protection stat. Only
// the one-shot threats use it today.

import { getResearch } from "../content/research.js";
import { getBuilding } from "../content/buildings.js";

export function getDefense(state) {
  let def = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.defense) def += r.effect.defense;
  }
  for (const id of Object.keys(state.run.built || {})) {
    const b = getBuilding(id);
    if (b?.effect?.defense) def += b.effect.defense;
  }
  return def;
}

export function getFoodStealReduction(state) {
  let red = 0;
  for (const id of Object.keys(state.run.researched || {})) {
    const r = getResearch(id);
    if (r?.effect?.foodStealReduction) red += r.effect.foodStealReduction;
  }
  for (const id of Object.keys(state.run.built || {})) {
    const b = getBuilding(id);
    if (b?.effect?.foodStealReduction) red += b.effect.foodStealReduction;
  }
  return red;
}
