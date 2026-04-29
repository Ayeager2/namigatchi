// Prestige system. Determines what the player has earned this run, and how
// many Echoes they get if they Channel the Rock now.
//
// As the game grows, more milestones get added here. Each milestone is just
// another entry contributing to the total Echo reward, with a human-readable
// reason for the UI to show.
//
// Returns:
//   echoes:   total Echoes that would be granted right now
//   reasons:  [{ label, value }, ...]  -- displayed to the player on confirm
//   eligible: true iff at least one milestone has been hit (echoes > 0)

export function getPrestigeReward(state) {
  const { run } = state;
  const reasons = [];
  let echoes = 0;

  // Era 0 milestone: the Stone awakened.
  if (run.rockAwakened) {
    const v = 1;
    echoes += v;
    reasons.push({ id: "rockAwakened", label: "The Stone awakened", value: v });
  }

  // Era 1 milestone: a hut was built (player has a home).
  if (run.built?.hut) {
    const v = 2;
    echoes += v;
    reasons.push({ id: "hutBuilt", label: "A home was raised", value: v });
  }

  // Era 1 progression: research learned (the rock taught you).
  const researchCount = Object.keys(run.researched || {}).length;
  if (researchCount > 0) {
    const v = researchCount; // +1 Echo per teaching learned
    echoes += v;
    reasons.push({
      id: "researchLearned",
      label: `${researchCount} teaching${researchCount === 1 ? "" : "s"} learned`,
      value: v,
    });
  }

  // Era 1 progression: fire pit raised.
  if (run.built?.firepit) {
    const v = 1;
    echoes += v;
    reasons.push({ id: "firepitBuilt", label: "Fire was raised", value: v });
  }

  // Future milestones plug in here.

  return { echoes, reasons, eligible: echoes > 0 };
}
