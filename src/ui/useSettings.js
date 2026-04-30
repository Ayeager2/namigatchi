// React hook that loads/persists/applies user settings.
// Returns { settings, update, toggleInventoryCollapse }.

import { useEffect, useState } from "react";
import {
  loadSettings,
  saveSettings,
  applySettingsToDOM,
} from "../state/settings.js";

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  // Save + apply on every change.
  useEffect(() => {
    saveSettings(settings);
    applySettingsToDOM(settings);
  }, [settings]);

  // Apply immediately on mount (in case load happened before DOM ready).
  useEffect(() => {
    applySettingsToDOM(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(changes) {
    setSettings((s) => ({ ...s, ...changes }));
  }

  function toggleInventoryCollapse(categoryId) {
    setSettings((s) => ({
      ...s,
      inventoryCollapsed: {
        ...s.inventoryCollapsed,
        [categoryId]: !s.inventoryCollapsed[categoryId],
      },
    }));
  }

  return { settings, update, toggleInventoryCollapse };
}
