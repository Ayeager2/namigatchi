// Unlocks log — shows narrative progression beats the player will want to
// re-read. The rock's whispers, awakenings, buildings raised, teachings learned.
// All the moments worth remembering.
//
// Unlike Recent, this log keeps a longer tail (up to 30 entries) and uses
// richer typography so the player can revisit their journey at leisure.

import { filterByCategory } from "../content/logKinds.js";

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function UnlocksPanel({ state }) {
  const { run } = state;
  const entries = filterByCategory(run.log, "unlocks");

  return (
    <div className="card">
      <h3>Unlocks</h3>
      {entries.length === 0 ? (
        <p className="muted">No discoveries yet. The world is still and silent.</p>
      ) : (
        <ul className="unlock-list">
          {entries.map((entry, i) => (
            <li
              key={`${entry.t}-${i}`}
              className={`unlock-entry log-entry--${entry.kind}`}
            >
              <div className="unlock-time">{fmtTime(entry.t)}</div>
              <div className="unlock-message">{entry.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
