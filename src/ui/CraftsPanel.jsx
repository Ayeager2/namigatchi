// Crafts trigger card — opens the tools modal.
// Compact summary in the left column: known recipes / crafted counts.
//
// Renders nothing until at least one tool-craft research is unlocked
// (so it stays out of sight in raw Era 0/early Era 1).

import { canCraft, getVisibleTools } from "../systems/crafting.js";

export default function CraftsPanel({ state, onOpen }) {
  const visible = getVisibleTools(state);
  if (visible.length === 0) return null;

  const owned = visible.filter(
    (t) => (state.run.inventory?.[t.id] || 0) > 0
  ).length;
  const available = visible.filter(
    (t) =>
      (state.run.inventory?.[t.id] || 0) === 0 && canCraft(state, t.id).ok
  ).length;
  const total = visible.length;

  return (
    <button className="card card--trigger" onClick={onOpen} type="button">
      <div className="trigger-top">
        <h3>Crafts</h3>
        <span className="trigger-arrow" aria-hidden="true">
          →
        </span>
      </div>
      <div className="trigger-stats">
        <span>
          <strong>{owned}</strong> crafted
        </span>
        <span className="trigger-sep">·</span>
        <span>
          <strong>{available}</strong> available
        </span>
        <span className="trigger-sep">·</span>
        <span className="muted">{total} known</span>
      </div>
    </button>
  );
}
