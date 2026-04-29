# Namigatchi — Architecture Audit

A read-through of the codebase as of commit `9191057`. The goal isn't to nitpick — it's to give you an honest picture of what you have, what's solid, what's wobbly, and what'll start to bite as the project grows. This is the reference doc for "track 1" before we talk vision in "track 2".

## TL;DR

You've got a working Tamagotchi sim with solid bones and a few rough spots that will get worse if ignored. The reducer pattern is the right backbone, and your minigames system already shows a glimpse of a clean, registry-based "plugin" architecture. The biggest single risk is `useTamagotchi.js` at 1,222 lines — it's already hard to navigate, and it's where almost every new feature will need to land. Splitting it into smaller files is the most valuable architectural move available right now.

Below: a tour of the codebase, what's healthy, what's smelly, and a list of open questions you should think about before adding features.

---

## Project at a glance

- **Stack**: Vite 7, React 19, plain JS (no TypeScript). One dependency: React + ReactDOM.
- **Build/run**: `npm run dev` (Vite dev server), `npm run build`, `npm run lint` (ESLint with React hooks plugin).
- **Persistence**: `localStorage` under key `tama-save-v2`.
- **Total source**: ~2,300 lines across 19 files in `src/`.
- **Largest file**: `src/hooks/useTamagotchi.js` at 1,222 lines (53% of the entire codebase).

There is no test suite, no type system, and no CI. This is fine for a personal project right now, but worth flagging as you think about scale.

---

## File-by-file map

### Entry points

**`src/main.jsx` (10 lines)** — Vanilla Vite/React boot. Renders `<App />` into `#root` inside `<StrictMode>`. Nothing to discuss.

**`src/App.jsx` (10 lines)** — Just a wrapper that renders `<TamaPanel />` with some padding. Effectively a placeholder. If the app grows beyond a single panel (settings page, multi-pet view, achievements page, etc.), this is where routing or a layout shell would go.

### The brain

**`src/hooks/useTamagotchi.js` (1,222 lines)** — This is your engine. It owns:
- `CONFIG` (~140 lines): every tunable knob in the game (tick rate, decay rates, sickness chances, evolution checkpoints, adult-form definitions, etc.).
- `DEFAULTS` (~60 lines): the initial state shape.
- `ACTIONS` enum: ~20 named action types (FEED, WATER, PLAY, GO_WORK, PLAY_MINIGAME, etc.).
- Helper functions: `clamp`, `mulberry32`, `withFx`, `diffFx`, `addLog`, `computeStage`, `computeNeedSeverity`, `computeMood`, `finalizeAdultForm`, `clearAnyCall`, `resolveNeedCall`, `canWork`, `getWorkProfile`.
- `reducer` (~657 lines): one giant `switch` covering every action.
- `useTamagotchi` hook (~110 lines): wires up `useReducer`, `useEffect`s for load/save/tick, derived `useMemo`s for `mood` and `severity`, and exposes the public `actions` object.

Roughly 80% of the gameplay logic in the entire codebase lives here.

**`src/hooks/useFloatingText.js` (37 lines)** — Self-contained hook for the +X stat popups. Manages a list of float entries with timers that auto-remove them. Cleanly isolated.

### UI components

**`src/components/TamaPanel.jsx` (306 lines)** — The screen. Renders the pet, stats bars, action buttons, log, and conditionally swaps in either the shop or the minigame panel. Eight distinct action buttons are inlined as JSX. Most styling is via inline `style={{}}` props rather than a CSS file (inconsistent with the other components).

**`src/components/PetSprite.jsx` (50 lines)** — Maps the current visual-state enum to an emoji and a CSS class. Trivial component — but the abstraction is good; the rest of the app talks to "visual state", not raw flags like `sleeping || sick || tantrum`.

**`src/components/ShopPanel.jsx` (223 lines)** — Two-tab UI (Store + Inventory). Reads items from the items module, shows cost, effects chips, cooldowns, and disables buttons appropriately. Has a defensive `getAllItemsSafe()` shim that supports three different export shapes from the items module — overkill, since only one shape is actually used.

