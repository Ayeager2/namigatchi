// The Era 0 gathering panel. Single sticky early-game screen.
// Has: gather button, inventory, rock progress (when applicable), recent log.

import { getResource } from "../content/resources.js";
import { getRockProgress, getRockState } from "../systems/rock.js";

export default function GatherPanel({ state, actions }) {
  const { run } = state;
  const rock = getRockState(run);
  const rockProgress = getRockProgress(run);

  // Build inventory display from non-zero entries, in resource definition order.
  const inventoryItems = Object.entries(run.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const res = getResource(id);
      return res ? { ...res, qty } : null;
    })
    .filter(Boolean);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>The Wasteland</h2>
        <p className="muted">There is nothing here. There is everything to find.</p>
      </div>

      <div className="action-row">
        <button className="btn btn-primary" onClick={actions.gather}>
          Gather
        </button>
      </div>

      <div className="card">
        <h3>Inventory</h3>
        {inventoryItems.length === 0 ? (
          <p className="muted">Empty.</p>
        ) : (
          <ul className="inventory-list">
            {inventoryItems.map((item) => (
              <li key={item.id}>
                <span className="icon">{item.icon}</span>
                <span className="name">{item.name}</span>
                <span className="qty">{item.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rock !== "absent" && (
        <div className="card">
          <h3>The Stone</h3>
          {rock === "dormant" && (
            <>
              <p className="muted">It pulses faintly. Bring it more fragments.</p>
              <div className="progress">
                <div
                  className="progress-fill"
                  style={{ width: `${rockProgress.percent * 100}%` }}
                />
              </div>
              <p className="progress-label">
                Fragments: {rockProgress.current} / {rockProgress.target}
              </p>
            </>
          )}
          {rock === "awakened" && (
            <p className="awaken-text">
              It watches you, awake. Something is beginning.
            </p>
          )}
        </div>
      )}

      <div className="card">
        <h3>Recent</h3>
        <ul className="log-list">
          {run.log.length === 0 && (
            <li className="muted">Nothing has happened yet.</li>
          )}
          {run.log.slice(0, 8).map((entry, i) => (
            <li
              key={`${entry.t}-${i}`}
              className={`log-entry log-entry--${entry.kind}`}
            >
              {entry.message}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
