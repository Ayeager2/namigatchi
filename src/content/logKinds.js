// Classification of log entries.
// Every event emitted by the game systems has a `kind`. This file maps each
// kind to a category — "recent" (transient gameplay feedback) or "unlocks"
// (narrative progression beats the player will want to revisit).
//
// Adding a new kind = new entry here. UI tabs filter on category, not on
// individual kinds, so new content slots in automatically.

export const LOG_KINDS = {
  // Gameplay feedback — interesting in the moment, less so later.
  resource:     { category: "recent" },
  nothing:      { category: "recent" },
  buildFail:    { category: "recent" },
  researchFail: { category: "recent" },
  consume:      { category: "recent" },
  actionFail:   { category: "recent" },

  // Progression / story beats — the player will want to reread these.
  rockFind:  { category: "unlocks" },
  awaken:    { category: "unlocks" },
  whisper:   { category: "unlocks" },
  build:     { category: "unlocks" },
  research:  { category: "unlocks" },

  // World threats — surfaced in Recent so they feel immediate, not buried.
  threat:    { category: "recent" },
  damage:    { category: "recent" },

  // Random world events — narrative beats; live in Unlocks so the player
  // can re-read their journey and the choices they made.
  event_good:    { category: "unlocks" },
  event_strange: { category: "unlocks" },
  event_choice:  { category: "unlocks" },

  // Music unlocks — narrative beat (you've heard a new sound for this era).
  music_unlocked: { category: "unlocks" },

  // Skill progression — the "I'm getting good at this" beats.
  // The 0→1 unlock is unlocks-tab worthy; routine level-ups stay in Recent
  // so the unlocks tab doesn't fill with noise on long runs.
  skill_unlock:  { category: "unlocks" },
  skill_levelup: { category: "recent" },

  // Crafting — making a tool is a Recent beat (transient feedback).
  craft:     { category: "recent" },
  craftFail: { category: "recent" },

  // Hunting — feedback during a hunt action.
  hunt:     { category: "recent" },
  huntFail: { category: "recent" },
};

export function getLogCategory(kind) {
  return LOG_KINDS[kind]?.category || "recent";
}

export function filterByCategory(log, category) {
  return (log || []).filter((e) => getLogCategory(e.kind) === category);
}
