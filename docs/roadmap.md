# Namigatchi — Roadmap & Vision

A living document capturing the vision for the project and the architectural decisions that follow from it. Built up via conversation. Update as the vision sharpens.

> *This file is not a spec. It's a thinking-out-loud doc meant to be revisited and rewritten.*

---

## The vision (in your own words)

> *I want to combine Tamagotchi caretaking of the digital pets that will slowly grow into a story-like game that will combine aspects of incremental RPG games like Progress Knight but with a world-building scale that extends to the gods. So you start as a nothing-child, and find this rock — the rock itself is the namigatchi that has the ability to change the very existence you live in. The start is in a hellish dead earth post-apocalyptic state, and by the end you have saved the world by removing the radiation and toxins, bringing back life to the world but in a more magical combination. But as you progress you also unleash hellish demons and Cthulhu-like beasts into the world that you have to use and tame for your dark/light purposes — becoming a beloved ruler, or one that is reveling in the chaos you created.*

### Core elevator pitch (Claude's restatement, for sanity)

You start as a nothing-child in a poisoned, post-apocalyptic world. You find a rock — the namigatchi — which has reality-warping power. As you care for it and it grows, the world transforms: radiation and toxins recede, biology returns (in a magical, twisted form), but the same growth tears holes in reality and lets horrors through. You can tame those horrors and use them. Your choices push you toward becoming a beloved savior-ruler or a feared dark ruler reveling in the chaos. The progression has Progress Knight-style incremental/RPG bones — you go from nothing to god-tier across long arcs — and Tamagotchi-style hands-on caretaking remains the entry point and a constant presence.

### Genre stack

- **Tamagotchi** — pet caretaking, emotional bond with a creature
- **Progress Knight / incremental RPG** — long-arc numerical progression, tiered jobs/skills, idle elements
- **Monster collector** — taming and using the unleashed creatures
- **Cosmic horror** — Cthulhu/demonic flavor for the things that come through
- **World-builder / sim** — planet healing, biome restoration, faction reactions
- **Narrative branching** — light/dark moral arc with consequences

---

## Decisions made so far

### Ambition: maximum
This is a passion project that you want to (a) learn from, (b) share knowledge from, and (c) eventually monetize on Steam. **Implication:** design for the long term. Saves matter. Polish will eventually matter. Content scale will matter. Don't take shortcuts that lock us out of those futures.

### Time available: varies a lot
Some weeks heavy, some weeks zero. **Implication:** the architecture must be resilient to gaps. Code should be self-documenting. We should commit small, frequent changes. The codebase needs to be re-pickup-able after a 2-week absence without re-learning.

### Player POV: you ARE the child
The player is a character in the world. The rock is a thing you carry — companion + source of power, not your avatar. **Implication:** the data model has at least three first-class entities: **Player**, **Pet/Rock**, and **World**. The current `useTamagotchi` covers the Pet axis only. Player and World need to be designed.

### Gameplay rhythm: hybrid (active foreground, idle background)
While playing, the player actively does things (care, explore, fight, gather). When they leave, key systems keep ticking (pet ages, world state evolves, jobs complete). **Implication:** we need both an interactive command layer AND a simulation layer that runs with or without input. Save/load must capture enough state to "catch up" elapsed time on resume — the current code already does this for the pet; we'll need to do the same for the world.

### Game space: pure menus with an evolving master scene
The UI is fundamentally menu-driven (panels, screens, modals). But there's a single **master scene / header image** that visibly evolves as the player progresses. The scene is composed of layers — biome background, structures (hut, forge, shrine), sky/atmosphere, tamed creature silhouettes — each gated by game state. The world heals/corrupts in front of the player as they play.

**Implication:** we'll need a `Scene` system that's a pure function of game state. Layers are data (list of `{ id, condition, asset }` records), not code. Ship with text placeholders, swap to crude art, swap to final art — no rebuilds. Same data-driven philosophy as the minigame registry.

