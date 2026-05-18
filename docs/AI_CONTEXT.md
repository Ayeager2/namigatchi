# AI Context

**Read this first if you're an AI assistant.** Dense pointer-and-rule reference. Designed for fast onboarding. Most current state lives in `HANDOFF.md` and `systems.md`; this file is the stable spine.

---

## Project (3 lines)

**Namigatchi** — React 19 + Vite browser-only incremental/idle game with cosmic horror flavor.
Long arc: 8 eras (Scavenger → Awakening → Settler → Awakened World → Arcane Industry → Eldritch Reckoning → Ascendant → Cosmic). Currently shipped: Era 0–3.
Solo passion project, Steam-bound eventually. Accessibility-first, moddability-ready, content-as-data.

## Stack

- React 19, Vite, plain JS (no TypeScript)
- State: `useReducer` (`src/state/store.js`)
- Save: `localStorage` key `namigatchi-save` (versioned schema with migration hook)
- Settings: separate `localStorage` key `namigatchi-settings` (theme, fonts, keybinds, volumes, motion, inventory collapse state)
- No backend, no build steps beyond `npm install && npm run dev`

---

## Architectural rules (NEVER violate without explicit user permission)

1. **Content as data.** `src/content/*.js` are pure data objects. No functions inside content. Predicates are flag-based (`requires: { rockAwakened: true }`), not functions.
2. **Thin reducer.** `src/state/reducer.js` dispatches; gameplay logic lives in `src/systems/*.js`. Each system function is pure (state in → new state out + log events).
3. **Persistent vs run state split.** `state.persistent` survives prestige forever (echoes, run history, unlocked music, lifetime stats). `state.run` wipes on prestige/reset. Save format already supports this; respect it for every new piece of state.
4. **Pure scene composition.** UI doesn't decide what to show — `src/systems/scene.js` does. UI just renders the layer list.
5. **Modal pattern for content-heavy UI.** Trees (research, buildings) and rich screens (settings) live in modals triggered from a compact card in the main UI.
6. **Accessibility first.** Reduced motion (`body.motion-reduced` or `prefers-reduced-motion` media query), accessibility fonts (Lexend, Atkinson Hyperlegible), photosensitivity considered for any flashing content.
7. **Hidden alignment.** `run.alignment.good` / `run.alignment.evil` track silently. NEVER display the numbers. Surfaces through consequences (NPC reactions, branching paths, tameable creatures, available choices in events).
8. **Anti-spam from day one.** Gather has a cooldown (1500ms → 250ms with progression). `e.repeat` filtered in keybindings — holding a key doesn't auto-fire. Manual click → faster manual click → automation is the entire incremental progression curve.

---

## File map

```
src/content/        game data (pure objects, no functions in content)
  resources.js        — items + categories + hidden-until display
  buildings.js        — tree position (tier/col/parents) + effects
  research.js         — same shape, separate tree
  threats.js          — encounter chance, effects, flavor variants
  events.js           — interval/gather/any triggers, optional choices
  audio.js            — music + sfx registry, tags drive era unlocks
  survival.js         — config: stats, decay, gather cooldown, sanity-from-threat
  gatherTable.js      — gather weights by phase (preRock/postRockPreAwaken/postAwaken)
  logKinds.js         — kind → category (recent/unlocks)

src/state/
  persistent.js       — defaults that survive prestige
  run.js              — defaults wiped per run
  actions.js          — single ACTIONS map
  reducer.js          — thin switch; delegates to systems
  store.js            — useGameStore hook (load, save, tick interval, action wrapper)
  save.js             — load/migrate/save (versioned)
  saveIO.js           — export/import JSON for user
  settings.js         — separate persistence track for UI prefs

src/systems/         gameplay logic, one file per concern
  gathering.js          — gather + cooldown + threat/event triggers
  building.js           — canBuild/performBuild + bonuses aggregator
  research.js           — canListen/performListen + bonuses
  survival.js           — body+mind stats, decay, action effects
  threats.js            — rollThreatEncounter, defense aggregator
  events.js             — interval + gather rolls, respondToActiveEvent
  audio.js              — playback, crossfade, era-driven sync, autoplay handling
  era.js                — computeEra(state) (derived, never stored)
  scene.js              — composeScene(state) → layer list
  prestige.js           — getPrestigeReward, milestone aggregator
  stats.js              — snapshot, aggregate, compare, formatDuration

src/ui/              React components
  App.jsx               — top-level effects (era watch, music sync, keybinds)
  Shell.jsx             — responsive grid layout
  ActionPanel.jsx       — center column (gather button, cooldown bar, survival)
  InventoryPanel.jsx    — collapsible category groups
  SurvivalBars.jsx      — Body section + Mind section
  StonePanel.jsx        — bottom strip, clickable post-hut → teachings modal
  TeachingsTreeModal.jsx — bottom-up SVG tree
  BuildingsTreeModal.jsx — left-to-right SVG tree
  EventModal.jsx        — choice events
  SettingsModal.jsx     — theme/font/size/motion/audio/keybinds/saves/credits
  SettingsTrigger.jsx   — floating gear bottom-right
  SplashScreen.jsx      — McCarthy-toned opener, 5 lines, skippable
  RightColumn.jsx       — tabs: Recent / Unlocks / Stats
  useSettings.js        — settings hook + apply to DOM
  useKeybindings.js     — global keydown handler with ACTION_HANDLERS map

src/util/
  rng.js              — mulberry32, pickWeighted, randInt, clamp

public/audio/         music + sfx files
tools/                dev wizards (add-audio.js)
docs/                 documentation
```

