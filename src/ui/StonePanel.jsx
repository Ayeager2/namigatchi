// The persistent rock companion strip at the bottom of the layout.
// Once the hut is built, the strip becomes the door to the Teachings tree —
// click it to open the modal. Until then it's purely informational.
//
// Renders nothing if rock not found yet.

import { getRockProgress, getRockState } from "../systems/rock.js";

export default function StonePanel({ state, onListen }) {
  const { run } = state;
  const rock = getRockState(run);

  if (rock === "absent") return null;

  const progress = getRockProgress(run);
  const isDormant = rock === "dormant";
  const canListen = !!run.built?.hut && !!onListen;

  const Wrapper = canListen ? "button" : "div";
  const wrapperProps = canListen
    ? {
        type: "button",
        onClick: onListen,
        "aria-label": "Listen to the Stone's teachings",
      }
    : {};

  return (
    <Wrapper
      className={`stone-strip ${isDormant ? "is-dormant" : "is-awakened"} ${
        canListen ? "is-clickable" : ""
      }`}
      {...wrapperProps}
    >
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
          <div className="stone-flavor">It watches you, calm and ancient.</div>
        )}
      </div>
    </Wrapper>
  );
}
