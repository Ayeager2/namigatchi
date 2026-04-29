// Recent activity log — shows transient gameplay feedback.
// Filters the run log to events tagged as "recent" category in logKinds.

import { filterByCategory } from "../content/logKinds.js";

export default function LogPanel({ state }) {
  const { run } = state;
  const entries = filterByCategory(run.log, "recent").slice(0, 12);

  return (
    <div className="card">
      <h3>Recent</h3>
      <ul className="log-list">
        {entries.length === 0 && (
          <li className="muted">Nothing has happened yet.</li>
        )}
        {entries.map((entry, i) => (
          <li
            key={`${entry.t}-${i}`}
            className={`log-entry log-entry--${entry.kind}`}
          >
            {entry.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
