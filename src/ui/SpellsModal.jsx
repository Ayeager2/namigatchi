// Spells modal — list known spells, show cost + cooldown, cast on click.
// Style mirrors the Tools modal but flatter — spells are quick-cast,
// not crafted, so the detail pane is replaced with an inline Cast button
// inside each row.

import { useEffect, useState } from "react";
import { getKnownSpells, canCastSpell } from "../systems/spells.js";

function fmtSec(sec) {
  if (sec <= 0) return "ready";
  if (sec < 60) return `${sec}s`;
  return `${Math.ceil(sec / 60)}m`;
}

function SpellRow({ state, actions, spell }) {
  const [, force] = useState(0);
  const cdUntil = state.run.spellCooldowns?.[spell.id] || 0;
  const cooling = Date.now() < cdUntil;

  useEffect(() => {
    if (!cooling) return;
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [cooling]);

  const check = canCastSpell(state, spell.id);
  const remain = Math.max(0, Math.ceil((cdUntil - Date.now()) / 1000));
  const ready = check.ok;

  const costParts = [];
  if (spell.cost?.fragments) costParts.push(`${spell.cost.fragments} ✨`);
  if (spell.cost?.spirit) costParts.push(`${spell.cost.spirit} spirit`);

  return (
    <li className={`spell-row ${ready ? "is-ready" : "is-blocked"}`}>
      <div className="spell-row-head">
        <span className="spell-row-icon" aria-hidden="true">{spell.icon}</span>
        <span className="spell-row-name">{spell.name}</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => actions.castSpell(spell.id)}
          disabled={!ready}
          title={ready ? "Cast" : check.reason}
        >
          {cooling ? fmtSec(remain) : "Cast"}
        </button>
      </div>
      <p className="spell-row-desc muted">{spell.description}</p>
      <p className="spell-row-cost muted">Cost: {costParts.join(" · ")}</p>
    </li>
  );
}

export default function SpellsModal({ state, actions, onClose }) {
  const known = getKnownSpells(state);

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal modal--spells"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Spells"
      >
        <header className="modal-header">
          <h2>Spells</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </header>
        <div className="modal-body">
          {known.length === 0 ? (
            <p className="muted">No spells known.</p>
          ) : (
            <ul className="spell-list">
              {known.map((s) => (
                <SpellRow key={s.id} state={state} actions={actions} spell={s} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
