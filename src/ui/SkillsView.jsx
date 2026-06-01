// Skills view (#65) — Skills content rendered in the center column.
// Was previously the "Skills" tab inside LeftColumn's lc-content.

import SkillsPanel from "./SkillsPanel.jsx";

export default function SkillsView({ state }) {
  return (
    <section className="action-panel action-panel--skills">
      <div className="panel-header">
        <h2>Skills</h2>
        <p className="muted">
          What your hands and head learn by repetition.
        </p>
      </div>
      <SkillsPanel state={state} />
    </section>
  );
}
