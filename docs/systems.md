# Namigatchi — Systems Checklist

A living tracker of every gameplay system in the project. Each entry has:

- **State** — what's actually built right now
- **What it does** — the mechanic in one or two sentences
- **Where it lives** — which files own it
- **Next steps** — small additions to consider in upcoming iterations
- **Long arc** — where it eventually ends up across the whole game

Update this file whenever a system gets built or evolved. Re-read it before
starting an iteration so we don't lose context after time away.

> *Status legend:* 🟢 shipped · 🟡 partial · ⬜ planned · 🔮 future-vision

---

## Core architecture (foundational)

### 🟢 State management — persistent vs run split
**State.** Two top-level slices: `persistent` (survives prestige forever — Echoes, lifetime stats, run history, alignment history-someday) and `run` (wipes on reset/prestige — current resources, stats, buildings built, research learned, log). Save format is versioned with a migration hook in `save.js`.

**Where.** `src/state/persistent.js`, `src/state/run.js`, `src/state/save.js`, `src/state/reducer.js`, `src/state/store.js`.

**Long arc.** Multiple prestige layers later (Echoes → Vestiges → Eternities). Each is a new section of persistent state. The split is immutable architecture from day one.

---

### 🟢 Reducer + systems pattern
**State.** Reducer is intentionally thin. Each action delegates to a system function in `src/systems/` that does the actual work and returns new state slices + log events. Reducer is a dispatcher.

**Where.** `src/state/reducer.js`, all of `src/systems/*`.

**Why.** Keeps reducer scannable, makes systems unit-testable, enforces that all gameplay logic is in one identifiable place per system.

---

### 🟢 Content as data
**State.** Resources, gather tables, research nodes, buildings, threats, events, log kinds, survival rates, building categories — all live as plain data files in `src/content/`. Systems read these. Adding new content means new entries, no system code changes.

**Where.** `src/content/*.js`.

**Long arc.** Every era's content is more entries in these files. Eventually consider migrating to JSON for moddability, but not until needed.

---

### 🟢 Pure scene composition
**State.** `composeScene(state)` returns layers. UI renders. As the world transforms (hut, fire pit, awakened rock, future structures), new layers conditionally appear.

**Where.** `src/systems/scene.js`, `src/ui/Scene.jsx`.

**Long arc.** Layers swap from text placeholders → SVG art → final art without code changes. Each era adds visual layers (radiation receding, sprouts, demons in the distance, etc.).

---

## Era 0 — Scavenger

### 🟢 Gathering loop
**State.** Click Gather (or press G), roll a weighted table for a random resource (wood/stone/water; fragments after rock found; food after Foraging research). Water is rare (8% of rolls). Quantities scale with progress: pre-rock 1 per drop, post-rock-pre-awaken 1–2, post-awakening 1–3, plus +1 per gather-bonus source (hut, fire pit, knapping, tracking).

**Where.** `src/systems/gathering.js`, `src/content/gatherTable.js`, `src/content/resources.js`.

**Next steps.** Per-zone gather tables when zones exist (different drops at the cave vs. the forest). Not needed yet.

---

### 🟢 Gather cooldown — the manual→automation curve
**State.** Each gather has a cooldown. Base 1500ms, floored at 250ms. Reductions stack from buildings and research:
- Hut: –150ms
- Fire Pit: –100ms
- Knapping: –250ms
- Tracking: –100ms

With everything Era 1 has to offer: 900ms (about 40% faster than base). Holding the gather key does NOT bypass the cooldown — `e.repeat` is filtered, anti-spam from day one. Cooldown rejections are silent (no log spam from key-mashing).

**UI.** The Gather button shows a live fill bar that animates across the bottom edge during cooldown. Button disabled until the bar fills. CPU-cheap — the React re-render interval only runs while a cooldown is active.

**Where.** `src/content/survival.js` (gather config), `src/systems/gathering.js` (`getGatherCooldownMs`, `canGatherFull`), `src/ui/ActionPanel.jsx` (UI).

**Long arc.** The whole incremental progression curve hangs off this. Era 2 tools (Stone Axe, Bone Knife) will add more reductions. Era 3 research could grant `gatherSpeedup` of 500ms+ per node. Era 4+ unlocks "Auto-Gather" — a passive trickle that gathers without clicks while you focus on higher-tier decisions. By late game, most early-tier resources are passive.

---

### 🟢 Keyboard shortcuts
**State.** Global keyboard shortcuts for the four most-used actions. Defaults: G (gather), R (rest), E (eat), D (drink). Customizable in Settings → Keyboard shortcuts. Click a key, press a new one to rebind. Esc cancels rebind, Backspace clears the binding.

**Anti-spam.** Holding a key does NOT auto-fire — `e.repeat` is filtered in the global handler. Combined with the gather cooldown, players can't mash their way past the wasteland's harshness.

**Conflict detection.** Trying to bind a key that's already bound to another action shows a conflict warning and refuses the bind. Player must clear the existing binding first.

**Suppression.** Shortcuts won't fire when typing in inputs/textareas (so settings inputs aren't hijacked). Disabled entirely while the splash is showing.

