// Stone strip — Listen target + Channel button + active-study progress bar.
import { useEffect, useState } from "react";
import { getRockProgress, getRockState } from "../systems/rock.js";
import { getAvailableResearch } from "../systems/research.js";
import {
  IDLE_THRESHOLD_MS,
  getActiveStudyProgress,
} from "../systems/studies.js";
import { getStudy } from "../content/studies.js";

export default function StonePanel({
  state,
  onListen,
  channelEligible,
  channelReward,
  onChannel,
}) {
  const { run } = state;
  const rock = getRockState(run);

  // 1s heartbeat so the active-study progress bar moves smoothly between
  // 15s TICKs. getActiveStudyProgress extrapolates live; this just
  // triggers re-render.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!run.activeStudyId) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [run.activeStudyId]);

  if (rock === "absent") return null;

  const progress = getRockProgress(run);
  const isDormant = rock === "dormant";
  const canListen = !!run.built?.hut && !!onListen;
  const availableTeachings = !isDormant ? getAvailableResearch(state).length : 0;
  const studyProgress = !isDormant ? getActiveStudyProgress(run) : null;
  const studyDef = studyProgress ? getStudy(studyProgress.nodeId) : null;
  const studyPaused =
    !!studyProgress && Date.now() - (run.lastActionAt || 0) < IDLE_THRESHOLD_MS;
  const since = run.rockAwakenedAt ? Date.now() - run.rockAwakenedAt : Infinity;
  const justAwakened = !isDormant && since >= 0 && since < 4000;
  const showChannel = !isDormant && channelEligible && !!onChannel;

  const innerClickable = canListen;
  const innerProps = innerClickable
    ? {
        role: "button",
        tabIndex: 0,
        onClick: onListen,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onListen();
          }
        },
        "aria-label": "Listen to the Stone's teachings",
      }
    : {};

  return (
    <div
      className={`stone-strip ${isDormant ? "is-dormant" : "is-awakened"} ${
        innerClickable ? "is-clickable" : ""
      }${justAwakened ? " just-awakened" : ""}`}
    >
      <div className="stone-strip-inner" {...innerProps}>
        <span className="stone-icon">
          {isDormant ? "🪨" : "👁️"}
          {availableTeachings > 0 && (
            <span
              className="stone-icon-badge"
              aria-label={`${availableTeachings} teachings available`}
            >
              {availableTeachings}
            </span>
          )}
        </span>
        <div className="stone-info">
          <div className="stone-title">
            The Stone
            <span className="stone-status">
              · {isDormant ? "Dormant" : "Awakened"}
            </span>
          </div>
          {isDormant ? (
            <div className="stone-progressline">
              <span className="stone-frag-text">
                {progress.current} / {progress.target} fragments
              </span>
              <div className="stone-progress">
                <div
                  className="stone-progress-fill"
                  style={{ width: `${progress.percent * 100}%` }}
                />
              </div>
            </div>
          ) : canListen ? (
            <div className="stone-flavor">
              It watches you. <em>Click to listen.</em>
            </div>
          ) : (
            <div className="stone-flavor">
              It watches you, calm and ancient.
            </div>
          )}

          {studyProgress && studyDef && (
            <div
              className={`stone-study-bar ${studyPaused ? "is-paused" : ""}`}
              title={
                studyPaused
                  ? `Studying ${studyDef.name} — paused while you act.`
                  : `Studying ${studyDef.name}.`
              }
            >
              <span className="stone-study-bar-icon" aria-hidden="true">
                {studyPaused ? "⏸" : studyDef.icon}
              </span>
              <div className="stone-study-bar-track">
                <div
                  className="stone-study-bar-fill"
                  style={{ width: `${studyProgress.pct * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showChannel && (
        <button
          type="button"
          className="btn btn-prestige stone-channel-btn"
          onClick={onChannel}
          title="Channel the Rock — end this run and convert fragments into Echoes"
        >
          Channel the Rock
          {channelReward?.echoes != null && (
            <span className="btn-suffix">
              +{channelReward.echoes} Echo
              {channelReward.echoes !== 1 ? "es" : ""}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