This is the right call for a solo project: maximum emotional payoff, minimum art commitment, scales infinitely.

---

## Core gameplay shape (decided)

### Genre
**Prestige-based idle/incremental with hybrid active/idle rhythm and a strong narrative spine.**

Think Antimatter Dimensions × Cell to Singularity × Tamagotchi × cosmic horror. Long-arc (300+ hours intended), infinitely scaled via stacked prestige layers, with active gathering and research as the foreground activity and idle progression in the background.

### Core loop (early game, ~5–10 minutes)
1. Player wakes in a dead post-apocalyptic landscape with nothing.
2. Gathering is the only mechanic. Wood, stone, water — random discovery.
3. Eventually, gathering yields **the namigatchi rock**.
4. Rock is dormant. Magical fragments now drop while gathering.
5. Once enough fragments accumulate, **the rock awakens** — chapter zero ends.
6. From here, systems unlock: research page, crafting, hut-building, etc.

### The research page
The spine of progression. Single sticky meta-screen. New research tabs unlock with each era. Most decisions live here.

### Civilization tier ladder (draft — 8 eras)

| # | Era | Tier flavor | Duration | New mechanics introduced |
|---|---|---|---|---|
| 0 | Scavenger | Pre-civilization | ~5–10 min | gathering, inventory, find rock |
| 1 | Awakening | Neanderthal | ~30 min | crafting, hut, research page (Survival) |
| 2 | Settler | Bronze/Iron | ~1–2 hr | smithing, agriculture, first companions, research (Crafts) |
| 3 | Awakened World | Magical Medieval | ~2–3 hr | magic, alchemy, fragments→spells, alignment system, research (Arcana) |
| 4 | Arcane Industry | Magitek | ~3–4 hr | NPCs, automation begins, research (Industry) |
| 5 | Eldritch Reckoning | Cosmic horror peak | ~3–4 hr | tame elder beasts, research (Forbidden), alignment crystallizes |
| 6 | Ascendant | Post-mortal | ~2–3 hr | small empire/dominion, research (Sovereignty), alignment forks paths |
| 7 | Cosmic | Sci-fi space tier | ~2–3 hr | godhood, beyond-planet content, research (Cosmos), endgame |

**Path structure:** linear Eras 0–5 (every player sees the same content), branching Eras 6–7 by alignment (light path = Saint-Ruler, dark path = Tyrant-King, possibly secret balanced path later). Total run length: ~12–18 hours of *active* play; idle accelerates significantly.

### Prestige system (the long arc)

**The player can — and eventually should — destroy the world and start anew.** This is both lore (the rock has reality-warping power) and core game mechanic.

#### Layer 1 — Echoes (build first)

- Reset action: "Channel the Rock" or similar — wipes run state, grants **Echoes** based on `f(era reached, world health, time efficiency, alignment commitment)`.
- Echoes spend in a permanent upgrade tree organized by category (Foundation, Knowledge, Heritage, Affinity, Mastery).
- Permanent automation unlocks: auto-gather → auto-craft → auto-research → auto-build → auto-summon → auto-magic → auto-prestige (endgame).
- Each subsequent run is faster because of upgrades AND more automated because of unlocks.

#### Layer 2 — Vestiges (add later)

- After enough Echo prestiges, unlock a deeper reset that wipes Echoes for **Vestiges**.
- Vestiges buy meta-upgrades that boost Echo gain and unlock new content.

#### Layer 3 — Eternities (add much later)

- Even deeper reset. New currency. Probably year-2 content.

**Architectural rule:** persistent state (Echoes, upgrades, story milestones, automation unlocks, lifetime stats) MUST be designed first-class from day one — separated from run state, versioned, with a migration path. A 200-hour player CANNOT lose their progress because we shipped a new field. This is non-negotiable given Steam monetization ambition.

### Save state shape (target)

```
saveFile = {
  version: <number>,
  persistent: {
    echoes: 0,
    echoUpgrades: {},
    automationUnlocks: {},
    storyMilestones: {},
    lifetimeStats: {},
  },
  run: {
    // current run state — all current useTamagotchi state lives here
  }
}
```

