// Stats screen — observability for nerds.
// Shows current run stats, last completed run with comparison to the run before
// it, and lifetime aggregates. Gated behind first-prestige unlock.

import { useEffect, useState } from "react";
import { computeEra, getEra } from "../systems/era.js";
import {
  compareRuns,
  formatDuration,
} from "../systems/stats.js";
import { getResource } from "../content/resources.js";

function fmtDelta(n, opts = {}) {
  if (n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  const cls =
    opts.lowerIsBetter
      ? n < 0 ? "delta--good" : "delta--bad"
      : n > 0 ? "delta--good" : "delta--bad";
  return <span className={`delta ${cls}`}>{sign}{opts.format ? opts.format(n) : n}</span>;
}

function ResourceList({ resources }) {
  const entries = Object.entries(resources || {})
    .filter(([, v]) => v > 0);
  if (entries.length === 0) {
    return <span className="muted">none</span>;
  }
  return (
    <span className="resource-line">
      {entries.map(([id, qty], i) => {
        const r = getResource(id);
        return (
          <span key={id} className="resource-pill">
            {r?.icon} {qty}
            {i < entries.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}

export default function StatsPanel({ state }) {
  const era = computeEra(state);
  const eraInfo = getEra(state);
  const { run, persistent } = state;
  const lifetime = persistent.lifetimeStats;
  const history = persistent.runHistory || [];
  const lastRun = history[0] || null;
  const prevRun = history[1] || null;
  const comparison = lastRun ? compareRuns(lastRun, prevRun) : null;

  // Tick a re-render every second so the "current run duration" stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const currentDuration = run.startedAt ? Date.now() - run.startedAt : 0;
  const totalGatheredThisRun = Object.values(run.gathered || {}).reduce(
    (s, v) => s + v,
    0
  );

  return (
    <div className="card stats-card">
      <h3>Stats</h3>

      {/* Current run */}
      <div className="stats-section">
        <div className="stats-section-title">Current Run</div>
        <dl className="stats-grid">
          <dt>Duration</dt>
          <dd>{formatDuration(currentDuration)}</dd>

          <dt>Era</dt>
          <dd>{eraInfo.name}</dd>

          <dt>Gathers</dt>
          <dd>{run.gatherCount || 0}</dd>

          <dt>Resources</dt>
          <dd><ResourceList resources={run.gathered} /></dd>

          <dt>Total this run</dt>
          <dd>{totalGatheredThisRun}</dd>
        </dl>
      </div>

      {/* Last completed run with delta */}
      {lastRun && (
        <div className="stats-section">
          <div className="stats-section-title">
            Last Run (#{lastRun.runIndex})
          </div>
          <dl className="stats-grid">
            <dt>Duration</dt>
            <dd>
              {formatDuration(lastRun.durationMs)}
              {comparison?.available && " "}
              {comparison?.available &&
                fmtDelta(comparison.deltas.durationMs, {
                  lowerIsBetter: true,
                  format: (n) => formatDuration(Math.abs(n)),
                })}
            </dd>

            <dt>Era reached</dt>
            <dd>
              {lastRun.eraReached}
              {comparison?.available && " "}
              {comparison?.available &&
                fmtDelta(comparison.deltas.eraReached)}
            </dd>

            <dt>Resources</dt>
            <dd><ResourceList resources={lastRun.resourcesGathered} /></dd>

            <dt>Total resources</dt>
            <dd>
              {Object.values(lastRun.resourcesGathered || {}).reduce(
                (s, v) => s + v,
                0
              )}
              {comparison?.available && " "}
              {comparison?.available &&
                fmtDelta(comparison.deltas.resourcesTotal)}
            </dd>

            <dt>Echoes earned</dt>
            <dd>
              {lastRun.echoesEarned}
              {comparison?.available && " "}
              {comparison?.available &&
                fmtDelta(comparison.deltas.echoesEarned)}
            </dd>

            <dt>Ending</dt>
            <dd className="muted">{lastRun.ending}</dd>
          </dl>
        </div>
      )}

      {/* Lifetime */}
      <div className="stats-section">
        <div className="stats-section-title">Lifetime</div>
        <dl className="stats-grid">
          <dt>Runs played</dt>
          <dd>{lifetime.runsStarted}</dd>

          <dt>Runs completed</dt>
          <dd>{lifetime.runsCompleted}</dd>

          <dt>Best era reached</dt>
          <dd>{lifetime.bestEraReached}</dd>

          <dt>Rocks awakened</dt>
          <dd>{lifetime.rocksAwakened}</dd>

          <dt>Huts raised</dt>
          <dd>{lifetime.hutsBuilt || 0}</dd>

          <dt>Total gathers</dt>
          <dd>{lifetime.totalGathers}</dd>

          <dt>Total resources</dt>
          <dd><ResourceList resources={lifetime.resourcesByType} /></dd>

          <dt>Fastest awakening</dt>
          <dd>{formatDuration(lifetime.fastestAwakeningMs)}</dd>

          <dt>Fastest hut</dt>
          <dd>{formatDuration(lifetime.fastestHutMs)}</dd>

          <dt>Time played</dt>
          <dd>{formatDuration(lifetime.msPlayedTotal)}</dd>
        </dl>
      </div>
    </div>
  );
}
