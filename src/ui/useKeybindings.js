// Global keyboard shortcuts. Reads bindings from settings; dispatches actions.

import { useEffect } from "react";

const ACTION_HANDLERS = {
  gather: (actions) => actions.gather(),
  rest: (actions) => actions.rest(),
  eat: (actions, settings) => actions.eat(settings?.eatPreference || null),
  drink: (actions, settings) => actions.drink(settings?.drinkPreference || null),
  hunt: (actions) => actions.hunt(),
};

export function useKeybindings(settings, actions, pauseAll = false) {
  useEffect(() => {
    if (pauseAll) return;

    const onKeyDown = (e) => {
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        t?.isContentEditable
      ) {
        return;
      }
      if (e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const bindings = settings.keybindings || {};

      for (const [action, boundKey] of Object.entries(bindings)) {
        if (boundKey && boundKey === key && ACTION_HANDLERS[action]) {
          e.preventDefault();
          ACTION_HANDLERS[action](actions, settings);
          return;
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [settings.keybindings, settings, actions, pauseAll]);
}