### Build roadmap (high-level)

1. **MVP:** single complete run, Eras 0–3 or 4. No prestige. Get the gather → research → progress loop feeling good. Validate fun.
2. **v2:** Eras 5–7. First ending. Still no prestige. ~5–8 hour playthrough.
3. **v3:** Add Echo layer + first automation unlocks. Now a ~30-hour game.
4. **v4+:** Add Vestige layer, more automation, more endings, more content. Now ~100+ hour game.
5. **Eternity layer + indefinite content drops.** 300+ hour game.

Each step is shippable. Don't build all five at once. Build (1) and validate before committing to (2).

---

## Nested scale ladders (the long arc)

The era progression isn't one ladder of 8 rungs — it's **the same satisfying loop replayed at progressively grander scales of being**. Same gathering → research → bond → reset core loop, but the *units* upgrade with each transcendence. This is the structure used by Antimatter Dimensions, Cell to Singularity, and NGU Idle to deliver hundreds-to-thousands of hours of play.

### The four scales

| Scale | Name | Unit | First-run length | Reset | Currency |
|---|---|---|---|---|---|
| 1 | Mortal | Planet | ~12–18 hr | Channel the Rock | Echoes |
| 2 | Ascendant | Galaxy | ~30–60 hr | Galactic Reset | Vestiges |
| 3 | Architect | Universe | ~50–100 hr | Universal Reset | Eternities |
| 4 | Pantheon | Multiverse | ~50–200 hr+ | Become the Rift (TBD) | Mythos (TBD) |

### How the loop scales up

The same actions get bigger units of meaning at each scale:

| | Scale 1 (Mortal) | Scale 2 (Ascendant) | Scale 3 (Architect) | Scale 4 (Pantheon) |
|---|---|---|---|---|
| Gather | resources (wood, stone, water) | populations | civilizations | realities |
| Research | tech | physics | metaphysics | ontology |
| Build | buildings | colonies | cosmologies | multiverses |
| Tame | demons | void entities | reality-predators | outer gods |
| Bond with | the rock | the awakened rock | the rock-as-pillar | the rock-as-cosmos |

By Scale 3, *what used to be a 12-hour game is a 1-second tick*. That's the magic of incremental design.

### Horror scaling

Each scale introduces bigger horrors. At Scale 1, you fear demons. By Scale 4, you ARE the demon — and the things that hunt you are bigger still. The cosmic-horror flavor scales with you naturally: it's about the thing too big to comprehend, and the player is constantly chasing that horizon.

### Shipping reality

Building all four scales is years of work — not Year 1 work. Realistic path:

1. **Ship Scale 1** complete. Validate fun. Stop and listen.
2. **Once players ask for more**, ship Scale 2 as expansion.
3. **Scale 3 and 4** are years out. They become major content drops.

**Architectural rule from day one:** the data model, save format, and core systems must *anticipate* Scale 4 — meaning nothing should block adding higher scales later. Build for Scale 1; design for Scale 4.

---

## The rock is everything (central design insight)

The rock (the namigatchi) is not a side-system. It is the **connective tissue of the entire game** — the entity through which Tamagotchi care, alignment, prestige, evolution, and visual world-transformation all flow. The player is its caretaker; the player's actions are how it learns; its eventual form is the game's meta-narrative.

### How it works mechanically

- **Slow bonded learning.** The rock gains a tiny fraction (~0.01%) of every meaningful action's XP/value. It's never *trained* directly — it learns from your *life*. Care actions, decisions, combat, research, prestige — all feed it.
- **Alignment-driven evolution.** As alignment commits across a run, the rock's form trajectory crystallizes:
  - **Light path:** dormant pebble → glowing fragment-encrusted stone → small humanoid → angelic guardian → cosmic savior
  - **Dark path:** dormant pebble → corrupted fragment-stone → twisted humanoid → monstrous beast → world-devouring horror
  - **Balanced path (potential late addition):** dormant → balanced → adjudicator → shimmering arbiter → cosmic equilibrium
