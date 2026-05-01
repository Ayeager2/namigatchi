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
  // Motion preference. "auto" respects OS (prefers-reduced-motion).
  // "reduced" forces calm animations regardless of OS.
  // "full" forces full animations regardless of OS.
  // Important for photosensitive epilepsy and vestibular disorders.
  motion: "auto",        // "auto" | "reduced" | "full"
  // Audio (volumes 0..100, muted is a separate boolean for one-click silence).
  masterVolume: 70,
  musicVolume: 50,
  sfxVolume: 80,
  muted: false,
  // Music selection. null = auto (era-based). Otherwise the trackId of an
  // unlocked music track to lock onto, regardless of era.
  pinnedMusicId: null,
  // Keyboard shortcuts. Lowercase single keys. Customizable in settings.
  // null means unbound. Holding a key does NOT auto-fire (e.repeat filtered).
  keybindings: {
    gather: "g",
    rest: "r",
    eat: "e",
    drink: "d",
  },
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
// to switch theme, font family, base font size, and motion preference.
export function applySettingsToDOM(settings) {
  const body = document.body;
  if (!body) return;
  // Strip any prior settings classes.
  const classesToRemove = [];
  for (const cls of body.classList) {
    if (
      cls.startsWith("theme-") ||
      cls.startsWith("font-") ||
      cls.startsWith("size-") ||
      cls.startsWith("motion-")
    ) {
      classesToRemove.push(cls);
    }
  }
  for (const cls of classesToRemove) body.classList.remove(cls);
  // Apply current settings.
  body.classList.add(`theme-${settings.theme}`);
  body.classList.add(`font-${settings.font}`);
  body.classList.add(`size-${settings.fontSize}`);
  // Motion class is only added when user has overridden OS — "auto" uses
  // CSS media query so the OS preference flows through naturally.
  if (settings.motion === "reduced") body.classList.add("motion-reduced");
  if (settings.motion === "full") body.classList.add("motion-full");
}
