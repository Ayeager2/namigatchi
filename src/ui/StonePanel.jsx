// The persistent rock companion strip at the bottom of the layout.
// Once the hut is built, the strip becomes the door to the Teachings tree —
// click the main strip body to open the modal.
//
// Once prestige is unlocked AND the player has accumulated enough echoes to
// be eligible, the awakening-purple **Channel the Rock** button appears on
// the right side of the strip (inline, no longer in the footer).
// See ERA_PLAN.md "Layout refactor — Part C".
//
// Renders nothing if rock not found yet.

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

  if (rock === "absent") return null;

  const progress = getRockProgress(run);
  const isDormant = rock === "dormant";
  const canListen = !!run.built?.hut && !!onListen;

  // Count teachings the player can listen to right now. Drives the small
  // red notification badge on the stone strip (BUGS.md #007). Only
  // meaningful once the stone has awakened — dormant rock can't be
  // listened to.
  const availableTeachings = !isDormant
    ? getAvailableResearch(state).length
    : 0;

  // Active arcane study — surfaced as a subtle progress bar at the bottom
  // of the strip when the player has one underway. Lets them feel the
  // clock tick even when they're not on the Studies tab. Pause indicator
  // when their last action was recent (within IDLE_THRESHOLD_MS).
  // Task #30 — see ERA_PLAN.md "Arcane Studies → UI".
  const studyProgress = !isDormant ? getActiveStudyProgress(run) : null;
  const studyDef = studyProgress ? getStudy(studyProgress.nodeId) : null;
  const studyPaused =
    !!studyProgress && Date.now() - (run.lastActionAt || 0) < IDLE_THRESHOLD_MS;

  // Flash animation when awakening just happened (within 4s).
  const since = run.rockAwakenedAt ? Date.now() - run.rockAwakenedAt : Infinity;
  const justAwakened = !isDormant && since >= 0 && since < 4000;

  const showChannel = !isDormant && channelEligible && !!onChannel;

  // Inner click target: only fires onListen if the click wasn't on the
  // Channel button. We split this into an inner clickable region rather
  // than nesting buttons (illegal HTML).
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

          {/* Active arcane study indicator — subtle thin bar. */}
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
