// Channel-the-Rock prestige confirm modal.

import { useEffect } from "react";

export default function PrestigeModal({ mode, reward, echoes = 0, onConfirm, onOpenShop, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isPrestige = mode === "prestige";

  return (
    <div
      className="modal-overlay modal-overlay--prestige"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`modal modal--prestige ${isPrestige ? "is-prestige" : "is-reset"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={isPrestige ? "Channel the Rock" : "Reset run"}
      >
        {isPrestige ? (
          <PrestigeBody reward={reward} echoes={echoes} />
        ) : (
          <ResetBody />
        )}

        <footer className="prestige-footer">
          <button
            type="button"
            className="btn btn-ghost prestige-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          {isPrestige && onOpenShop && echoes > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenShop}
              title="Spend your existing Echoes before channeling"
            >
              🌀 Echo Shop ({echoes})
            </button>
          )}
          {isPrestige ? (
            <button
              type="button"
              className="btn btn-prestige prestige-confirm"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              autoFocus
            >
              Channel the Rock
              <span className="btn-suffix">
                +{reward.echoes} Echo{reward.echoes !== 1 ? "es" : ""}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-danger prestige-confirm"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Wipe this run
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function PrestigeBody({ reward, echoes }) {
  return (
    <>
      <header className="prestige-header">
        <div className="prestige-glyph" aria-hidden="true">👁️</div>
        <h2>Channel the Rock</h2>
      </header>
      <div className="prestige-body">
        <p className="prestige-flavor">
          The stone hums against your palm. It has watched this world rise
          from your hands, and it knows the shape of every choice you've
          made. It can unmake the lot of it — bend it back to dust — and
          remember what it learned.
        </p>
        <p className="prestige-flavor prestige-flavor--dim">
          Everything in this life ends. What carries forward is{" "}
          <strong>Echoes</strong> — fragments of who you were, ready to
          shape who you'll be.
        </p>

        <div className="prestige-reward">
          <div className="prestige-reward-total">
            <span className="prestige-reward-num">{reward.echoes}</span>
            <span className="prestige-reward-label">
              Echo{reward.echoes !== 1 ? "es" : ""} earned
            </span>
          </div>

          {reward.reasons && reward.reasons.length > 0 && (
            <ul className="prestige-reasons">
              {reward.reasons.map((r, i) => (
                <li key={i}>
                  <span className="prestige-reason-value">+{r.value}</span>
                  <span className="prestige-reason-label">{r.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {echoes > 0 && (
          <p className="prestige-flavor prestige-flavor--dim">
            After channeling, you will hold{" "}
            <strong>{echoes + (reward?.echoes || 0)} Echoes</strong> total.
          </p>
        )}

        <p className="prestige-warn muted">
          This run ends here. Inventory, buildings, research, tools, skills —
          all wiped. Echoes carry forward.
        </p>
      </div>
    </>
  );
}

function ResetBody() {
  return (
    <>
      <header className="prestige-header is-reset">
        <div className="prestige-glyph" aria-hidden="true">🪨</div>
        <h2>Reset this run</h2>
      </header>
      <div className="prestige-body">
        <p className="prestige-flavor">
          The stone has not yet awakened far enough to channel its power
          forward. Wiping now means starting over with nothing — no Echoes
          earned.
        </p>
        <p className="prestige-warn muted">
          Inventory, buildings, research, tools, skills — all gone. Are you
          sure?
        </p>
      </div>
    </>
  );
}
