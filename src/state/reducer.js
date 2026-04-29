// The reducer is intentionally THIN. It dispatches to systems for actual logic.
// Everything that mutates game state goes through this funnel — no exceptions.
// That property is what makes save/load, debugging, and undo trivial later.

import { ACTIONS } from "./actions.js";
import { freshRun } from "./run.js";
import { performGather } from "../systems/gathering.js";
import { performBuild } from "../systems/building.js";
import { performListen } from "../systems/research.js";
import { performSurvivalAction } from "../systems/survival.js";
import { getPrestigeReward } from "../systems/prestige.js";
import {
  snapshotRun,
  updateLifetime,
  appendRunHistory,
} from "../systems/stats.js";

const MAX_LOG = 30;

// `events` may be a single event or an array of events.
// Single actions can emit multiple log entries (e.g. an awakening + a whisper).
function appendLog(run, events) {
  if (!events) return run;
  const arr = Array.isArray(events) ? events : [events];
  let log = run.log;
  for (const event of arr) {
    if (!event) continue;
    const entry = { t: Date.now(), kind: event.kind, message: event.message };
    log = [entry, ...log];
  }
  return { ...run, log: log.slice(0, MAX_LOG) };
}

// Captures a snapshot of the run that's about to end and merges it into
// persistent lifetime stats and run history. Used by both RESET_RUN and PRESTIGE.
function endRunAndSnapshot(state, ending) {
  const snapshot = snapshotRun(state, ending);
  const lifetimeStats = updateLifetime(state.persistent.lifetimeStats, snapshot);
  const runHistory = appendRunHistory(state.persistent.runHistory || [], snapshot);
  return { snapshot, lifetimeStats, runHistory };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD:
      return action.payload || state;

    case ACTIONS.RESET_RUN: {
      // Wipe the current run with NO Echo grant. Snapshot the run for stats.
      const { lifetimeStats, runHistory } = endRunAndSnapshot(state, "reset");
      const persistent = {
        ...state.persistent,
        runHistory,
        lifetimeStats: {
          ...lifetimeStats,
          runsStarted: lifetimeStats.runsStarted + 1,
        },
      };
      return { persistent, run: freshRun() };
    }

    case ACTIONS.PRESTIGE: {
      // Channel the Rock: wipe run, grant Echoes, snapshot for stats.
      const reward = getPrestigeReward(state);
      const { lifetimeStats, runHistory } = endRunAndSnapshot(state, "prestige");
      const persistent = {
        ...state.persistent,
        echoes: state.persistent.echoes + reward.echoes,
        runHistory,
        lifetimeStats: {
          ...lifetimeStats,
          runsStarted: lifetimeStats.runsStarted + 1,
          runsCompleted: lifetimeStats.runsCompleted + 1,
        },
      };
      return { persistent, run: freshRun() };
    }

    case ACTIONS.GATHER: {
      const { run, persistent, events } = performGather(state);
      return {
        persistent,
        run: appendLog(run, events),
      };
    }

    case ACTIONS.BUILD: {
      const { run, persistent, events } = performBuild(state, action.buildingId);
      return {
        persistent,
        run: appendLog(run, events),
      };
    }

    case ACTIONS.RESEARCH: {
      const { run, persistent, events } = performListen(state, action.researchId);
      return {
        persistent,
        run: appendLog(run, events),
      };
    }

    case ACTIONS.EAT: {
      const { run, persistent, events } = performSurvivalAction(state, "eat");
      return { persistent, run: appendLog(run, events) };
    }

    case ACTIONS.DRINK: {
      const { run, persistent, events } = performSurvivalAction(state, "drink");
      return { persistent, run: appendLog(run, events) };
    }

    case ACTIONS.REST: {
      const { run, persistent, events } = performSurvivalAction(state, "rest");
      return { persistent, run: appendLog(run, events) };
    }

    case ACTIONS.MARK_SPLASH_SEEN:
      if (state.run.splashSeen) return state;
      return { ...state, run: { ...state.run, splashSeen: true } };

    case ACTIONS.CLEAR_LOG:
      return { ...state, run: { ...state.run, log: [] } };

    default:
      return state;
  }
}