**`src/components/TamaMinigamePanel.jsx` (244 lines)** — Lists registered minigames in a left rail and renders the active game's controls on the right. **Hardcodes a separate JSX block for each game ID** (`coin_flip`, `lucky_dice`, `high_low`, `treasure_chest`). This is the single biggest leak in the otherwise clean minigame architecture.

**`src/components/FloatingTextLayer.jsx` (21 lines)** — Just renders the floating text divs. Tiny presentational component.

### Domain modules (`src/tama/`)

**`src/tama/items.js` (79 lines)** — Hardcoded array of 5 items (Cookie, Rice Bowl, Ball, Vitamins, Soap). Each has id, name, type, cost, cooldown, and an `effects` object. Exports `ITEMS` and `getItemById(id)`.

**`src/tama/visualState.js` (68 lines)** — Pure functions that map `(state, mood) → VISUAL.X` (an enum) and `VISUAL.X → CSS class`. Priority-ordered: dead beats sleeping beats tantrum beats sick beats poop beats stinky beats mood. Clean.

**`src/tama/rules.js` (13 lines)** — A single function `isTierAllowedForStage(tier, stage)` gating which minigame tiers each life stage can play. Currently **not actually called anywhere in the codebase** — minigames check tiers themselves via `canPlay`. So this is essentially orphaned utility code right now.

**`src/tama/minigames/index.js` (19 lines)** — Registry: imports each minigame module, exposes `MINIGAMES` map and `getMinigame(id)` / `getAllMinigames()`. This is the registry pattern done well.

**`src/tama/minigames/{coinflip,luckyDice,highLow,treasureChest}.js`** — Each file ~50–90 lines. Each minigame is a self-contained module conforming to a shape: `{ id, name, tier, description, costCoins, canPlay(state), play(data, ctx) → result }`. Adding a new minigame is "create the file, register in index.js." Almost.

**`src/tama/minigames/minigames.js` (64 lines)** — **Dead code**. An older single-file version superseded by the folder structure above. Defines its own `coin_flip` and exports `getAllMinigames` / `getMinigame` — neither is imported anywhere. Should be deleted.

---

## What's working well

A fair amount, actually. Worth being explicit about so we don't accidentally regress these in a refactor.

**Reducer pattern.** Every state mutation goes through one place. State is updated immutably via spreads. This is what makes time-travel debugging possible (if you ever want it), makes `localStorage` save-on-state-change trivial, and gives you a single audit trail for "what can change game state and how." Don't lose this.

**The minigame registry.** Each minigame is a module with a known shape, registered in one place, consumed by id. This is the right pattern and it's the model that should be applied to other content (items, evolution forms, achievements). The pattern is *almost* fully realized — see "Pain points" for the leak.

**Visual state separation.** `getVisualState` is a pure function with a clear priority order. UI components don't have to know that "if sick AND injured AND has poops, show poop." That logic is in one place.

**The CONFIG block.** Almost every tuning knob in the game lives in one place at the top of `useTamagotchi.js`. When you want to make hunger drain faster, you change one number. This is excellent — and underrated. A lot of game projects scatter magic numbers across the codebase and end up unable to balance anything.

**The FX diffing system.** `diffFx(before, after)` auto-generates floating text for any state change without each action having to manually emit "+5 FUN" text. This is a really nice piece of engineering. New actions get popups for free.

**Stable per-game stats.** `state.minigameStats` is keyed by game id, so adding a new minigame doesn't break old saves and new minigames inherit the same stats system (plays, wins, streak, bestStreak).

**Save versioning.** The storage key is `tama-save-v2`, suggesting you've already had to bump it once. Good instinct. We can formalize this when we discuss save migrations.

**Auto-catch-up on tab return.** The TICK handler reads how many ticks have passed since `lastTickAt` and simulates them in a loop (capped at `MAX_CATCHUP_TICKS`). So leaving the tab open overnight doesn't mean the pet is frozen — it ages in batches. Nice touch.

---

## Pain points

In rough order of "how much this will hurt as you add features."

### 1. `useTamagotchi.js` is doing too much