---

## How to add common things

| Goal | Primary file | Also touch | Notes |
|---|---|---|---|
| New resource | `content/resources.js` | — | `category` controls inventory section; `hiddenUntil` for mystery |
| New building | `content/buildings.js` | — | `tier`+`col`+`parents` for tree; `effect.gatherSpeedup` for cooldown |
| New research node | `content/research.js` | — | same tree fields; whisper text required |
| New threat | `content/threats.js` | — | `encounterChance` per gather; `effects.stealFood` / `damage` |
| New event | `content/events.js` | — | `trigger: interval/gather/any`; `choices` array for modal events |
| New music/SFX | run `npm run add-audio` | — | tool handles file copy + entry; tag `eraN` for auto-unlock |
| New setting | `state/settings.js` SETTINGS_DEFAULTS | `ui/SettingsModal.jsx` | applies via body class or component prop |
| New keybind | `state/settings.js` keybindings | `ui/useKeybindings.js` ACTION_HANDLERS | rebind UI auto-supports new entries |
| New action | `state/actions.js` ACTIONS | reducer case + system fn + `store.js` actions wrapper | follow existing pattern |
| New era | `systems/era.js` computeEra() | content tagged with eraN | era is derived, not stored |
| New log kind | `content/logKinds.js` | — | `category: "recent"` or `"unlocks"` |

---

## State shape (top level)

```js
{
  persistent: {
    schemaVersion: <int>,
    echoes: 0,
    echoUpgrades: {},
    automationUnlocks: {},
    storyMilestones: {},
    lifetimeStats: { ... },
    runHistory: [ ... ],       // capped 50
    unlockedMusic: { trackId: { unlockedAt } },
  },
  run: {
    startedAt: <ms>,
    era: <int>,                 // unused; derived via computeEra()
    inventory: { resourceId: qty },
    gathered: { resourceId: qty },  // never decreases — for stats
    gatherCount: <int>,
    lastGatheredAt: <ms>,       // cooldown driver
    rockFound: bool,
    rockAwakened: bool,
    rockAwakenedAt: <ms>,       // animation gate
    built: { buildingId: { at } },
    researched: { researchId: { at } },
    stats: { hunger, thirst, energy, hp, happiness, sanity },
    events: { cooldowns, lastIntervalMs },
    activeEvent: null | { id, firedAt },
    alignment: { good, evil },  // hidden
    splashSeen: bool,
    log: [ { t, kind, message } ],
  }
}
```

---

## Workflow on session start

1. Read this file (you're done).
2. Read `docs/HANDOFF.md` for current state + immediate next moves.
3. If working on a specific system, skim its entry in `docs/systems.md` (find by header).
4. Glance at the relevant `src/` files.
5. **Ask the user what they want before assuming.** Don't enumerate features — pick a direction together.

## When in doubt

- "How does X work mechanically?" → `docs/systems.md` (find entry, see "Where" pointer)
- "Where is X in the code?" → systems.md "Where" pointer
- "What was decided about Y?" → `docs/roadmap.md`
- "What patterns does code use?" → here (top of file) + `docs/architecture.md` v2 addendum
- "What bugs are known?" → `docs/BUGS.md`
- "What's planned for upcoming eras?" → `docs/ERA_PLAN.md`
- "How do I add audio?" → `tools/README.md`, `npm run add-audio`

## Quick smoke test

```bash
npm install
npm run dev
```
Open `http://localhost:5173`. To test fresh: open dev tools → Application → Local Storage → delete `namigatchi-save` → reload.

---

*This file is the stable spine. Don't bloat it with current-state details — those go in HANDOFF.md or systems.md.*
