// Era transition story moments — fire the FIRST time the player reaches each
// era within a run. Tracked in run.eraMilestonesSeen.
//
// Each entry: { sanityBoost, happinessBoost, log: { kind, message } }

export const ERA_STORIES = {
  1: {},

  2: {
    sanityBoost: 5,
    happinessBoost: 5,
    log: {
      kind: "era_transition",
      message:
        "🌅 You stand in the hut at the end of a long day. Fire pit smoking. Stones laid. Skills earned in the dust. You look at the wasteland and it looks back — and for the first time, it does not feel only hostile. There is more to learn. There is more to make. The Settler era opens before you.",
    },
  },

  3: {
    // Era 3 is the darker turn. Sanity dips — the world goes thin, the
    // fragments hum louder, the stone is suddenly listening differently.
    sanityBoost: -5,
    happinessBoost: 0,
    log: {
      kind: "era_transition",
      message:
        "🌌 You wake in your home, and the air is wrong. The walls are the same. The hearth is the same. But the fragments in your pack are humming, and the stone — the stone — is not whispering. It is waiting. Something has crossed over. The Awakened World begins.",
    },
  },
};

export function getEraStory(era) {
  return ERA_STORIES[era] || null;
}
