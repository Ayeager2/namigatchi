// Rock system — derived state and helpers.
// For now, very minimal. Will grow significantly:
//   - rock learning XP from player actions (the 0.01% trickle)
//   - rock form evolution along alignment axis
//   - rock providing in-run bonuses based on form
//   - persistent rock state across prestiges

import { FRAGMENTS_TO_AWAKEN } from "../content/gatherTable.js";

// "absent" | "dormant" | "awakened"
export function getRockState(run) {
  if (!run.rockFound) return "absent";
  if (!run.rockAwakened) return "dormant";
  return "awakened";
}

// Progress toward the current rock milestone (used for the progress bar).
export function getRockProgress(run) {
  if (!run.rockFound) return { current: 0, target: 0, percent: 0 };
  if (!run.rockAwakened) {
    const current = run.inventory.fragments;
    return {
      current,
      target: FRAGMENTS_TO_AWAKEN,
      percent: Math.min(1, current / FRAGMENTS_TO_AWAKEN),
    };
  }
  return { current: 0, target: 0, percent: 1 };
}
