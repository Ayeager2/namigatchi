// Era is a derived value, not a stored field. Computed from milestones.
// Pure function — cannot get out of sync with the actions taken.

export const ERAS = {
  0: { id: 0, name: "Scavenger" },
  1: { id: 1, name: "Awakening" },
  2: { id: 2, name: "Settler" },
  // 3-7 will be added as their content lands.
};

// Era 2 entry condition (per docs/systems.md): hut + fire pit + all tier-1
// teachings learned (foraging, fire, knapping). The transition itself is a
// story event — see content/events.js eraSettler — that fires once per run
// when this condition is first met.
const ERA2_REQUIRED_RESEARCH = ["foraging", "fire", "knapping"];

export function computeEra(state) {
  const { run } = state;

  // Era 1: rock awakened AND hut built.
  if (!run.rockAwakened || !run.built?.hut) return 0;

  // Era 2: + fire pit + all tier-1 research.
  if (run.built?.firepit) {
    const r = run.researched || {};
    const allTier1 = ERA2_REQUIRED_RESEARCH.every((id) => r[id]);
    if (allTier1) return 2;
  }

  return 1;
}

export function getEra(state) {
  const id = computeEra(state);
  return ERAS[id] || ERAS[0];
}

// What's still missing for the next era? Returns an array of human-readable
// requirements ("Build a fire pit", "Learn Foraging") so the UI can hint
// the player toward the next milestone. Empty array means already at the
// next era or the era after.
export function getNextEraRequirements(state) {
  const era = computeEra(state);
  const { run } = state;
  const reqs = [];
  if (era < 1) {
    if (!run.rockFound) reqs.push("Find the rock");
    if (run.rockFound && !run.rockAwakened) reqs.push("Awaken the rock (collect 10 fragments)");
    if (run.rockAwakened && !run.built?.hut) reqs.push("Build a hut");
    return reqs;
  }
  if (era < 2) {
    if (!run.built?.firepit) reqs.push("Build a fire pit");
    const learned = run.researched || {};
    for (const id of ERA2_REQUIRED_RESEARCH) {
      if (!learned[id]) reqs.push(`Learn ${id[0].toUpperCase() + id.slice(1)}`);
    }
    return reqs;
  }
  return [];
}
