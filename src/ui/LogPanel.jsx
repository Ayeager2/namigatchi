// Recent activity log. Lives in the right column on desktop.

export default function LogPanel({ state }) {
  const { run } = state;

  return (
    <div className="card">
      <h3>Recent</h3>
      <ul className="log-list">
        {run.log.length === 0 && (
          <li className="muted">Nothing has happened yet.</li>
        )}
        {run.log.slice(0, 12).map((entry, i) => (
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