**Where.** `src/ui/useKeybindings.js` (global handler), `src/state/settings.js` (`keybindings` field), `src/ui/SettingsModal.jsx` (rebind UI), `src/App.jsx` (hook usage).

**Long arc.** More actions to bind as the game grows: open buildings/teachings/settings modals, prestige action, etc. The hook's action-handler map is one place to extend — add a new entry, surface a row in the settings UI.

---

### 🟢 Rock awakening
**State.** Random chance to find the rock during gather. Once found, fragments drop. 10 fragments → rock awakens. Whisper to build a hut fires.

**Where.** `src/systems/gathering.js`, `src/systems/rock.js`, `src/content/gatherTable.js`.

**Long arc.** Rock will gain XP from every action (slow trickle), evolve form along alignment axis (light/dark/balanced), eventually become the prestige currency vessel.

---

### 🟢 Splash screen
**State.** Five McCarthy-style lines fade in/out on each fresh run. Skippable. Plays on every prestige (each new awakening).

**Where.** `src/ui/SplashScreen.jsx`.

**Next steps.** Pick a final font (user direction: rugged, jagged, hurts to read).

---

## Era 1 — Awakening

### 🟢 Storage / inventory caps / spoilage
**State.** Each resource declares an optional `baseCap` in content/resources.js (omit = uncapped, e.g. fragments). Buildings declare `storageCaps: { resourceId: capIncrease }`. Effective cap = baseCap + sum of storage from owned buildings. `getResourceCap(state, resourceId)` reads it. `clampToCap(inventory, state, prevInventory)` enforces caps on additions while preserving existing oversupply (old saves keep what they had). Caps clamp on every gather/hunt and pace passive production (Garden/Well stop adding past cap).

**Spoilage.** Food resources declare `spoilage: { perMinute, atCapMultiplier }`. `processSpoilage(state)` runs in TICK after passive production, decays food by elapsed real time. Past-cap stockpiles spoil at the multiplier rate (grubs: 0.2/min normally, 0.8/min at cap; bird meat: 0.4/min normally, 2.0/min at cap). Catch-up capped at 30 minutes for offline absences. Fractional spoilage carried in `run.spoilAccum`.

**UI.** Inventory panel shows `12/30` for capped resources (just `12` for uncapped). Color shifts to warn at ≥80% of cap and danger when at cap. Spoilage events log to Recent: "🦠 1 grub spoiled."

**Cairn (storage building).** Tier-4 building, parent: hut. Requires hiddenStores research (already exists). Cost wood:30, stone:50. Storage caps: +50 wood, +50 stone, +20 water, +15 grubs, +10 bird meat, +20 feathers. The first cap-raise path Era 1 offers.

**Where.** `src/content/resources.js` (baseCap + spoilage data), `src/content/buildings.js` (Cairn + storageCaps), `src/systems/storage.js` (getResourceCap, clampToCap, processSpoilage, getCapStatus), `src/state/run.js` (lastSpoilTickAt, spoilAccum), `src/state/reducer.js` (TICK calls processSpoilage), `src/systems/gathering.js` + `hunting.js` + `passive.js` (clamp on add), `src/ui/InventoryPanel.jsx` (cap display).

**Long arc.** Era 2 introduces a Granary (food-only cap raise) and Cellars (preservation = lower spoilage). Era 3 magic preservation. The cap+spoilage shape is the foundation for late-game economy decisions ("do I build more storage or more producers?").

---

### 🟢 Buildings
**State.** Tree-based modal with left-to-right SVG layout. Currently 5 buildings (Hut, Fire Pit, Well, Garden, Cairn). Hut requires rock awakening. Fire Pit requires Fire research. Well requires Water Carrying research; Garden requires Foraging. Well & Garden produce resources passively (see Idle / passive generation entry). Buildings have categories (shelter, comfort, tools, industry, arcane, sovereignty, cosmos) for future grouping. Each provides effects (gather bonus, rest bonus, passive output, etc.).

**Where.** `src/systems/building.js`, `src/content/buildings.js`, `src/ui/BuildingsTreeModal.jsx`, `src/ui/BuildingsPanel.jsx` (trigger).

**Next steps.** Add 3–5 more Era 1 / Era 2 buildings (Well, Garden, Forge, Tool Shed, Granary). Each entry just goes in `buildings.js` with tier/col/parents.

**Long arc.** Many tiers of buildings. Walls/defensive structures will add to defense. Magical buildings in Era 3+. Companions (NPCs) may require specific structures (a barracks, a hearth, etc.).

---

### 🟢 Teachings (research)
**State.** Bottom-up SVG tree modal. The rock whispers; player offers resources to listen. Currently 8 teachings: Foraging, Fire, Knapping (tier 1); Vigilance, Hidden Stores, Mending (tier 2); Cooking, Tracking (tier 3 — refinements that build on tier 2). Resets on prestige.

**Where.** `src/systems/research.js`, `src/content/research.js`, `src/ui/TeachingsTreeModal.jsx`.

**Next steps.** Add tier 2/3 nodes that branch from existing tier 1: Tracking, Cooking (parent: Fire), Trapping (parent: Vigilance), Tool-Making (parent: Knapping), etc.

