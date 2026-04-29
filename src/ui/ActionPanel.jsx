// The center column on desktop, top of stack on mobile.
// The location header + the primary action (Gather, for now).
// Eventually this becomes the "active scene" panel — different actions per
// location, per era, per situation.

export default function ActionPanel({ state, actions }) {
  return (
    <section className="action-panel">
      <div className="panel-header">
        <h2>The Wasteland</h2>
        <p className="muted">There is nothing here. There is everything to find.</p>
      </div>

      <div className="action-row">
        <button className="btn btn-primary" onClick={actions.gather}>
          Gather
        </button>
      </div>
    </section>
  );
}
