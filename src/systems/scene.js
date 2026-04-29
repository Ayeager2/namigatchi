// Scene composition — pure function from game state to scene description.
// The UI renders whatever this returns; UI doesn't decide what to show.
//
// Each layer has an id, text (for now — eventually an asset), and an optional
// visual variant. Adding a new visual layer = new entry in the array below
// with a condition. No UI changes required.

import { getRockState } from "./rock.js";

export function composeScene(state) {
  const { run } = state;
  const rock = getRockState(run);
  const hasHut = !!run.built?.hut;

  const layers = [];

  // Background — biome / sky
  let bgText;
  if (hasHut) {
    bgText = "[A wide dead landscape stretches around you — but here, around your hut, life has begun to creep back. A single sprout glows nearby.]";
  } else if (rock === "awakened") {
    bgText = "[A wide dead landscape — a single sprout of green glows nearby.]";
  } else {
    bgText = "[A wide dead landscape stretches in every direction. Ash drifts on a cold wind.]";
  }
  layers.push({ id: "bg", text: bgText });

  // Hut layer
  if (hasHut) {
    layers.push({
      id: "hut",
      text: "[🛖 A small hut of stone and wood. Yours.]",
    });
  }

  // Rock visual
  if (rock === "dormant") {
    layers.push({
      id: "rock-dormant",
      text: "[A small smooth stone rests in your hand, warm to the touch.]",
    });
  } else if (rock === "awakened") {
    layers.push({
      id: "rock-awakened",
      text: "[The stone has OPENED its eye. It watches you, calm and ancient.]",
    });
  }

  return { layers };
}
