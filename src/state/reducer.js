// The reducer is intentionally THIN. It dispatches to systems for actual logic.

import { ACTIONS } from "./actions.js";
import { freshRun } from "./run.js";
import { performGather } from "../systems/gathering.js";
import { performBuild } from "../systems/building.js";
import { performListen } from "../systems/research.js";
import { performCraft } from "../systems/crafting.js";
import { performHunt } from "../systems/hunting.js";
import { performSurvivalAction } from "../systems/survival.js";
import {
  applyPassiveProduction,
  clearStalePests,
} from "../systems/passive.js";
import { processSpoilage } from "../systems/storage.js";
import {
  maybeRollInterval,
  respondToActiveEvent,
} from "../systems/events.js";
import { getPrestigeReward } from "../systems/prestige.js";
import { computeEra } from "../systems/era.js";
import { getAllMusic } from "../content/audio.js";
import {
  snapshotRun,
  updateLifetime,
  appendRunHistory,
} from "../systems/stats.js";

const MAX_LOG = 30;

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
      return { persistent, run: appendLog(run, events) };
    }

    case ACTIONS.BUILD: {
      const { run, persistent, events } = performBuild(state, action.buildingId);
      return { persistent, run: appendLog(run, events) };
    }

    case ACTIONS.RESEARCH: {
      const { run, persistent, events } = performListen(state, action.researchId);
      return { persistent, run: appendLog(run, events) };
    }

    case ACTIONS.CRAFT_TOOL: {
      const { run, persistent, events } = performCraft(state, action.toolId);
      return { persistent, run: appendLog(run, events) };
    }

    case ACTIONS.HUNT: {
      const { run, persistent, events } = performHunt(state);
      return { persistent, run: appendLog(run, events) };
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

    case ACTIONS.SYNC_MUSIC_UNLOCKS: {
      const era = computeEra(state);
      const unlockedMusic = { ...(state.persistent.unlockedMusic || {}) };
      const newEvents = [];
      let changed = false;

      for (const track of getAllMusic()) {
        if (unlockedMusic[track.id]) continue;
        const eraTags = (track.tags || []).filter((t) => /^era\d+$/.test(t));
        if (eraTags.length === 0) continue;
        const eraNumbers = eraTags
          .map((t) => parseInt(t.slice(3), 10))
          .filter((n) => !isNaN(n));
        if (eraNumbers.length === 0) continue;
        const minEra = Math.min(...eraNumbers);
        if (era >= minEra) {
          unlockedMusic[track.id] = { unlockedAt: Date.now() };
          changed = true;
          newEvents.push({
            kind: "music_unlocked",
            message: `🎵 New music: "${track.title}"${
              track.artist ? ` by ${track.artist}` : ""
            }.`,
          });
        }
      }

      if (!changed) return state;
      return {
        persistent: { ...state.persistent, unlockedMusic },
        run: appendLog(state.run, newEvents),
      };
    }

    case ACTIONS.TICK: {
      // 1) passive production, 2) spoilage, 3) pest expiry, 4) interval roll.
      let run = state.run;
      let persistent = state.persistent;
      const allEvents = [];

      const passiveResult = applyPassiveProduction({ run, persistent });
      run = passiveResult.run;
      allEvents.push(...passiveResult.events);

      const spoilResult = processSpoilage({ run, persistent });
      run = spoilResult.run;
      allEvents.push(...spoilResult.events);

      const pestResult = clearStalePests(run);
      run = pestResult.run;
      allEvents.push(...pestResult.events);

      const eventResult = maybeRollInterval({ run, persistent });
      if (eventResult) {
        run = eventResult.run;
        persistent = eventResult.persistent;
        allEvents.push(...eventResult.events);
      }

      if (
        run === state.run &&
        persistent === state.persistent &&
        allEvents.length === 0
      ) {
        return state;
      }

      return { persistent, run: appendLog(run, allEvents) };
    }

    case ACTIONS.RESPOND_TO_EVENT: {
      const result = respondToActiveEvent(state, action.choiceId);
      return {
        persistent: result.persistent,
        run: appendLog(result.run, result.events),
      };
    }

    case ACTIONS.CLEAR_LOG:
      return { ...state, run: { ...state.run, log: [] } };

    default:
      return state;
  }
}