- **In-run feedback loop.** The rock's mid-run form gives the player mechanical bonuses aligned with whichever path it's leaning into. Light-form rock → better research/healing/affection bonuses. Dark-form rock → better combat/taming/dominion bonuses. Player feels alignment matter *immediately*, not just at endgame.
- **The vessel of prestige.** When the world resets, the rock is what *remembers*. Its accumulated learning across all runs is what generates Echoes (and later Vestiges, Eternities). The rock IS the persistent state, in narrative terms. Players will form deep attachments to it across runs — much more so than to abstract numerical currencies.

### Why this design works

- **It justifies pet care as the core activity.** Every interaction with the rock feeds the central system. No mechanic feels grafted on.
- **It gives narrative meaning to prestige.** Resetting isn't a numerical choice — it's the rock channeling accumulated power to wipe the slate. Players will *feel* the weight of it.
- **It lets the master scene feature the rock as its emotional centerpiece.** Players watch their companion physically transform alongside the world.
- **It's the answer to "what is the existing useTamagotchi.js, really?"** It's the seed of the central system. Not a screen to replace — a kernel to grow.

### Architectural implications

- The rock's state needs to span both run state (current care needs, current form, current XP) AND persistent state (accumulated lifetime learning, prestige-level evolution, unlocked forms).
- The XP-trickle system needs to be a *generic listener* — every reducer action emits an event that the rock-XP system can subscribe to. This is the right pattern (event bus / observer) and it's how this kind of cross-cutting concern should be handled in a clean codebase.
- The form-evolution rules should be data, not code. Each form: `{ id, name, alignment_threshold, xp_threshold, bonuses, visualLayers }`. Adding a new form = new entry in a data file.

---

## Open questions (to discuss)

These are the architectural forks we haven't yet resolved. None need to be answered today.

### Game space (next conversation)

Pure menus vs discrete zones vs open-world map. Trade-offs to think through:
- **Pure menus** — fastest to build, scales infinitely, lets the *writing* carry the world (Reigns, Universal Paperclips, Progress Knight). Doesn't need an art pipeline beyond UI.
- **Discrete zones** — JRPG town-menu style. A handful of named locations you travel between. Adds atmosphere and identity to places. Medium complexity. Good fit for "show the world transform" — each zone has visible state.
- **Open-world** — a real 2D map. Highest complexity (tilemaps, collision, render layers) but highest potential. Probably premature for a solo project at this scale unless that's specifically what you want.

### Combat / taming mechanics
Not yet defined. Is taming a minigame? A skill check? A Pokémon-style turn-based encounter? An incremental "weaken then bond" timer?

### Alignment system
How does dark/light manifest mechanically? Cumulative tally of choices? Discrete event decisions? Influenced by which creatures you tame? By how you treat the rock?

### World state model
Radiation level (single number? per-biome?), toxins, biomes, NPC factions. What do they look like as data? How do they change?

### Story structure
Linear arc with branching endings? Episodic chapters? Procedurally generated with hand-written milestones? Where does writing live (in code, in markdown, in a story format)?

### Save format & migration
Saves are precious now (because of the monetization ambition). Need a versioned schema, migration path, and probably a `data version` separate from the code version.

### Visual style
Currently emoji. Long term: pixel art? Hand-drawn? 3D? Will determine the UI architecture and asset pipeline.

### Content pipeline
Items, creatures, biomes, story beats, jobs — at the scale you're aiming for, these probably need to live as data files (JSON/YAML), not JS code. Means we need a "content loader" subsystem.

### Tech stack future
React + Vite + browser is fine for now. Steam release means probably wrapping in Electron/Tauri (or rebuilding in a game engine). When does that decision happen?

---

## What the architecture needs to support (sketch)

Based on the vision so far, the eventual codebase will need at least these subsystems. Most don't exist yet — that's fine, we just need to leave room for them.