At 1,222 lines, this file holds your config, your state shape, your action types, your helper functions, the reducer with every action handler, the tick simulation, and the public hook. The reducer alone is 657 lines.

This is the single biggest thing holding back scalability. When you add a new feature (say, a "treats" system, or a friendship system, or a battle system), you'll be editing this file. Multiple features in flight = merge headaches. Bugs become harder to isolate because everything is reachable from one switch.

A natural split would be roughly:

- `tama/config.js` — the CONFIG object alone.
- `tama/defaults.js` — DEFAULTS and the initial state shape.
- `tama/actions.js` — the ACTIONS enum.
- `tama/util/fx.js` — `withFx`, `diffFx`, `addLog`.
- `tama/util/rng.js` — `mulberry32`, `r01`, `clamp` (single source).
- `tama/systems/needs.js` — needs decay, severity, mood.
- `tama/systems/poop.js` — poop generation/clearing.
- `tama/systems/sickness.js` — sickness onset/cure.
- `tama/systems/injury.js` — injury onset/heal.
- `tama/systems/attention.js` — calls, neglect, tantrums, mischief.
- `tama/systems/work.js` — work timer and rewards.
- `tama/systems/evolution.js` — stage transitions and adult forms.
- `tama/reducer.js` — small switch that delegates to each system's handler.
- `hooks/useTamagotchi.js` — just the hook (load, save, tick loop, derived state, action wiring).

You don't need to do all of this at once. The first split — pulling the TICK handler's body out into `simulateTick(state)` in its own file — would already be a huge win because TICK is the most complex case (~210 lines on its own).

### 2. The minigame UI hardcodes every game ID

`TamaMinigamePanel.jsx` has separate JSX blocks like `{active.id === "coin_flip" && (...)}` for each game. Adding a new minigame means editing this panel. That defeats the registry pattern: the data is pluggable, but the UI isn't.

The fix is for each minigame module to expose its own UI shape (e.g., `controls: [{ label: "Heads", input: { guess: "heads" } }, { label: "Tails", input: { guess: "tails" } }]`). The panel then iterates over `active.controls` and renders generic buttons. New game = new module, no panel edits.

This is a small refactor but it's the keystone for "I want to add 20 minigames" working without pain.

### 3. Items, evolution, and adult forms live in code, not data

`items.js` is JS code with a hand-written array. `CONFIG.EVOLUTION` and `CONFIG.ADULT_FORMS` are JS arrays inside a config object. This is fine for the current scale (5 items, 5 stages, 4 adult forms) but doesn't scale to "I want hundreds of items" or "I want branching evolution trees."

The decision point isn't urgent, but it's worth thinking about: do you want to commit to a content pipeline (JSON files in a folder, loaded at startup) so you can add content without touching code? Or are you fine editing JS forever? Each has trade-offs. We'll discuss in track 2.

Adult forms are particularly awkward because each form's `req` is a function (predicate), so they can't trivially be JSON. A common pattern is to express the predicate as data (`{ minAffection: 70, maxNeglect: 25, minDiscipline: 40 }`) and have a single evaluator function read it.

### 4. `mulberry32` is duplicated in five files

`useTamagotchi.js`, `coinflip.js`, `luckyDice.js`, `highLow.js`, `treasureChest.js` each have their own copy. Identical bytes. Should be one util file (`tama/util/rng.js`) imported by all.

### 5. Two parallel minigame paths in the reducer

`ACTIONS.MINI_GAME_RESULT` is the older path (used by `playMiniGameGuess`, exposed as `actions.miniGameGuess`). `ACTIONS.PLAY_MINIGAME` is the current path (used by all four registered minigames). The old path isn't called from the UI anywhere, but it's still wired up. Dead code in a critical file.

### 6. `tama/rules.js` is orphaned

`isTierAllowedForStage` exists but nothing imports it. Each minigame's `canPlay` reimplements its own rules. Either delete `rules.js` or actually use it as the single source of "what can play what."

### 7. `tama/minigames/minigames.js` is dead

Not imported anywhere. Stale older version of the minigame system. Delete.

### 8. `TamaPanel.jsx` inlines ~120 lines of buttons

