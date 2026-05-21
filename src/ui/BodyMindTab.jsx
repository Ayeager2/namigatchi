// Left column's primary tab — Body & Mind stats.
// Wraps SurvivalBars and shows a quiet placeholder before survival activates.

import { survivalActive } from "../systems/survival.js";
import SurvivalBars from "./SurvivalBars.jsx";

export default function BodyMindTab({ state }) {
  const active = survivalActive(state);

  return (
    <div className="bodymind-tab">
      {active ? (
        <SurvivalBars state={state} />
      ) : (
        <p className="muted bodymind-empty">
          The body is quiet for now. Hunger and thirst arrive once the world
          asks something of you.
        </p>
      )}
    </div>
  );
}
