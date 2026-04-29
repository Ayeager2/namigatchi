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

  // Future milestones plug in here. Examples:
  //   if (run.era >= 1) { echoes += 2; reasons.push(...) }
  //   if (run.era >= 2) { echoes += 5; reasons.push(...) }
  //   bonus echoes for time efficiency, alignment commitment, etc.

  return { echoes, reasons, eligible: echoes > 0 };
}
