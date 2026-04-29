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

  // Action functions — UI calls these, never touches dispatch directly.
  const actions = {
    gather: () => dispatch({ type: ACTIONS.GATHER }),
    build: (buildingId) => dispatch({ type: ACTIONS.BUILD, buildingId }),
    research: (researchId) => dispatch({ type: ACTIONS.RESEARCH, researchId }),
    resetRun: () => dispatch({ type: ACTIONS.RESET_RUN }),
    prestige: () => dispatch({ type: ACTIONS.PRESTIGE }),
    markSplashSeen: () => dispatch({ type: ACTIONS.MARK_SPLASH_SEEN }),
    clearLog: () => dispatch({ type: ACTIONS.CLEAR_LOG }),
  };

  return { state, actions };
}