**Long arc.** Each era unlocks a new "discipline" of teachings. Tier 3 = Arcana (magic). Tier 4 = Industry. Tier 5 = Forbidden (eldritch). Tier 6 = Sovereignty. Tier 7 = Cosmos. The tree fills out over the entire game.

---

### 🟢 Survival (Body stats)
**State.** Activates when hut is built. Four physical stats: Hunger (0–100, high=bad), Thirst (high=bad), Energy (low=bad), HP (low=bad). Decay per action; eat/drink/rest restore. Yield penalties at thresholds. Cannot gather when energy=0.

**Where.** `src/systems/survival.js`, `src/content/survival.js`, `src/ui/SurvivalBars.jsx`, `src/ui/ActionPanel.jsx`.

**Hard-core opening.** Stats start in rough shape (HP 40, Hunger 60, Thirst 60, Energy 50). Player has to climb out, not maintain.

**Next steps.** Wells and gardens (passive water/food trickle — needs idle systems). Stamina-cost reduction items. More food types (berries, meat — see Resources / Food).

---

### 🟢 Mind stats (Resolve, Sanity)
**State.** Two mental stats. Resolve = daily wellbeing, drains from physical needs in red, rises from comfort + progression. Sanity = mental stability, ONLY affected by horror events (threats, damage, future eldritch). Both start LOW on a fresh run (Resolve 15, Sanity 25 — you woke up in hell).

**Where.** `src/systems/survival.js` (yes, same module — mental stats coexist with body stats), `src/ui/SurvivalBars.jsx` (Mind section).

**Naming note.** Data field is `happiness`. UI label is "Resolve." "Spirit" is reserved for a future magic-system stat in Era 3+.

**Long arc.** Sanity penalties scale up massively in Era 3+ (cosmic horror). Low-sanity events (hallucinations, weirder log entries) become atmospheric mechanics.

---

### 🟢 Threats
**State.** Random encounters during gather (~7% chance). Currently 1 threat: Scavenger — steals 1–3 food, occasionally does 0–2 chip damage. Defense (from research) reduces both. Hidden Stores research reduces theft further.

**Where.** `src/systems/threats.js`, `src/content/threats.js`.

**Next steps.** Add 2–3 more threat types: Wraith (does sanity damage, no food theft), Beast (more damage, less common), Scavenger Pack (rare, big food theft). Era 2+ threats: bandits (organized), demons (sanity-heavy). Era 3+: eldritch (sanity wipe).

