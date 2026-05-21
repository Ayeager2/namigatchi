// Center column on desktop, top of stack on mobile.
//
// After the layout refactor (ERA_PLAN.md "Layout refactor — Part B/C"),
// this panel no longer holds the action buttons or survival bars:
//   - Survival bars moved to the Body & Mind tab in LeftColumn.
//   - Action buttons (Gather, Hunt, Eat, Drink, Rest, Ritual) moved to
//     the footer ActionStrip.
//
// What's left here is the *world panel*: the narrative title for the
// player's current locale and the pest indicator (carrion flock, etc.)
// that's contextually about the environment rather than the player.

import PestIndicator from "./PestIndicator.jsx";

export default function ActionPanel({ state }) {
  return (
    <section className="action-panel action-panel--world">
      <div className="panel-header">
        <h2>The Wasteland</h2>
        <p className="muted">
          There is nothing here. There is everything to find.
        </p>
      </div>

      <PestIndicator state={state} />
    </section>
  );
}
