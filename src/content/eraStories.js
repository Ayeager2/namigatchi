// Era transition story moments — fire the FIRST time the player reaches each
// era within a run. Tracked in run.eraMilestonesSeen.
//
// Each entry: { sanityBoost, happinessBoost, log: { kind, message } }

export const ERA_STORIES = {
  1: {
    // Era 1 is reached when the hut goes up, which already has its own
    // dramatic moment (the hut-built whisper). We don't need a separate
    // story event — leaving this entry empty so the system no-ops.
  },

  2: {
    sanityBoost: 5,
    happinessBoost: 5,
    log: {
      kind: "era_transition",
      message:
        "🌅 You stand in the hut at the end of a long day. Fire pit smoking. Stones laid. Skills earned in the dust. You look at the wasteland and it looks back — and for the first time, it does not feel only hostile. There is more to learn. There is more to make. The Settler era opens before you.",
    },
  },

  // 3-7: filled in as those eras land.
};

export function getEraStory(era) {
  return ERA_STORIES[era] || null;
}
