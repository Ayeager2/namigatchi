// Skills system. Pure functions for XP grants, level computation, and
// declarative bonus aggregation.
//
// Design philosophy: skills are passive — they accumulate from doing the
// thing. There's no "spend points" UI; the player just does the activity
// and watches the level climb. This is the "Progress Knight" feel applied
// to the wasteland.
//
// Bonuses are declarative data in content/skills.js. Each system queries
// `getBonus(state, statName)` for the aggregated bonus across all skills.
// Adding a new bonus = new entry in the skill's bonuses array; the system
// that cares about the new stat starts reading it. No coupling.
//
// XP grants flow back through the reducer like any other state change:
// system functions return { run } slices that include updated skills.

import { getSkill, getAllSkills, getActiveSkills } from "../content/skills.js";

// Compute total XP required to reach level N from level 0.
// Curve types are dispatched declaratively from the skill's xpCurve config.
// "exponential": cumulative sum of base * multiplier^(i-1) for i in [1..N].
function xpToLevel(curve, level) {
  if (level <= 0) return 0;
  const { type, base, multiplier } = curve;
  if (type === "exponential") {
    // Sum of geometric series: base * (1 - r^N) / (1 - r), but we want the
    // cumulative threshold to reach level N — i.e., the sum of XP needed for
    // each level from 1..N.
    // XP needed for level i: base * multiplier^(i-1)
    // Cumulative for level N: base * (multiplier^N - 1) / (multiplier - 1)
    if (multiplier === 1) return base * level;
    return Math.floor((base * (Math.pow(multiplier, level) - 1)) / (multiplier - 1));
  }
  // Linear fallback
  return base * level;
}

// Compute current level given total XP. Walks up until next threshold exceeds.
// Capped at maxLevel from the skill definition.
export function computeLevel(skillId, xp) {
  const def = getSkill(skillId);
  if (!def) return 0;
  const cap = def.maxLevel ?? 50;
  let level = 0;
  while (level < cap && xp >= xpToLevel(def.xpCurve, level + 1)) {
    level += 1;
  }
  return level;
}

// Get the current skill state (xp + level), defaulting to fresh entry.
// Always returns a populated object — UI and systems can rely on shape.
export function getSkillState(run, skillId) {
  const entry = run?.skills?.[skillId];
  if (!entry) return { xp: 0, level: 0 };
  // Defensive: recompute level from xp in case of save migration drift.
  const level = computeLevel(skillId, entry.xp || 0);
  return { xp: entry.xp || 0, level };
}

// Progress toward the next level — useful for UI bars.
// Returns { current, needed, percent, atMax }.
export function getSkillProgress(run, skillId) {
  const def = getSkill(skillId);
  if (!def) return { current: 0, needed: 0, percent: 0, atMax: true };
  const { xp, level } = getSkillState(run, skillId);
  const cap = def.maxLevel ?? 50;
  if (level >= cap) {
    return { current: xp, needed: xp, percent: 1, atMax: true };
  }
  const floor = xpToLevel(def.xpCurve, level);
  const ceiling = xpToLevel(def.xpCurve, level + 1);
  const into = xp - floor;
  const span = Math.max(1, ceiling - floor);
  return {
    current: into,
    needed: span,
    percent: Math.max(0, Math.min(1, into / span)),
    atMax: false,
  };
}

// Aggregate bonus across all skills for a given stat name.
// Each skill contributes (perLevel * level), capped at the skill's max for
// that stat (if defined). Sum across skills is unbounded — meaningful caps
// belong on individual skills.
export function getBonus(run, statName) {
  let total = 0;
  for (const def of getAllSkills()) {
    if (!def.bonuses) continue;
    const { level } = getSkillState(run, def.id);
    if (level <= 0) continue;
    for (const b of def.bonuses) {
      if (b.stat !== statName) continue;
      let contribution = b.perLevel * level;
      if (typeof b.max === "number") {
        contribution = Math.min(contribution, b.max);
      }
      total += contribution;
    }
  }
  return total;
}

// Grant XP to a skill. Returns { skills, leveledUp, events }.
//   skills: new skills slice (immutable, replace caller's run.skills)
//   leveledUp: array of { skillId, fromLevel, toLevel } describing each crossed boundary
//   events: array of log events to surface (firstUnlockMessage on level 0→1)
//
// Stub skills (active: false) silently swallow XP grants — the system can
// call gainXp blindly and the right thing happens (no XP recorded for stubs).
export function gainXp(run, skillId, amount) {
  if (!amount || amount <= 0) {
    return { skills: run.skills || {}, leveledUp: [], events: [] };
  }
  const def = getSkill(skillId);
  if (!def || !def.active) {
    return { skills: run.skills || {}, leveledUp: [], events: [] };
  }

  const prev = getSkillState(run, skillId);
  const newXp = prev.xp + amount;
  const newLevel = computeLevel(skillId, newXp);
  const skills = {
    ...(run.skills || {}),
    [skillId]: { xp: newXp, level: newLevel },
  };

  const events = [];
  const leveledUp = [];
  if (newLevel > prev.level) {
    leveledUp.push({ skillId, fromLevel: prev.level, toLevel: newLevel });
    // The first time you cross 0→1 in a skill, surface a flavor message.
    if (prev.level === 0 && newLevel >= 1 && def.firstUnlockMessage) {
      events.push({
        kind: "skill_unlock",
        message: `${def.icon} ${def.firstUnlockMessage}`,
      });
    } else {
      events.push({
        kind: "skill_levelup",
        message: `${def.icon} ${def.name} → level ${newLevel}.`,
      });
    }
  }

  return { skills, leveledUp, events };
}

// Convenience: list active skills sorted by category order then by name.
// Used by the SkillsPanel UI.
export function listActiveSkillsForUI() {
  return getActiveSkills().slice().sort((a, b) => a.name.localeCompare(b.name));
}