- **Player system** — identity, inventory, abilities, stats, alignment, story flags.
- **Pet system** — current `useTamagotchi`, evolved. The rock as a companion, not an avatar.
- **World system** — radiation, toxins, biomes, weather, time-of-day, faction states.
- **Creature/monster system** — tamed/untamed roster, stats, abilities, loyalty.
- **Story/event system** — beats, branches, decision history, dialog (if any).
- **Content registry** — items, creatures, biomes, jobs, story nodes loaded from data.
- **Simulation engine** — central tick that updates all systems with elapsed time.
- **Save system** — versioned schema, migration on load, possibly cloud-ready.
- **UI shell** — navigation between screens (pet panel, world map, character sheet, journal, etc.), not just one panel.

The current code is one node in this graph (the Pet system). That's a totally reasonable starting point — most great long-running indie games started as one well-built piece.

---

## Observability — collect now, expose later

The stats system was added to the foundation early because **data collection cannot be retrofitted**. Player A who plays for 50 hours before stats ship has no comparison data; the feature has to be there from day one even if invisible.

### What's collected (always, from run 1)

**Per-run accumulators** in run state:
- `gathered: { wood, stone, water, fragments }` — total picked up this run, never decreases
- `gatherCount` — total gather actions
- `startedAt` — run start timestamp

**Lifetime stats** in persistent state, updated on every run end:
- Resources by type (broken out, not just one total)
- Best era reached ever
- Fastest awakening (ms from run start)
- Fastest hut (ms from run start)
- Total time played
- Run counts (started, completed)
- Building counts (huts raised, etc.)

**Run history** — array of snapshots, capped at 50, most recent first. Each snapshot:
- runIndex, startedAt, endedAt, durationMs
- eraReached, rockAwakened, buildingsBuilt
- resourcesGathered, gatherCount
- echoesEarned (0 if reset, >0 if prestige)
- ending: "reset" | "prestige"

### What's exposed (gated)

A **Stats** tab in the right column of the layout. Three sections:
1. **Current Run** — duration, era, resources gathered, total
2. **Last Completed Run** — snapshot of last run with comparison deltas vs the run before it (the "better or worse" view)
3. **Lifetime** — total runs, best era, fastest milestones, time played, resources by type

**Unlock condition:** `persistent.lifetimeStats.runsCompleted >= 1` — i.e. after first prestige. Until then, the Stats tab is invisible. Data collection runs in the background regardless.

### Why this matters for the long arc

When prestige is the central mechanic of an incremental game, players become *students of their own runs*. They want to know: how did this run compare? Am I getting faster? Which strategy yielded more Echoes? Stats turn each run from a one-shot into a data point in a series — and that's what makes 30-hour games into 300-hour games.

The architecture also extends naturally: as we add more milestones, more buildings, more eras, the stats system absorbs them automatically. New fields go in `lifetimeStats` and `runHistory snapshot`; the StatsPanel UI gets new rows. No structural changes to the data model.

---

## Things to keep doing

A few habits worth maintaining as the project grows:

- **`CONFIG`-driven tuning** — current code has all magic numbers in one place. Keep this discipline. Eventually each subsystem will have its own config file, all readable at a glance.
- **Reducer pattern for state** — predictable state changes through one funnel per subsystem.
- **Registry pattern for content** — minigames already do this. Items, creatures, biomes, story nodes should follow.
- **Pure functions for derived state** — `getVisualState`, `computeMood`, `computeNeedSeverity` are great examples. Build new things this way.

---

## Things to deliberately not do yet

- Don't add types yet (TypeScript can come later when state shapes stabilize).
- Don't pick a final art direction yet (emoji is fine for prototype).
- Don't build any zone/map system yet (decision pending).
- Don't worry about Steam packaging yet (still in browser prototype phase).
- Don't write a story yet (mechanics first, story will be informed by what works).

---

*Conversation in progress. Update on each session.*
