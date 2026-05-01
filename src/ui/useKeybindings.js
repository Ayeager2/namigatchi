// Global keyboard shortcuts. Reads bindings from settings; dispatches actions.
//
// Critical design: e.repeat is filtered, so HOLDING a key does NOT auto-fire.
// The player must release and press again. Combined with the gather cooldown,
// this prevents key-mashing from bypassing game pacing.
//
// Inputs and contenteditable elements are skipped (don't fire shortcuts when
// the player is typing in a settings field, etc.).
//
// Pass `pauseAll: true` to disable all global keybindings (e.g. while a
// rebinding capture is active in the settings modal).

import { useEffect } from "react";

const ACTION_HANDLERS = {
  gather: (actions) => actions.gather(),
  rest: (actions) => actions.rest(),
  eat: (actions) => actions.eat(),
  drink: (actions) => actions.drink(),
};

export function useKeybindings(settings, actions, pauseAll = false) {
  useEffect(() => {
    if (pauseAll) return;

    const onKeyDown = (e) => {
      // Don't fire if the user is typing into a field.
      const t = e.target;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        t?.isContentEditable
      ) {
        return;
      }
      // Don't fire on key-repeat (holding the key shouldn't auto-fire).
      if (e.repeat) return;
      // Don't fire when modifiers are held (so Ctrl+G etc. don't trigger gather).
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const bindings = settings.keybindings || {};

      for (const [action, boundKey] of Object.entries(bindings)) {
        if (boundKey && boundKey === key && ACTION_HANDLERS[action]) {
          e.preventDefault();
          ACTION_HANDLERS[action](actions);
          return;
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [settings.keybindings, actions, pauseAll]);
}
