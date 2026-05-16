// Spells trigger card — opens the spells modal.
// Compact summary in the left column. Renders nothing until at least one
// spell is learned (era < 3 or pre-arcaneAwakening keeps it hidden).

import { getKnownSpells, canCastSpell } from "../systems/spells.js";

export default function SpellsPanel({ state, onOpen }) {
  const known = getKnownSpells(state);
  if (known.length === 0) return null;

  const ready = known.filter((s) => canCastSpell(state, s.id).ok).length;
  const total = known.length;

  return (
    <button className="card card--trigger" onClick={onOpen} type="button">
      <div className="trigger-top">
        <h3>Spells</h3>
        <span className="trigger-arrow" aria-hidden="true">
          →
        </span>
      </div>
      <div className="trigger-stats">
        <span>
          <strong>{ready}</strong> ready
        </span>
        <span className="trigger-sep">·</span>
        <span className="muted">{total} known</span>
      </div>
    </button>
  );
}
