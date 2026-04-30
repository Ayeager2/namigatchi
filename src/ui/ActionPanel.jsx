// The center column on desktop, top of stack on mobile.
// The location header + the primary action (Gather), plus survival bars and
// secondary actions (Eat, Drink, Rest) once survival is active.

import { canGather, survivalActive, canPerformSurvivalAction } from "../systems/survival.js";
import SurvivalBars from "./SurvivalBars.jsx";

export default function ActionPanel({ state, actions }) {
  const survival = survivalActive(state);
  const gatherCheck = canGather(state);
  const eatCheck = canPerformSurvivalAction(state, "eat");
  const drinkCheck = canPerformSurvivalAction(state, "drink");
  const restCheck = canPerformSurvivalAction(state, "rest");

  return (
    <section className="action-panel">
      <div className="panel-header">
        <h2>The Wasteland</h2>
        <p className="muted">There is nothing here. There is everything to find.</p>
      </div>

      {survival && <SurvivalBars state={state} />}

      <div className="action-row">
        <button
          className="btn btn-primary"
          onClick={actions.gather}
          disabled={!gatherCheck.ok}
          title={gatherCheck.ok ? "" : gatherCheck.reason}
        >
          {gatherCheck.ok ? "Gather" : "Too tired"}
        </button>
      </div>

      {survival && (
        <div className="action-row action-row--secondary">
          <button
            className="btn btn-secondary"
            onClick={actions.eat}
            disabled={!eatCheck.ok}
            title={eatCheck.ok ? "" : eatCheck.reason}
          >
            🌿 Eat
          </button>
          <button
            className="btn btn-secondary"
            onClick={actions.drink}
            disabled={!drinkCheck.ok}
            title={drinkCheck.ok ? "" : drinkCheck.reason}
          >
            💧 Drink
          </button>
          <button
            className="btn btn-secondary"
            onClick={actions.rest}
            disabled={!restCheck.ok}
            title={restCheck.ok ? "" : restCheck.reason}
          >
            {state.run.built?.firepit ? "🔥 Rest" : "🛌 Rest"}
          </button>
        </div>
      )}
    </section>
  );
}