Each button has the same shape: `<button className="..." onClick={...} disabled={...}>Label</button>`. This could be a single config array iterated into a button row. Not urgent, but it's a small refactor that pays back every time you add or rename an action.

### 9. Inline styles vs CSS files (inconsistency)

`TamaPanel.jsx` uses inline `style={{}}` props heavily. `ShopPanel.jsx` and `TamaMinigamePanel.jsx` use CSS files. `PetSprite.jsx` mixes both. There's no enforced convention. Pick one and apply consistently.

### 10. `actions` rebuilds every render

`useTamagotchi.js` line 1219: `const actions = useMemo(() => {...}, [state.alive, state.sleeping, state.paused, state]);` — including `state` in the dep array means the memo invalidates on every state change, which is every tick. So `actions` is a new object reference every render, and any component using `useEffect(..., [actions])` would re-run constantly. Currently no consumer does, so it's a latent bug, not an active one. But worth fixing — most of the action functions are pure dispatchers and don't need `state` in their closure.

### 11. Save migration is fragile

`LOAD` does `{ ...DEFAULTS, ...action.payload }` — this handles "added a new field" gracefully (default fills in), but it doesn't handle "removed a field," "renamed a field," or "changed a field's type." Right now you've punted by bumping the storage key (`tama-save-v2`), which throws away old saves. That works for early development; less great if real users start playing.

When we discuss roadmap, "do I care about save compatibility?" is one of the load-bearing questions.

### 12. The activity log lives in saved state

Every tick that adds a log line creates a new state with a new log array. The log is capped at 30 entries (`slice(0, 30)`), so it doesn't grow unboundedly, but it does mean the saved JSON includes 30 log entries that get rewritten frequently. Cosmetic concern only — but if this becomes a problem (perf, save size), the log can be moved to a non-persisted ref or a separate state slice.

### 13. No types

Pure JS. State has ~30 fields, items have an `effects` shape, minigames have a result shape, FX entries have a shape. Nothing enforces these. As the state grows, the cost of typo bugs grows. JSDoc on the major shapes is a low-effort halfway step. TypeScript is a bigger commitment but would pay back over years.

### 14. No tests

For a single-developer hobby project this is fine. But the reducer is pure (state in → state out), which means it's *unusually* easy to test. A few tests around things like "feeding reduces hunger" or "if neglect goes high, tantrum starts" would catch a lot of regressions when refactoring.

---

## Coupling map

Who depends on whom (arrows mean "imports"):

```
main.jsx
  └── App.jsx
        └── TamaPanel.jsx
              ├── useTamagotchi (hook)
              │     ├── tama/items
              │     └── tama/minigames (registry)
              │           └── tama/minigames/{coinflip,luckyDice,highLow,treasureChest}
              ├── PetSprite
              │     └── tama/visualState
              ├── ShopPanel
              │     └── tama/items
              ├── useFloatingText (hook)
              ├── FloatingTextLayer
              └── TamaMinigamePanel
                    └── tama/minigames (registry)
```

Things to notice:

- The dependency graph is shallow and acyclic — no circular imports, no spaghetti.
- `tama/items` is imported in two places (`useTamagotchi` and `ShopPanel`) — that's correct, items are content used by both logic and UI.
- `tama/minigames` (registry) is the public surface for minigames — also used in two places, also correct.
- `tama/rules.js` is in the tree but nobody depends on it.
- Individual minigame modules are only depended on by the registry index — perfect encapsulation.

The shape is actually quite clean. The problem isn't *between* files; it's the size of the largest one.

---

## Scalability assessment

### What this codebase handles fine today

- Five evolution stages, four adult forms, five items, four minigames.
- One pet, one player, browser-only, no backend.
- Adding a new item: edit `items.js`, add an entry. ✓
- Adding a new minigame: create a module, register it, edit the panel UI. △ (panel edit is the friction)
- Tweaking game balance: edit `CONFIG`. ✓
- Adding a new state field: edit `DEFAULTS`, handle it in relevant reducer cases. ✓

### What it'll start to struggle with

