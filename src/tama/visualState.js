// src/tama/visualState.js

export const VISUAL = {
  DEAD: "DEAD",
  SLEEP: "SLEEP",
  TANTRUM: "TANTRUM",
  SICK: "SICK",
  INJURED: "INJURED",
  POOP: "POOP",
  STINKY: "STINKY",
  NEEDY: "NEEDY",
  TIRED: "TIRED",
  BORED: "BORED",
  HAPPY: "HAPPY",
  IDLE: "IDLE",
};

export function getVisualState(s, mood) {
  // prioritize “most important thing to show”
  if (!s?.alive) return VISUAL.DEAD;
  if (s.sleeping) return VISUAL.SLEEP;

  if (s.tantrum) return VISUAL.TANTRUM;
  if (s.sick) return VISUAL.SICK;
  if (s.injured) return VISUAL.INJURED;

  // poop overrides stinky because it’s actionable + obvious
  if ((s.poops ?? 0) > 0) return VISUAL.POOP;

  // stinky if hygiene low
  if ((s.hygiene ?? 100) < 25) return VISUAL.STINKY;

  // translate common moods
  if (mood === "calling" || mood === "needy") return VISUAL.NEEDY;
  if (mood === "tired") return VISUAL.TIRED;
  if (mood === "bored") return VISUAL.BORED;
  if (mood === "happy") return VISUAL.HAPPY;

  return VISUAL.IDLE;
}

/**
 * Optional: map visual state -> animation className
 */
export function getVisualClass(v) {
  switch (v) {
    case VISUAL.SLEEP:
      return "pet pet--sleep";
    case VISUAL.TANTRUM:
      return "pet pet--tantrum";
    case VISUAL.SICK:
      return "pet pet--sick";
    case VISUAL.INJURED:
      return "pet pet--injured";
    case VISUAL.POOP:
      return "pet pet--poop";
    case VISUAL.STINKY:
      return "pet pet--stinky";
    case VISUAL.NEEDY:
      return "pet pet--needy";
    case VISUAL.DEAD:
      return "pet pet--dead";
    case VISUAL.HAPPY:
      return "pet pet--happy";
    default:
      return "pet pet--idle";
  }
}
