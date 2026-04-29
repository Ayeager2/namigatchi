// All action types in one place. Single source of truth.
// Reducer dispatches; UI calls action functions; never use raw strings elsewhere.

export const ACTIONS = {
  // Lifecycle
  LOAD: "LOAD",
  RESET_RUN: "RESET_RUN", // wipe run, no rewards
  PRESTIGE: "PRESTIGE",   // wipe run, grant Echoes for milestones reached

  // Era 0
  GATHER: "GATHER",

  // Misc
  CLEAR_LOG: "CLEAR_LOG",
};
