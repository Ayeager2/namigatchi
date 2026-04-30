// The orchestrator: wires reducer, save/load, exposes actions to UI.
// Single hook for the whole game state.

import { useEffect, useReducer, useRef } from "react";
import { reducer } from "./reducer.js";
import { ACTIONS } from "./actions.js";
import { freshGame, loadGame, saveGame } from "./save.js";

function init() {
  return loadGame() ?? freshGame();
}

export function useGameStore() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const didMount = useRef(false);

  // Persist on every state change after initial mount.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    saveGame(state);
  }, [state]);

  // Real-time tick — every 15 seconds, dispatch TICK so events can roll.
  // The actual interval check (60s) happens inside the TICK handler; this
  // outer cadence just gives the system regular opportunities to fire.
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: ACTIONS.TICK });
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  // Action functions — UI calls these, never touches dispatch directly.
  const actions = {
    gather: () => dispatch({ type: ACTIONS.GATHER }),
    build: (buildingId) => dispatch({ type: ACTIONS.BUILD, buildingId }),
    research: (researchId) => dispatch({ type: ACTIONS.RESEARCH, researchId }),
    eat: () => dispatch({ type: ACTIONS.EAT }),
    drink: () => dispatch({ type: ACTIONS.DRINK }),
    rest: () => dispatch({ type: ACTIONS.REST }),
    respondToEvent: (choiceId) =>
      dispatch({ type: ACTIONS.RESPOND_TO_EVENT, choiceId }),
    syncMusicUnlocks: () => dispatch({ type: ACTIONS.SYNC_MUSIC_UNLOCKS }),
    resetRun: () => dispatch({ type: ACTIONS.RESET_RUN }),
    prestige: () => dispatch({ type: ACTIONS.PRESTIGE }),
    markSplashSeen: () => dispatch({ type: ACTIONS.MARK_SPLASH_SEEN }),
    clearLog: () => dispatch({ type: ACTIONS.CLEAR_LOG }),
  };

  return { state, actions };
}
