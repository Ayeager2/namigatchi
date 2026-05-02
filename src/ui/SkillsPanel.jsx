// Skills tab content. Shows each active skill with current level + XP bar.
//
// Skills surface as a passive readout — there's no "spend points" UI, so
// this panel is purely informational. Hidden skills (active: false stubs)
// don't render. Visible only once the player has at least one skill entry
// (i.e. they've done at least one action that grants XP).
//
// The bar fills toward the next level. At max level, the bar is full and
// muted with a "Mastered" tag.

import {
  getActiveSkills,
} from "../content/skills.js";
import {
  getSkillState,
  getSkillProgress,
} from "../systems/skills.js";

export default function SkillsPanel({ state }) {
  const skills = getActiveSkills();

  // Render in a stable, sensible order: by category (defined elsewhere) then
  // alphabetically within. We don't sort by level so the layout doesn't
  // jump as the player progresses.
  const ordered = skills
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="skills-panel">
      <p className="muted skills-intro">
        Skills grow as you do the work. There is nothing to spend.
      </p>
      <ul className="skills-list">
        {ordered.map((s) => {
          const { level } = getSkillState(state.run, s.id);
          const prog = getSkillProgress(state.run, s.id);
          const dim = level === 0;
          return (
            <li
              key={s.id}
              className={`skill-row ${dim ? "skill-row--dim" : ""} ${
                prog.atMax ? "skill-row--max" : ""
              }`}
            >
              <div className="skill-row-top">
                <span className="skill-icon">{s.icon}</span>
                <span className="skill-name">{s.name}</span>
                <span className="skill-level">
                  {prog.atMax ? "Mastered" : `Lv ${level}`}
                </span>
              </div>
              <div
                className="skill-bar"
                aria-label={`${s.name} progress`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={prog.needed}
                aria-valuenow={prog.current}
              >
                <div
                  className="skill-bar-fill"
                  style={{ width: `${prog.percent * 100}%` }}
                />
              </div>
              <div className="skill-row-meta muted">
                {prog.atMax
                  ? "Skill capped — every act is mastery now."
                  : `${prog.current} / ${prog.needed} XP`}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
