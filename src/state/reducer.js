// The reducer is intentionally THIN. It dispatches to systems for actual logic.
// Everything that mutates game state goes through this funnel — no exceptions.
// That property is what makes save/load, debugging, and undo trivial later.

import { ACTIONS } from "./actions.js";
import { freshRun } from "./run.js";
import { performGather } from "../systems/gathering.js";
import { getPrestigeReward } from "../systems/prestige.js";

const MAX_LOG = 30;

function appendLog(run, event) {
  if (!event) return run;
  const entry = { t: Date.now(), kind: event.kind, message: event.message };
  return { ...run, log: [entry, ...run.log].slice(0, MAX_LOG) };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD:
      return action.payload || state;

    case ACTIONS.RESET_RUN: {
      // Wipe the current run with NO Echo grant. Player chose to give up.
      const persistent = {
        ...state.persistent,
        lifetimeStats: {
          ...state.persistent.lifetimeStats,
          runsStarted: state.persistent.lifetimeStats.runsStarted + 1,
        },
      };
      return { persistent, run: freshRun() };
    }

    case ACTIONS.PRESTIGE: {
      // Channel the Rock: wipe run AND grant Echoes for milestones reached.
      // The reward is recomputed from current state so it can't be tampered with.
      const reward = getPrestigeReward(state);
      const persistent = {
        ...state.persistent,
        echoes: state.persistent.echoes + reward.echoes,
        lifetimeStats: {
          ...state.persistent.lifetimeStats,
          runsStarted: state.persistent.lifetimeStats.runsStarted + 1,
          runsCompleted: state.persistent.lifetimeStats.runsCompleted + 1,
        },
      };
      return { persistent, run: freshRun() };
    }

    case ACTIONS.GATHER: {
      const { run, persistent, event } = performGather(state);
      return {
        persistent,
        run: appendLog(run, event),
      };
    }

    case ACTIONS.CLEAR_LOG:
      return { ...state, run: { ...state.run, log: [] } };

    default:
      return state;
  }
}
