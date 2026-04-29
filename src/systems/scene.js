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

  const layers = [];

  // Background — biome / sky
  layers.push({
    id: "bg",
    text:
      rock === "awakened"
        ? "[A wide dead landscape — a single sprout of green glows nearby.]"
        : "[A wide dead landscape stretches in every direction. Ash drifts on a cold wind.]",
  });

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
