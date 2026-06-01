// Studies view (#65) — StudiesPanel rendered in the center column.
// "Open Path Trees" button stays inside StudiesPanel to launch the tree modal
// since the tree is too dense to render inline alongside in-progress studies.

import StudiesPanel from "./StudiesPanel.jsx";

export default function StudiesView({ state, actions, onOpenStudyTree }) {
  return (
    <section className="action-panel action-panel--studies">
      <div className="panel-header">
        <h2>Arcane Studies</h2>
        <p className="muted">
          Time-cost lessons at the Stone Altar. The clock pauses when you act.
        </p>
      </div>
      <StudiesPanel
        state={state}
        actions={actions}
        onOpenStudyTree={onOpenStudyTree}
      />
    </section>
  );
}
