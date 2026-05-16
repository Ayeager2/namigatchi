// Era is a derived value, not a stored field. Computed from milestones.

export const ERAS = {
  0: { id: 0, name: "Scavenger" },
  1: { id: 1, name: "Awakening" },
  2: { id: 2, name: "Settler" },
  3: { id: 3, name: "Awakened World" },
};

const ERA2_REQUIRED_RESEARCH = ["foraging", "fire", "knapping"];

// Era 3 entry: Era 2 mastery proven — Forge built, Smithing + Fletching
// learned, the Bow crafted (toolsCrafted, lifetime-of-run so it survives
// breakage), AND a Home built (the magical era is for those who have a
// place to be magical in).
const ERA3_REQUIRED_RESEARCH = ["smithing", "fletching"];

function era3Eligible(run) {
  if (!run.built?.forge) return false;
  if (!run.built?.home) return false;
  const r = run.researched || {};
  if (!ERA3_REQUIRED_RESEARCH.every((id) => r[id])) return false;
  if (!run.toolsCrafted?.bow) return false;
  return true;
}

export function computeEra(state) {
  const { run } = state;

  if (!run.rockAwakened || !run.built?.hut) return 0;

  if (era3Eligible(run)) return 3;

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
  if (era < 3) {
    if (!run.built?.forge) reqs.push("Build a Forge");
    if (!run.built?.home) reqs.push("Build a Home");
    const learned = run.researched || {};
    for (const id of ERA3_REQUIRED_RESEARCH) {
      if (!learned[id]) reqs.push(`Learn ${id[0].toUpperCase() + id.slice(1)}`);
    }
    if (!run.toolsCrafted?.bow) reqs.push("Craft a Bow");
    return reqs;
  }
  return [];
}