**Long arc.** Threats become COMBAT in later eras — player can fight back, not just defend. Tame creatures (the rock's evolution into companion-monster) help defend. Buildings provide passive defense (walls, watchtowers).

---

### 🟢 Random events
**State.** Two trigger paths: real-time interval (every ~60s of play, mostly nothing happens) and gather-triggered (4% chance per gather). Fire-and-react events apply effects directly. Choice events open a modal with options. Severity scales with era. Cooldowns prevent repeats. Currently 7 events: 5 fire-and-react (Wind from East, Cracked Earth, Hidden Spring, Strange Lights, Blood Moon) + 2 choice events (Wandering Child, Hurt Elder).

**Pests** — events can set a temporary pest via `effects.setsPest: { pestId, durationMs }`. The pest lives in `run.activePests` and modulates other systems (gather, passive production) until its `until` timestamp passes. The TICK handler clears expired pests automatically. First example: **Carrion Flock** — fires only when a Garden exists, halves Garden output and grub gather rate for 5 minutes; each successful Hunt has a chance to disperse the flock (highest with bird drops). Pest indicator surfaces in the Action panel with remaining time.

**Where.** `src/systems/events.js`, `src/content/events.js`, `src/ui/EventModal.jsx`, `src/ui/PestIndicator.jsx`, `src/systems/passive.js` (pest modulators + expiry).

**Next steps.** Era 2+ events with bigger stakes. NPC encounter events that lead to companions (deferred — see Companions). Negative events that damage buildings (require maintenance later).

**Long arc.** Events become the primary engine of late-game variety. Era 5 events tear holes in reality. Era 7 events involve cosmic-scale decisions.

---

### 🟢 Hidden alignment
**State.** Choice events accumulate `alignment.good` and `alignment.evil` in run state. Never displayed. Surfaces through consequences (deferred — events haven't yet branched on alignment).

**Where.** `src/state/run.js` (`alignment`), `src/systems/events.js`.

**Next steps.** Some future events should require/branch on alignment ("only available if good ≥ 5", "only the cruel see this option"). Eventually the rock's evolved form is determined by alignment.

**Long arc.** Endgame paths (Era 6/7) diverge by alignment. Companions react to alignment. Some buildings/research unavailable to wrong alignment.

---

### 🟢 Skills (learning by doing)
**State.** Per-skill XP and level, run-local. Wipes on prestige. Each meaningful action grants XP to the matching skill — no points to spend, no UI to navigate. Skills surface as a tab in the right column once any XP is earned.

**Active skills (Era 1):** Foraging (every gather), Hunting (every hunt), Crafting (every tool crafted), Building (every building). Stub data for future skills (Pottery, Mining, Smithing, Tracking) lives in the same content file with `active: false` so Era 2 wires them up by flipping a flag and adding XP triggers.

**Bonuses are declarative.** Each skill defines `bonuses: [{ stat, perLevel, max }]`. Systems aggregate via `getBonus(state, statName)`. Foraging adds a tiny per-level gather yield + speed reduction. Hunting reduces hunt cooldown (300ms/level), boosts hunt yield, and shifts drop weights toward birds. Crafting adds a per-level chance to refund a single material per tool. Building reduces the survival cost of building actions.

**XP curve.** Standard exponential — Level 1: 5 XP. Level 5: ~80. Level 10: ~580. Tunable in `content/skills.js` (`STANDARD_CURVE`).

**First-unlock messaging.** Crossing 0→1 in any skill emits a flavor log entry (`skill_unlock`, lands in Unlocks tab). Subsequent level-ups are quieter (`skill_levelup`, Recent tab).

**Where.** `src/content/skills.js`, `src/systems/skills.js`, `src/state/run.js` (`skills` slice), `src/ui/SkillsPanel.jsx`, `src/ui/RightColumn.jsx` (tab integration).

**Long arc.** Era 2 activates Pottery/Mining/Smithing by adding XP triggers. Echo upgrades (post-prestige) likely grant "start with +N levels in skill X" perks — that's the persistent layer's job. Higher max levels per skill as content arrives. Skill thresholds gate higher-tier tools/research (Snare already requires Hunting lvl 2).

---

### 🟢 Crafting (primitive tools)
**State.** Research → recipe known → resources spent → tool added to inventory under `category: "tool"`. Tools' declarative effects apply automatically while owned. The Forge (Era 2) is NOT required for primitives; these are hand-made.

**Era 1 tools:** Net (12 hunts, unlocks Hunt action), Snare (20 hunts, better hunt yield + cooldown reduction; gated behind Trapping research + Hunting lvl 2), Digging Stick (25 gathers, –100ms gather + extra water), Water Skin (30 water gathers, extra water on water gathers).

**Durability.** Each tool declares `durability: { max, wearsOn }` in content. `wearsOn` is one of `"hunt" | "gather" | "waterGather"` — that's the action that ticks durability down by 1. When durability hits 0, the tool is removed from inventory and a flavored breakage message logs ("The net comes apart in your hands…"). The system function `applyToolWear(run, actionTag)` runs at the end of `performGather` (twice when the drop was water — generic gather wear plus water-specific wear) and `performHunt`. Old saves without `toolDurability` gracefully default each tool to `max - 1` on first wear.

**Each craft action** consumes resources, grants Crafting XP (scales with tool tier), drains survival stats (perCraft decay sits between Build and Research in severity), and gives a small Resolve/Sanity boost (the "I made something" beat). Higher Crafting skill grants a per-resource refund chance — gentle but felt by ~level 5.

**UI.** Tool detail in the Crafts modal renders a durability bar with remaining-uses count. Bar shifts gold → orange (warn) → red (danger) as it depletes. Re-crafting is blocked while a tool is owned, so the natural rhythm is craft → use until broken → re-craft.

**Where.** `src/content/tools.js`, `src/systems/crafting.js` (`performCraft` + `applyToolWear`), `src/state/run.js` (`toolDurability` slice), `src/state/reducer.js` (CRAFT_TOOL action), `src/ui/ToolsModal.jsx` (DurabilityBar component), `src/ui/CraftsPanel.jsx` (left-column trigger card).

**Long arc.** Era 2 introduces Forge-required tools (Stone Axe, Bone Knife, Stone Pickaxe) with much higher durability. Repair-at-Forge mechanic arrives the same era — visit Forge, spend a fraction of the recipe cost to restore N durability. Era 3+ arcane tools have unconventional durability rules (a Fragment Knife's wear might tie to sanity instead of uses). Wear rates may eventually scale with skill — high Crafting/Hunting making your tools last longer.

---

### 🟢 Hunting
**State.** Separate action with its own long cooldown (8000ms base, floored at 2500ms). Gated behind owning a Net or Snare in inventory. Drains energy (-10) and thirst (+3) per attempt; successful bird drops add another +2 thirst spike. Yield table is weighted heavily toward "nothing" and grubs at level 0; bird meat and feathers climb in frequency as Hunting skill levels up. The Hunt button shows a live cooldown bar like Gather. Bindable to a key (default H).

**The first hunts are mostly failures.** This is intentional — narrative framing as "you don't know what you're doing yet, the birds are quick, the wasteland isn't kind." Log messages call out that you ARE hunting birds even when you scared up grubs instead.

**Drop tags drive skill scaling.** Each row in `content/huntTable.js` has a `tag` (`bird | grub | graze | nothing`). Skills modify weights by tag. New drop types slot in by adding rows + tags; no system code changes.

**Where.** `src/content/huntTable.js` (drop table + cooldown config), `src/systems/hunting.js` (logic), `src/state/reducer.js` (HUNT action), `src/state/run.js` (`lastHuntAt`), `src/ui/ActionPanel.jsx` (Hunt button).

**Long arc.** Era 2 introduces ranged hunting via Fletching research → arrows (consume feathers). Era 2 also adds bigger game (deer-ish, boar-ish) with combat mechanics rather than weighted rolls. Era 3+ hunts include strange creatures whose meat carries side effects (sanity drain, magical buffs). The "bird flock" pest event is on the future-events list — currently birds are exclusively a hunt target.

---

### 🟢 Resources & categories (with progressive disclosure)
**State.** Resources have a `category` field (`materials | food | fragment | tool | mystic | unknown`). Food resources additionally have `nutrition` and `tier`. Resources can be HIDDEN behind unlock conditions via `hiddenUntil` — fragments currently appear under "Unknown" with name `???` and icon `❓` until the future `arcaneAwakening` research is learned. Inventory groups by category in collapsible sections; collapse state persists in user settings. The eat action consumes any food-category resource (lowest-nutrition first). Cooking adds +5 nutrition per food.

**Where.** `src/content/resources.js` (data + display helpers), `src/ui/InventoryPanel.jsx` (rendering).

**Hidden-until pattern.** When a resource has `hiddenUntil: { researched: "X" }` and that research isn't learned, the inventory shows it under "Unknown" with placeholder name/icon. Once X is learned, the reveal is automatic — no code changes needed. Same pattern can gate behind buildings, era, etc.

**Early-game balance.** Pre-rock gather quantities are 1 (one) per drop, with high "nothing" weight (28%). The wasteland is barren. Once the rock is found, quantities climb to 1–2 and grubs appear at low weight (4) so the player can scratch up the occasional meal even before Foraging research. Post-awakening, 1–3 and grub weight rises to 5. Foraging research stacks on top with weight 15 — researching it is still the moment grubs become a reliable food source. This base presence prevents the prior dead-end where tier-2 research (which costs grubs) was unreachable when water for Foraging research was scarce.

**Currently shipped foods:** Grubs (gather, nutrition 10), Bird Meat (hunt drop, nutrition 22, tier 2 — first warm meal). Feathers (material from hunts, used in future fletching research).

**Next steps.** Add berries (Foraging tier 2). Roasted grubs (Cooking unlocks). Add `arcaneAwakening` research that reveals fragments as Arcane shards. Add Fletching (parent: Net Weaving + Trapping) that consumes feathers to produce arrows for the Era 2 bow.

**Long arc.** Era 2 farming and water collection. Era 3 magical foods. Spoilage/storage when abundance is real.

---

## Cross-cutting

### 🟢 Save/load with migration hook + JSON export/import
**State.** `localStorage` under `namigatchi-save`, versioned schema, `migrate()` in `save.js` ready for future schema bumps. New fields default-fill on load. Export downloads `namigatchi-save-YYYY-MM-DD.json`. Import reads a file, validates basic shape, writes to localStorage, reloads page (so migration runs cleanly). Save management now lives inside the Settings modal (gear icon, bottom-right).

**Where.** `src/state/save.js`, `src/systems/saveIO.js`, surfaced in `src/ui/SettingsModal.jsx`.

**Next steps.** Multi-slot saves (named save slots, save slot picker). Cloud save when there's a backend. Export-as-shareable-seed for replays/challenges.

---

### 🟢 User settings (theme, font, accessibility)
**State.** Separate persistence track from game state. Stored in `localStorage` under `namigatchi-settings` so settings survive across save resets, prestige wipes, and game data clears. Three theme options (Dark, Sepia), three font options (System, Lexend for dyslexia-friendly reading, Atkinson Hyperlegible for low vision), three text sizes (Small, Normal, Large), three motion options (Auto / Reduced / Full — Auto follows OS `prefers-reduced-motion`). Settings apply live via body class names and CSS variables. Inventory category collapse state also persists here. Accessed via floating gear icon at bottom-right.

**Motion / photosensitivity.** The awakening flash and other dramatic animations have calm variants (gentle fade-ins, no scale, no brightness peak) that activate under either OS preference OR explicit user choice. Important for photosensitive epilepsy and vestibular disorders. Default is "Auto" — respects OS — so users with their system already configured get safe behavior with no extra action.

**Where.** `src/state/settings.js`, `src/ui/useSettings.js`, `src/ui/SettingsModal.jsx`, `src/ui/SettingsTrigger.jsx`. Theme/font/motion CSS in `src/index.css` (body.theme-X, body.font-X, body.size-X, body.motion-X, plus `@media (prefers-reduced-motion: reduce)`).

**Long arc.** Color-blind palettes, sound volume controls when audio arrives, language selection if we localize, optional one-time photosensitivity warning on first ever launch. The pattern is established: any new preference goes in `SETTINGS_DEFAULTS`, gets a UI control, applies via CSS class or component state.

---

### 🟢 Prestige (Channel the Rock)
**State.** Mechanism live but UI hidden behind `era >= 2`. When a run ends via prestige, snapshot is taken, Echoes granted based on milestones (rock awakened +1, hut built +2, +1 per teaching, +1 per fire pit). Echoes accumulate in persistent state. Currently no spend (no upgrades to buy yet).

**Where.** `src/systems/prestige.js`, `src/state/reducer.js`.

**Next steps when Era 2 ships.** Echo upgrade tree (a third modal? same shape as teachings/buildings?). Permanent automation unlocks.

**Long arc.** Layers 2, 3, 4 of prestige (Vestiges, Eternities, ?). Each one wipes the layer below for a deeper currency.

---

### 🟢 Stats observability
**State.** Every action increments lifetime counters. Each run-end snapshot pushed to `runHistory` (capped 50). `compareRuns()` produces deltas for "better/worse" UI. Stats UI gated behind first prestige (`runsCompleted >= 1`).

**Where.** `src/systems/stats.js`, `src/ui/StatsPanel.jsx`.

**Next steps.** When Era 2 ships and prestige unlocks, this finally becomes visible. Add charts later (run length over time, resource trends).

---

### 🟢 Logging — Recent / Unlocks / Stats tabs
**State.** Right column has tabs. Recent = transient gameplay feedback (gather drops, build failures, threats, events). Unlocks = narrative progression beats (rock find, awakenings, whispers, builds, teachings, choice events). Stats (locked).

**Where.** `src/ui/RightColumn.jsx`, `src/ui/LogPanel.jsx`, `src/ui/UnlocksPanel.jsx`, `src/ui/StatsPanel.jsx`, `src/content/logKinds.js`.

**Long arc.** Possibly a fourth tab when companions arrive (Companion log? Faction log?).

---

### 🟢 Audio (era-driven music with progressive unlocks)
**State.** Music plays automatically based on era — tracks tagged `era0`, `era1`, etc. crossfade as the player progresses. When the player first reaches an era, every track tagged for that era is added to `persistent.unlockedMusic` and stays unlocked forever (across prestige). Players can pin any unlocked track to override era-based selection. Crossfades are smooth (~2.5s). Browser autoplay policy is handled — if initial play is blocked, music retries on first user interaction. Volume sliders (Master / Music / Sound) and Mute toggle in Settings. Credits section auto-renders attribution from the audio data.

**Currently in the game.** One music track: "Dark Ambient Soundscape" by LemonMusicLab (Pixabay), tagged `era0, ambient, calm`. Plays from the moment the player begins a fresh run. Will fade out when era 1 is reached and no era1 track is yet defined.

**Where.** `src/content/audio.js` (registry + era helpers), `src/systems/audio.js` (playback, crossfade, autoplay retry, sync logic), `src/state/persistent.js` (unlockedMusic), `src/state/reducer.js` (SYNC_MUSIC_UNLOCKS action), `src/App.jsx` (era-watch effect that triggers unlock + play sync), `src/ui/SettingsModal.jsx` (volume sliders, mute, music picker), `src/ui/CreditsSection.jsx` (attribution).

**To add a music track or SFX:** use `npm run add-audio` (the dev tool). It walks through download → metadata → license → registers in audio.js. The Credits section picks it up automatically.

**For tracks specifically:** tag with `era0` / `era1` / etc. for auto-play in that era. Tagging multiple eras (e.g. `era1`, `era2`) means it remains an option across multiple eras (auto-pick prefers the highest era track that's tagged for the player's current era).

**Free music sources.** Pixabay Music (royalty-free, no attribution required), Free Music Archive (CC-BY mostly), Incompetech (CC-BY, Kevin MacLeod), Tabletop Audio (great for ambient/horror, personal use free), Uppbeat, Bensound. For SFX: Freesound.org, Sonniss GDC packs.

**Long arc.** Per-era music progression (sparse Era 1 ambient → eldritch Era 5 horror). SFX for gather, awaken, build, threat, event, choice. Optional dynamic music — track changes based on world state (low sanity layers an eldritch drone, etc.). Player music history (which tracks they've heard, on what runs).

---

### 🟢 Stone strip + Teachings trigger
**State.** Persistent strip at bottom. Once hut built, clickable — opens teachings modal. Lore-fitting (you're literally listening to the stone).

**Where.** `src/ui/StonePanel.jsx`.

**Long arc.** As the stone evolves through forms, this strip changes. Eventually the stone may be replaced by an evolved companion sprite.

---

## Development tools

Scripts that help work on the project but aren't shipped as part of the game.
Live in `tools/`. See `tools/README.md` for the full list.

### 🟢 Dev panel (in-game debug overlay)
**State.** A full-screen modal with one-click buttons to skip the grind: unlock everything, give 999 of every resource, build all buildings, learn all research, craft all tools, level all skills, max stats, skip time, trigger pests, etc. Toggled via Ctrl+Shift+D or a floating 🛠️ button bottom-left.

**Gated by `import.meta.env.DEV`.** The panel and its keyboard shortcut do not ship in production builds. Escape hatch: `settings.devUnlocked = true` re-enables it in a built game (no UI for that yet — flip in the save JSON).

**Architecture.** All dev actions are pure functions in `src/systems/dev.js` that return a `{ run, persistent, msg }` patch. The DEV_PATCH reducer action applies it. This keeps mutations predictable and replayable, and means new dev helpers slot in alongside without touching the reducer.

**Adding a new dev button.** Write a `devXxx(state, ...args)` helper in `systems/dev.js` returning `{ run, msg }`. Add a `<Btn>` in DevPanel.jsx that calls `apply(dev.devXxx(state))`.

**Where.** `src/systems/dev.js` (helpers), `src/state/actions.js` (DEV_PATCH), `src/state/reducer.js` (DEV_PATCH case), `src/ui/DevPanel.jsx` (UI + Ctrl+Shift+D hook), `src/ui/Shell.jsx` (mount + floating button).

---

### 🟢 `tools/add-audio.js` — audio import wizard
**State.** Walks through adding a music track or SFX. Asks for a source URL, fetches the page to suggest a title, attempts to find and download a direct MP3 link (works on hosts that expose URLs in HTML; falls back to manual file path otherwise). Prompts for id/title/artist/tags/volume/loop/license, auto-detects license from common source domains (Pixabay, FMA, Incompetech, Freesound, Tabletop Audio, Uppbeat, Bensound), copies the file into `public/audio/`, and appends a properly-formatted entry to `src/content/audio.js`. The Credits section auto-renders the new entry.

**Run.** `npm run add-audio` (or `node tools/add-audio.js`).

**Long arc.** As the asset pipeline grows, similar wizards may help with adding research nodes, threats, events, buildings, etc. Pattern: each tool is a self-contained Node script under `tools/` that prompts for missing data and either generates a snippet or appends directly to the relevant content file. Same content-as-data philosophy applied to the *authoring* layer.

---

## Pipeline (planned, not built)

### ⬜ Companions / NPCs / Villagers
**Vision.** Some choice events lead to NPCs joining. They become **villagers** that need to be kept happy, or they rebel and the player loses progression. Each villager has loyalty/happiness/skill. Can be assigned to tasks (auto-gather, auto-build, auto-craft, auto-research). Their alignment drifts based on the player's choices and how they're treated. The player rules them — well or badly — and the villagers either thrive or revolt. Revolt = setback (resources lost, structures damaged, possibly forced run reset?). The "evil ruler" path keeps villagers in line by force; "good ruler" path keeps them through care. Both work — but the cost is different.

**Hidden alignment ties in.** A high-good player attracts compassionate villagers; high-evil attracts ruthless ones. Mixed-alignment players get more conflict.

**A fourth log tab arrives with this system.** Likely "Villagers" or "Settlement" — shows individuals, their happiness, recent actions, drift in loyalty.

**Trigger to build.** Era 2, once we have enough world state and event richness for them to feel alive. Probably the second-biggest system after combat.

---

### 🟢 Era 2 — Settler (first pass shipped)
**State.** Era 2 entry condition is met when: hut + fire pit built AND foraging + fire + knapping researched. `computeEra(state)` returns 2 from this state. The first time the player crosses into Era 2, a story-event modal fires (🌅 narrative log + sanity/resolve boost), tracked via `run.eraMilestonesSeen` so it only fires once per run.

**Shipped Era-2 content.** Smithing research (parent: knapping + fire, requires era≥2). Forge building (requires Smithing). Fletching research (parent: netWeaving + tracking, requires era≥2). Era-2 tools (Forge-required): Stone Axe (-150ms gather + 2 wood/wood-gather, 50 durability), Stone Pickaxe (-100ms gather + 2 stone/stone-gather, 50 durability), Bone Knife (+1 hunt yield + 1 food/food-gather, 60 durability), Bow (+2 hunt yield, -2500ms hunt cooldown, way more birds, 60 durability).

**Tool effect plumbing extended.** `getToolEffects` now aggregates resource-specific bonuses: `woodBonus`, `stoneBonus`, `foodBonus`, `waterBonus`. Gathering applies the right bonus based on what dropped. Crafting now supports `requires.builtBuilding: "forge"` for tier-2 tools.

**Prestige UI auto-reveals at era ≥ 2** — the existing prestige system was already gated; reaching Era 2 makes the "Channel the Rock" button appear.

**Vision (next, not built yet).** Permanent settlement structures, first organized threats (bandits), more research nodes (Trapping refinements, ranged combat upgrades), eventual companions/villagers system.

**Era 2 entry condition (proposed).** Hut + Fire Pit built AND all tier 1 teachings learned (Foraging, Fire, Knapping). The transition itself is a story event — "you have made a place; now make a settlement."

**Buildings to add.** Forge (smithing center), Garden (passive food), Well (passive water), Granary (storage capacity), Tool Shed (tool storage + crafting bench).

**Research to add.** Smithing (parent: Knapping), Agriculture (parent: Foraging), Trapping (parent: Vigilance), Joinery (parent: Knapping). Each unlocks new buildings or recipes.

**Trigger to build.** Once Era 1 feels complete and balanced — current iteration is filling in Era 1 content.

---

### 🟡 Tools system (primitive tier shipped)
**Status.** Primitive tier is live as part of Era 1 (Net, Snare, Digging Stick, Water Skin) — see the **Crafting** entry above. Era 2 forge-required tools are still planned.

**Era 1 (shipped).** Hand-made tools that don't require a Forge. Stored in inventory under `category: "tool"`. Crafting consumes resources and grants Crafting XP. Effects apply passively while owned. No durability yet.

**Era 2 (planned).** Stone Axe, Stone Pickaxe, Bone Knife. Each unlocked by Smithing research, each crafted at the Forge. Likely first tier with durability (degrades with use, repair at Forge).

**Long arc.** Tool tiers across eras (Stone → Bronze → Iron → Steel → Magitek → Eldritch). Higher tiers boost more. Magic tiers do strange things (a Fragment Knife also drops sanity when used? — fits the lore).

**Trigger to expand.** Era 2 brings the Forge.

---

### 🟢 Idle / passive generation (infrastructure live)
**State.** Buildings can declare `passiveProduce: { resourceId: { perMinute: N } }`. On every TICK (every 15 seconds), `applyPassiveProduction(state)` walks owned buildings, sums per-minute rates, applies pest modulators, multiplies by the elapsed real time since `lastPassiveTickAt` (capped at 30 minutes for offline catch-up), and spills whole units into inventory. Fractional carry-over lives in `run.passiveAccum` so a 0.7-unit/tick rate doesn't lose its tail.

**Era 1 producers (shipped).** Well — water +2/min. Garden — grubs (food) +3/min, halved while a bird flock is active.

**Pest modulation.** `passive.js` exposes `getProductionModulators(run)` — declarative read on `run.activePests`. Currently: bird-flock active → all food production × 0.5. Adding new pests = new entry in the modulator map.

**Catch-up.** When the player closes the tab and returns, `lastPassiveTickAt` is hours behind. The system credits up to 30 minutes of passive output on first re-tick, so overnight returns feel meaningful but not exploitable.

**Where.** `src/systems/passive.js`, `src/state/run.js` (`lastPassiveTickAt`, `passiveAccum`, `activePests`), `src/state/reducer.js` (TICK handler), `src/content/buildings.js` (`passiveProduce` field).

**Long arc.** Era 2 adds Forge passive production (slag, ingots). Era 3+ arcane buildings produce mystic resources at low rates. Era 4+ industrial automation drastically raises rates and adds compound chains (Garden → Granary → Bakery). Same `passiveProduce` data shape carries forward.

---

### ⬜ Era 3 — Awakened World (Magical Medieval)
**Vision.** Magic emerges. The Spirit stat activates as a magical-energy meter (the held-back name from Resolve). Alchemy, enchantment, ritual. Magical fragments refine into spells. Alignment system surfaces in mechanics. First demons appear as threats.

---

### ⬜ Era 4 — Arcane Industry
**Vision.** Magitek. Larger settlements with multiple companions. Automated gathering. NPC factions emerge.

---

### ⬜ Era 5 — Eldritch Reckoning
**Vision.** Cosmic horror peak. Sanity becomes a primary management concern. Tame elder beasts. Alignment crystallizes — paths fork.

---

### ⬜ Era 6 — Ascendant
**Vision.** Post-mortal. Small empire mechanics. Two divergent paths (Saint-Ruler / Tyrant-King) based on alignment.

---

### ⬜ Era 7 — Cosmic
**Vision.** Sci-fi space tier. Endgame. Beyond-planet content.

---

### 🔮 Nested scale ladders (long-term prestige)
**Vision.** Multiple prestige layers that wipe progressively more (planet → galaxy → universe → multiverse). Each layer is "the same loop at a higher scale of being." Same gather → research → bond → reset, but the *units* upgrade. Antimatter Dimensions / NGU Idle / Cell to Singularity model.

**Trigger to build.** Years out. Layer 1 (Echoes, planet-scale) is shippable first.

---

### 🟡 Moddability strategy
**State.** *Designed for* moddability from day one, even though the loader doesn't exist yet. All content files in `src/content/` are pure data (no functions inside content objects, no logic embedded in records). Migrating to JSON is a one-day refactor whenever it's needed.

**What that means today.** Don't introduce predicate functions or runtime-evaluated code into content data files. Keep predicates as named flags (`requires.rockAwakened: true`, not `requires: (state) => state.run.rockAwakened`). The eat action's `consumesCategory` pattern is the right shape — declarative data, the system code interprets it.

**Long arc.** When ready, build a JSON loader that:
1. Reads JSON content files at runtime
2. Validates against a schema (we'll write schema docs alongside content)
3. Allows external mod packs to override or extend base content
4. Provides a clear "plugin contract" doc for modders

**Trigger to build.** When player demand exists, OR when the user wants to start authoring their own content packs as a creative outlet. The underlying *content shape* is already mod-ready — only the *loader* is missing.

**Schema docs to write before launch.** A page per content type (resources, buildings, research, threats, events) documenting the fields, types, and example records. This becomes the modder's reference.

---

## Living updates

When a system changes meaningfully:
1. Update the relevant entry above (status, state, next steps).
2. If it's a new system, add a new entry.
3. If it's deprecated, mark it ⬜ → 🔮 → eventually delete.
4. Commit `docs/systems.md` along with the code change so the doc and the code stay in sync.

The architecture audit (`docs/architecture.md`) is the *static structure* doc.
The roadmap (`docs/roadmap.md`) is the *vision* doc.
This file is the *current-state-of-play* doc.

Use them in that order: vision → architecture → systems-state → code.
