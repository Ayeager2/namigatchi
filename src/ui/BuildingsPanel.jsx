// Buildings trigger card — opens the buildings tree modal.
// Compact summary in the left column: built / available counts.
//
// Renders nothing until the rock is awakened (no buildings to consider yet).

import { canBuild, getVisibleBuildings } from "../systems/building.js";

export default function BuildingsPanel({ state, onOpen }) {
  const visible = getVisibleBuildings(state);
  if (visible.length === 0) return null;

  const built = visible.filter((b) => state.run.built?.[b.id]).length;
  const available = visible.filter(
    (b) => !state.run.built?.[b.id] && canBuild(state, b.id).ok
  ).length;
  const total = visible.length;

  return (
    <button className="card card--trigger" onClick={onOpen} type="button">
      <div className="trigger-top">
        <h3>Buildings</h3>
        <span className="trigger-arrow" aria-hidden="true">
          →
        </span>
      </div>
      <div className="trigger-stats">
        <span>
          <strong>{built}</strong> built
        </span>
        <span className="trigger-sep">·</span>
        <span>
          <strong>{available}</strong> available
        </span>
        <span className="trigger-sep">·</span>
        <span className="muted">{total} total</span>
      </div>
    </button>
  );
}
