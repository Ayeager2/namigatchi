// User preferences (settings) — separate from game state.
// Persists in its own localStorage key so settings survive across saves,
// across runs, and across game data wipes.
//
// Settings store accessibility & UI preferences only. Anything that affects
// gameplay belongs in run/persistent state.

const STORAGE_KEY = "namigatchi-settings";

export const SETTINGS_DEFAULTS = {
  theme: "dark",         // "dark" | "sepia"
  font: "system",        // "system" | "lexend" | "atkinson"
  fontSize: "normal",    // "small" | "normal" | "large"
  // Inventory section collapse state. true = collapsed, missing/false = open.
  inventoryCollapsed: {},
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...SETTINGS_DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      ...SETTINGS_DEFAULTS,
      ...parsed,
      inventoryCollapsed: {
        ...SETTINGS_DEFAULTS.inventoryCollapsed,
        ...(parsed.inventoryCollapsed || {}),
      },
    };
  } catch {
    return { ...SETTINGS_DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

// Apply settings to the DOM by setting body classes. CSS reads these classes
// to switch theme, font family, and base font size.
export function applySettingsToDOM(settings) {
  const body = document.body;
  if (!body) return;
  // Strip any prior settings classes.
  const classesToRemove = [];
  for (const cls of body.classList) {
    if (
      cls.startsWith("theme-") ||
      cls.startsWith("font-") ||
      cls.startsWith("size-")
    ) {
      classesToRemove.push(cls);
    }
  }
  for (const cls of classesToRemove) body.classList.remove(cls);
  // Apply current settings.
  body.classList.add(`theme-${settings.theme}`);
  body.classList.add(`font-${settings.font}`);
  body.classList.add(`size-${settings.fontSize}`);
}
