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

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    saveGame(state);
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: ACTIONS.TICK });
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  const actions = {
    gather: () => dispatch({ type: ACTIONS.GATHER }),
    build: (buildingId) => dispatch({ type: ACTIONS.BUILD, buildingId }),
    research: (researchId) => dispatch({ type: ACTIONS.RESEARCH, researchId }),
    craft: (toolId) => dispatch({ type: ACTIONS.CRAFT_TOOL, toolId }),
    hunt: () => dispatch({ type: ACTIONS.HUNT }),
    eat: () => dispatch({ type: ACTIONS.EAT }),
    drink: () => dispatch({ type: ACTIONS.DRINK }),
    rest: () => dispatch({ type: ACTIONS.REST }),
    respondToEvent: (choiceId) => dispatch({ type: ACTIONS.RESPOND_TO_EVENT, choiceId }),
    syncMusicUnlocks: () => dispatch({ type: ACTIONS.SYNC_MUSIC_UNLOCKS }),
    resetRun: () => dispatch({ type: ACTIONS.RESET_RUN }),
    prestige: () => dispatch({ type: ACTIONS.PRESTIGE }),
    markSplashSeen: () => dispatch({ type: ACTIONS.MARK_SPLASH_SEEN }),
    clearLog: () => dispatch({ type: ACTIONS.CLEAR_LOG }),
    devPatch: (patch) => dispatch({ type: ACTIONS.DEV_PATCH, patch }),
  };

  return { state, actions };
}
