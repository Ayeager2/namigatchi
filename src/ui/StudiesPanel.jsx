// Arcane Studies — left rail tab content.
import { useEffect, useState } from "react";
import { getStudy } from "../content/studies.js";
import {
  IDLE_THRESHOLD_MS,
  getActiveStudyProgress,
} from "../systems/studies.js";

function formatMMSS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StudyRow({ state, actions, nodeId, isActive, isPaused }) {
  const def = getStudy(nodeId);
  const prog = state.run.studyProgress?.[nodeId];
  if (!def || !prog) return null;

  // Live extrapolation for the active row; other rows show committed value.
  const live = isActive ? getActiveStudyProgress(state.run) : null;
  const accumulated = live ? live.accumulatedMs : (prog.accumulatedMs || 0);
  const dur = def.durationMs || 0;
  const pct = dur > 0 ? Math.max(0, Math.min(1, accumulated / dur)) : 0;
  const remainingMs = Math.max(0, dur - accumulated);

  const effectBits = [];
  if (def.unlocksSpell) effectBits.push(`unlocks spell ${def.unlocksSpell}`);
  if (def.addsStat) {
    for (const [k, v] of Object.entries(def.addsStat)) {
      effectBits.push(`+${v} ${k}`);
    }
  }
  if (def.worldScoreDelta) effectBits.push(`World Score +${def.worldScoreDelta}`);
  const effectStr = effectBits.length ? ` · ${effectBits.join(", ")}` : "";
  const tooltip = `${def.name}${effectStr}\n\n${def.description || ""}`;

  return (
    <div
      className={`study-row ${isActive ? "is-active" : "is-other"} ${
        isPaused && isActive ? "is-paused" : ""
      }`}
      title={tooltip}
    >
      <div className="study-row-header">
        <span className="study-row-icon" aria-hidden="true">{def.icon}</span>
        <span className="study-row-name">{def.name}</span>
        <span className="study-row-time muted">
          {formatMMSS(accumulated)} / {formatMMSS(dur)}
        </span>
      </div>
      <div className="study-row-bar">
        <div className="study-row-bar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      {isActive && isPaused && (
        <div className="study-row-status muted">
          Paused — your last action interrupted the focus.
        </div>
      )}
      {isActive && !isPaused && (
        <div className="study-row-status muted">
          Studying — {formatMMSS(remainingMs)} remaining.
        </div>
      )}
      {!isActive && (
        <div className="study-row-status muted">
          Paused. Make active to continue.
        </div>
      )}
      <div className="study-row-actions">
        {!isActive && (
          <button
            type="button"
            className="btn btn-secondary btn-tiny"
            onClick={() => actions.setActiveStudy(nodeId)}
            title="Switch focus to this study — no time lost on either."
          >
            Make active
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-tiny"
          onClick={() => {
            if (confirm(`Cancel "${def.name}"? Time lost; materials gone.`)) {
              actions.cancelStudy(nodeId);
            }
          }}
          title="Cancel — discards accumulated time. Materials were spent at start, no refund."
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function StudiesPanel({ state, actions, onOpenStudyTree }) {
  const [, setTick] = useState(0);
  const activeId = state.run.activeStudyId;
  const hasActive = !!activeId;
  useEffect(() => {
    if (!hasActive) return;
    const id = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [hasActive]);

  const progressIds = Object.keys(state.run.studyProgress || {});
  const completedCount = Object.keys(state.run.studiesCompleted || {}).length;

  const lastActionAt = state.run.lastActionAt || 0;
  const isPaused = Date.now() - lastActionAt < IDLE_THRESHOLD_MS;

  const others = progressIds.filter((id) => id !== activeId).sort((a, b) => {
    const defA = getStudy(a);
    const defB = getStudy(b);
    const pctA = defA?.durationMs
      ? (state.run.studyProgress[a].accumulatedMs || 0) / defA.durationMs
      : 0;
    const pctB = defB?.durationMs
      ? (state.run.studyProgress[b].accumulatedMs || 0) / defB.durationMs
      : 0;
    return pctB - pctA;
  });

  return (
    <div className="studies-panel">
      <h3 className="studies-panel-title">Studies</h3>
      <p className="muted studies-panel-lead">
        Sit at the altar. Real lessons take time. The clock pauses when you act.
      </p>

      {activeId && (
        <>
          <div className="studies-section-label muted">Active</div>
          <StudyRow
            state={state}
            actions={actions}
            nodeId={activeId}
            isActive={true}
            isPaused={isPaused}
          />
        </>
      )}

      {others.length > 0 && (
        <>
          <div className="studies-section-label muted">Other lessons in progress</div>
          {others.map((id) => (
            <StudyRow
              key={id}
              state={state}
              actions={actions}
              nodeId={id}
              isActive={false}
              isPaused={false}
            />
          ))}
        </>
      )}

      {progressIds.length === 0 && (
        <div className="studies-empty muted">
          No lessons in progress. Open the Path Trees to choose what to study.
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary studies-open-trees"
        onClick={onOpenStudyTree}
      >
        Open Path Trees
      </button>

      <div className="studies-completed muted">
        {completedCount > 0
          ? `${completedCount} ${completedCount === 1 ? "lesson" : "lessons"} learned — etchings on the altar.`
          : "Nothing learned at the altar yet."}
      </div>
    </div>
  );
}
