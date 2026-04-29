// Era is a derived value, not a stored field. Computed from milestones.
// Pure function — cannot get out of sync with the actions taken.
// Recomputed on every read; cheap.

export const ERAS = {
  0: { id: 0, name: "Scavenger" },
  1: { id: 1, name: "Awakening" },
  // 2-7 will be added as their content lands.
};

export function computeEra(state) {
  const { run } = state;

  // Era 1: rock awakened AND hut built.
  if (run.rockAwakened && run.built?.hut) return 1;

  return 0;
}

export function getEra(state) {
  const id = computeEra(state);
  return ERAS[id] || ERAS[0];
}