- **Many minigames (20+).** Until the panel hardcoding is fixed.
- **Branching/conditional evolution.** Currently a flat list of stages by age; can't express "only evolves into HeroBean if affection > 70 AND age > X" — wait, it can do that for adult forms but not for intermediate stages.
- **Multiple pet species.** Right now the pet is implicit; everything is one global blob. Adding species means a `species` field, species-specific stat decay rates, species-specific evolution trees, species-specific items maybe. Possible, but not free.
- **Achievements.** Would need a separate system that observes state changes — could plug in alongside the FX diff system.
- **A storyline / quests / NPCs.** Would need a content system distinct from items and minigames.
- **Multiplayer or cloud save.** Would require pulling state management out of `localStorage` and probably normalizing the schema.
- **Mobile (PWA or native).** UI is desktop-shaped; mobile would need a layout pass. State logic is portable.
- **Modding / user content.** Would require committing to data-driven content (JSON) and a clear plugin contract.

None of these are blocked. Most are 1–2 day refactors at the current scale. They become 1–2 week refactors at 5x the scale.

---

## Top 5 most valuable refactors (if we did nothing else)

In order of bang-for-buck:

1. **Split `useTamagotchi.js`.** Extract systems into separate files. The reducer becomes a thin dispatcher that calls system functions. This single change makes every other future change cheaper.

2. **Make minigame UI data-driven.** Each minigame declares its controls; the panel renders them generically. New minigames = no panel edits.

3. **Consolidate `mulberry32` and `clamp` into one util file.** Trivial change, removes 5 duplicates.

4. **Delete dead code** (`tama/minigames/minigames.js`, `ACTIONS.MINI_GAME_RESULT`, `actions.miniGameGuess`, possibly `tama/rules.js`). Clean slate before any refactor.

5. **Add JSDoc typedefs for the major shapes** — `State`, `Item`, `Minigame`, `MinigameResult`. Costs ~30 minutes; gives editor autocomplete and catches typos.

---

## Open questions for track 2

These are the conversations to have before we make architectural decisions. Don't answer them now — just read them and let them simmer.

**On scope and ambition.** What's the biggest version of this game you can imagine? Single-pet web toy, or something that grows for years? Is it primarily for you, for friends, or potentially a published thing? Do you want users beyond yourself ever?

**On platforms.** Web only (current)? Mobile-friendly web (PWA)? Native iOS/Android someday? If mobile is in your future, that changes some UI decisions now.

**On content.** Do you imagine 5 items or 50 or 500? 4 minigames or 20? One pet species or many? Linear evolution or branching? This is what determines whether content should stay in code or move to data files.

**On modding.** Should other people eventually be able to add minigames, items, or pets without forking the repo? If yes, that pushes hard toward data-driven content and a documented "module shape."

**On multiplayer.** Single-pet local-only is fine forever — many great games are. But if you ever want trade, visit, battle, or even just "see your friend's pet on a leaderboard," the architecture changes (server, normalized data, auth).

**On save compatibility.** Are saves precious (real players will lose progress on a schema break) or disposable (you're the only player and you can always start over)? Your answer changes how much migration ceremony is worth building.

**On art.** Currently emoji. Acceptable forever, or do you want a sprite/animation pipeline at some point? Sprite-based art has real implications for component design.

**On audio.** Currently silent. Sound effects? Music? Each adds a system.

**On meta-progression.** Does dying matter? Should there be unlocks across pet generations? Achievements? A "pet graveyard"? This shapes what the save file even represents.

**On randomness.** Do you want gameplay to be random (current — Math.random in many places) or seeded/replayable? Seeded RNG would let you support things like "share this run with a friend."

**On time.** Is this a real-time pet (current — ages while you're away) or a "playable in 5-minute sessions" pet? They lead to different balance.

**On who you're designing for.** What kind of player do you imagine — a casual person who checks in once an hour for fun, or someone who wants depth (stats, optimization, achievement-hunting)? This affects how punishing the sim should be and how dense the systems should be.

When you're ready, let's pick a few of these and start filling in `roadmap.md`.

---

*Audit current as of commit 9191057, April 29 2026.*
