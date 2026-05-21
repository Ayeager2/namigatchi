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
        <span className="stone-icon">{isDormant ? "🪨" : "👁️"}</span>
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
