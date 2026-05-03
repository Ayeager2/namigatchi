// Classification of log entries.

export const LOG_KINDS = {
  resource:     { category: "recent" },
  nothing:      { category: "recent" },
  buildFail:    { category: "recent" },
  researchFail: { category: "recent" },
  consume:      { category: "recent" },
  actionFail:   { category: "recent" },

  rockFind:  { category: "unlocks" },
  awaken:    { category: "unlocks" },
  whisper:   { category: "unlocks" },
  build:     { category: "unlocks" },
  research:  { category: "unlocks" },

  threat:    { category: "recent" },
  damage:    { category: "recent" },

  event_good:    { category: "unlocks" },
  event_strange: { category: "unlocks" },
  event_choice:  { category: "unlocks" },

  music_unlocked: { category: "unlocks" },

  skill_unlock:  { category: "unlocks" },
  skill_levelup: { category: "recent" },

  craft:     { category: "recent" },
  craftFail: { category: "recent" },

  hunt:     { category: "recent" },
  huntFail: { category: "recent" },

  dev:      { category: "recent" },

  era_transition: { category: "unlocks" },
};

export function getLogCategory(kind) {
  return LOG_KINDS[kind]?.category || "recent";
}

export function filterByCategory(log, category) {
  return (log || []).filter((e) => getLogCategory(e.kind) === category);
}
