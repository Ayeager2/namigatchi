# Handoff & Continuity

This doc lets you (or a fresh AI assistant) pick up exactly where the previous session left off — on a different machine, after a long break, or in a brand-new conversation.

Read this **first** when resuming work. The other docs are reference; this is the briefing.

> **🤖 AI assistants:** read [`docs/AI_CONTEXT.md`](AI_CONTEXT.md) FIRST. It's the dense pointer-rich spine designed for fast onboarding (architectural rules, file map, where-to-add-what tables, state shape). Then come back here for current state and next moves. Skip the human-narrative docs (`roadmap.md`, `architecture.md`) unless you need design rationale for a specific decision.

---

## What is this project?

**Namigatchi** is a long-arc incremental/idle game with cosmic horror flavor, built in React + Vite (browser-only for now, eventually Steam-bound).

You wake in a poisoned post-apocalyptic wasteland. You find a rock that talks to you in whispers. You progress through 8 eras (Scavenger → Awakening → Settler → Awakened World → Arcane Industry → Eldritch Reckoning → Ascendant → Cosmic) while the rock evolves alongside you, your hidden alignment crystallizes (good/dark), and the world transforms.

It's a passion project intended for eventual Steam release. Heavy emphasis on accessibility, moddability-readiness, and architectural integrity.

---

## Setup on a new machine

```bash
git clone https://github.com/Ayeager2/namigatchi.git
cd namigatchi
npm install
npm run dev
```

Open `http://localhost:5173` in browser. That's the whole setup.

**To move your game save** between machines: open the in-game Settings (gear, bottom-right) → Save management → Export. On the new machine, Settings → Save management → Import the exported JSON file.

**Settings** (themes, fonts, keybindings, volumes) do NOT transfer with the save file by design — they live in a separate `localStorage` key (`namigatchi-settings`). They're per-device preferences. Re-configure on each machine.

---

## Reading order for the docs

### For humans

Read in this order **before doing anything**:

1. **`docs/roadmap.md`** — vision, era ladder, design decisions made, open questions
2. **`docs/architecture.md`** — structural design (the v1 audit + v2 addendum at the bottom describes the *current* architecture)
3. **`docs/systems.md`** — current state of every gameplay system, with status legend (🟢 shipped · 🟡 partial · ⬜ planned · 🔮 future-vision). This is the live "what's where" doc.
4. **`docs/BUGS.md`** — known bugs / paper-cuts to fix in polish passes. Add new bugs here as you find them.
5. **`docs/ERA_PLAN.md`** — living plan for Era 2 expansion + Era 3 content. Concrete tasks live in the in-app todo list; this doc is the design rationale.
6. **`tools/README.md`** — dev tools (audio import wizard, etc.)
7. **This file** — current state and how to resume

### For AI assistants

1. **`docs/AI_CONTEXT.md`** — dense pointer-rich onboarding (rules + file map + state shape + add-this-here tables). ~5 min read.
2. **`docs/HANDOFF.md`** (this file) — current state + immediate next moves.
3. **`docs/systems.md`** — open only when working on a specific system; find its entry.
4. Roadmap / architecture only when you specifically need design rationale.

---

## Architectural rules to internalize

These are the patterns the codebase enforces. Don't violate them when adding features.

- **Content as data.** Game content (resources, buildings, research, threats, events, audio) lives in `src/content/*.js` as plain data objects. **No functions inside content.** This keeps it moddable — JSON migration is a one-day refactor when needed.
- **Thin reducer + system files.** `src/state/reducer.js` is a thin dispatcher; gameplay logic lives in `src/systems/*.js`. Each system is a pure function.
- **Persistent vs run state separation.** `state.persistent` survives prestige forever (echoes, run history, unlocked music). `state.run` wipes on prestige. Save format already supports it.
- **Pure scene composition.** UI doesn't decide what to show — `systems/scene.js` does. UI just renders.
- **Modal pattern for content-heavy screens.** Trees (research, buildings) and rich UIs live in modals triggered from main UI.
- **Accessibility first.** Reduced motion respects OS preference. Fonts include dyslexia-friendly Lexend and low-vision Atkinson Hyperlegible. Photosensitivity considered for any flashing content.
- **Hidden alignment.** Good/evil counters track silently in run state. Never displayed to the player. Surfaces through consequences (NPC reactions, branching paths, tameable creatures), not numbers.
- **Anti-spam from day one.** Gather has a cooldown; key-repeat doesn't auto-fire. Manual click → faster manual click → automation is the entire incremental progression curve.

---

## Current state (as of this commit)

### What's playable end-to-end
- **Era 0 (Scavenger):** gather → find rock → collect 10 fragments → rock awakens with consume animation
- **Era 1 (Awakening):** build hut → research tree (15 nodes across 4 tiers) → build fire pit + Well + Garden + Cairn → craft primitive tools (Net, Snare, Digging Stick, Water Skin) → hunt birds → manage hunger/thirst/energy/HP/resolve/sanity → defend against scavenger threats → respond to random events with hidden alignment → watch four skills level from doing the work → manage caps + spoilage
- **Era 2 (Settler):** trigger by hut + fire pit + tier-1 research (Foraging + Fire + Knapping) → 🌅 era transition story event → research Smithing → build Forge → craft Era-2 tools (Stone Axe, Stone Pickaxe, Bone Knife, Bow) → research Fletching → ranged hunting via Bow → research Home → build Home → build settlement chain (Stone Walls, Rudimentary Silo, Rudimentary Farmhouse) → four NPC-hint events suggest each next building → prestige UI ("Channel the Rock") reveals for the first time
- **Era 3 (Awakened World):** trigger by Forge + Home built + Smithing + Fletching learned + Bow crafted → 🌌 darker transition story (sanity dip) → Spirit stat appears in SurvivalBars → research Arcane Awakening (fragments-only cost) → fragments reveal as "Arcane Shards" → research starter spells (Mending Word, Soothe, Inner Hearth) → cast from Spells panel (consumes fragments + spirit, per-spell cooldowns) → Whisperer threats begin appearing (sanity-only damage, defense doesn't help) → research Alchemy + build Alembic → brew stackable potions (Mending +40 HP, Stillness +30 sanity, Spirit Draught +100 spirit) and use from Tools modal → Hollow Hound demons appear (HP + sanity damage, half-defense) → alignment crystallizes: at good ≥ 3 the Benevolent Pilgrim arrives and Banish research surfaces (wards demons for 5 minutes); at evil ≥ 3 the Bitter Scholar arrives and Bend research surfaces (drains Resolve for Spirit) → craft the **arcane tool tier** (Fragment Knife: +2 food gather but the blade bites 1 sanity each food gather; Spirit Censer: passive +1 Spirit/min while carried; Warding Talisman: halves demon HP damage AND sanity drain) → perform **Ritual** action (1 fragment + 2 water → +30 Spirit + 3 sanity) for explicit Spirit refill → the rarest demon, the **Iconoclast**, walks past and drains both Resolve and Sanity at the same time

### Major systems shipped (🟢 in systems.md)
State management (persistent + run split), reducer pattern, content-as-data, scene composition, gathering loop, gather cooldown, keyboard shortcuts (G/R/E/D/H, customizable), rock awakening with consume + flash animation, splash screen, buildings (Hut + Fire Pit + Well + Garden) in tree modal, **passive production** infrastructure (TICK-driven, with offline catch-up cap, fractional accumulators, declarative `passiveProduce` per building, modulated by active pests), teachings (research, 13 nodes) in tree modal, primitive crafting with durability (Net/Snare/Digging Stick/Water Skin) — tools wear with use and break, with their own Tools modal + trigger card, hunting (separate action button with long cooldown, skill-driven yield curve, brutal energy + thirst cost), skills system (4 active + 4 stubbed for future eras, levels from doing the work, declarative bonuses) with right-column tab, survival (body stats: hunger/thirst/energy/HP), mind stats (Resolve + Sanity, with hard-core opening), threats (Scavenger only for now), random events (8 fire-and-react events + 4 choice events) with hidden alignment tracking, **pest events** (bird flock that halves Garden output and grub gather, dispersed by hunting), settings system (theme/font/size/motion/audio/save management/keybindings/credits), audio with era-driven music + progressive unlocks + crossfade, save/load with versioned migration + JSON export/import, prestige (gated behind era ≥ 2, hidden until then), stats observability (gated behind first prestige), responsive layout (desktop 3-column, mobile stack), four-tab right column (Recent / Unlocks / Skills / Stats), inventory categorization with collapsible sections (Materials / Food / Tools / Unknown for fragments).

### Major systems planned (⬜ in systems.md)
Era 2 content (Settler tier — would unlock the prestige UI + Forge-required tool tier), companions/villagers (with happiness, can rebel and set you back), Forge-tier tools (Stone Axe, Bone Knife, etc.), Fletching → arrows (consumes feathers from hunts), Granary + preservation (food-specific storage + reduced spoilage), more research nodes, more building types, more threat types, bigger game/combat-style hunts.

### Notable design decisions on file
- Tracks unlock as eras progress; persistent across prestige; player can pin any unlocked track
- "Resolve" is the daily-wellbeing stat name (not Spirit, which is reserved for a future magic system)
- Fragments display as "Unknown ???" in inventory until a future `arcaneAwakening` research unlocks the truth
- Sanity drops only from horror events (threats, damage, future eldritch). Resolve drops from physical deprivation and rises from comfort/progression.
- Era 2 transition condition (proposed): hut + fire pit + all tier 1 teachings learned
- **Skills are run-only**, fully reset on prestige. The "I have to relearn it every life" rhythm is intentional — future Echo upgrades will grant "start with +N skill levels" perks rather than carrying XP across runs.
- **Primitive tools sidestep the Forge.** Era 1 tools are hand-made (cordage, fire-tempered wood, stitched skins). The Forge is reserved for Era 2 and unlocks Stone Axe / Bone Knife / etc.
- **Hunting is brutal at first, by design.** Base 8s cooldown, energy -10, thirst +3 per attempt, and successful bird hits add another +2 thirst. Drop weights at level 0 favor empty/grub; they shift toward birds with skill. Per the user direction: "you suck at hunting, you don't know how" — this is the curve.
- **Tracking research** stays in research-land for now (gates Trapping). The Tracking *skill* is stubbed but not active — the Hunting skill subsumes "getting better at finding things" for Era 1.

---

## Where to look when stuck

- **"How does X work mechanically?"** → `docs/systems.md`, find the entry
- **"Where is X in the code?"** → systems.md entry has "Where" pointer
- **"What was decided about Y?"** → `docs/roadmap.md`
- **"What patterns does the code use?"** → `docs/architecture.md` (v2 addendum at bottom)
- **"How do I add audio?"** → `tools/README.md`, run `npm run add-audio`

---

## Dev panel (skip the grind while testing)

A debug overlay is available in dev mode (`npm run dev`). Press **Ctrl+Shift+D** or click the floating 🛠️ button at bottom-left to open it.

Header shows era · counts · alignment · echoes, plus a "Next era needs:" line listing exactly what's missing for the next era. Five tabs organize the controls so finding what you want is fast:

- **🚀 Quick** — Era jumps (1/2/3), full unlocks per era, rock + fragments, bulk resource grants. The "I just want to test X right now" tab.
- **🌍 Content** — Granular toggles for every building, research node, and tool. ✓ marks owned; stackable potions show ×N.
- **🧠 State** — Per-stat sliders (HP / Energy / Hunger / Thirst / Resolve / Sanity / Spirit each with 0 / 50 / max buttons), skill levels, alignment setters (good/evil 5/10/neutral), spell-cooldown clear, status toggles (Apply / Clear Warded).
- **⚔️ Encounters** — Force-fire each threat by name (bypasses encounter chance and warded status), pest controls, event cooldown wipe, clear active event modal.
- **⏱️ System** — Time skip, inventory dump, wipe run, nuke save.

Gated by `import.meta.env.DEV`, so it does NOT ship in production builds. If you want it in a built game for testing, set `settings.devUnlocked = true` (no UI for that yet — flip it via the save export/import flow).

All dev actions emit a "🛠️ Foo done." log line so you can see what changed. They use the same DEV_PATCH reducer action, which keeps state changes predictable. Force-fired threats additionally pump their own flavor messages into the log via `patch.events`.

**Typical workflows:**
- Test Era 3 spell: Quick → 🚀 Unlock all Era 3 → State → set alignment to good 5 → Content → toggle banishSpell research → cast from in-game UI.
- Test Warding Talisman: Content → arcane tools → Warding Talisman → Encounters → Force Whisperer / Hollow Hound.
- Test alignment events: State → Good 5 (or Evil 5) → wait for interval roll, OR force via gather.

---

## Likely next moves (pick one when resuming)

These are the natural next things to work on. Pick whichever pulls strongest:

1. **Era 2 transition.** Define the trigger condition properly, build the era-transition story event, add Smithing research, Forge building, the Era-2 tool tier (Stone Axe, Bone Knife — Forge-required), Fletching → arrows. This unlocks the prestige UI for the first time.
2. **More Era 1 content.** Add 2–3 more research nodes (Cooking exists, maybe Wells for passive water). Add 1–2 more buildings (Storage, Garden). Add a "bird flock" pest event that drops grub yield until hunted off.
3. **Hunting depth.** Add a Tracking skill (currently stubbed) that surfaces over time as you hunt — fold it into hunt success math. Add a `huntFail` cooldown variant where missed shots cost less energy than completed stalks.
4. **Companions / villagers.** Big system; designs exist in systems.md. Probably wait for Era 2.
5. **Polish + playtest.** Run through Era 0 → Era 1 → craft Net → hunt birds → reset → repeat. Tune the hunt cost/yield curve, balance Crafting refund chance, sanity-check the Foraging/Building XP rates.
6. **Audio expansion.** Add more music tracks for Era 1 variety; add SFX for gather/build/awaken/threat/hunt moments.

When in doubt, ask before assuming.

---

## How to onboard a fresh AI assistant

If starting a new conversation (different machine, new session, different model — anything that loses prior context), paste this prompt at the start:

> I'm continuing work on **namigatchi**, a JS/React long-arc incremental game with cosmic horror flavor. Built in React 19 + Vite, browser-only for now, eventually Steam-bound.
>
> **Before suggesting anything, please read these in order:**
> 1. `docs/HANDOFF.md` — current state and onboarding
> 2. `docs/roadmap.md` — vision and design decisions
> 3. `docs/architecture.md` — structural patterns
> 4. `docs/systems.md` — every system's current state
>
> The codebase is **content-as-data**: game content lives in `src/content/*.js` as plain data objects (no functions inside content). Systems in `src/systems/*` read content and run logic. UI components in `src/ui/*` render state. Reducer is thin; logic lives in systems.
>
> We're in **Era 1** territory — gathering, research tree, hut, fire pit, **Well + Garden with passive production**, **Cairn (storage) with per-resource caps + food spoilage**, survival, threats, random events (8 atmospheric + 4 choice), **bird-flock pest event**, alignment all working. Last session we added **skills**, **primitive tool crafting with durability**, **hunting**, the **passive production infrastructure** (TICK-driven, offline catch-up capped at 30 min), and the **pest system** (events can `setsPest`, modulators in `passive.js` halve Garden output, hunts disperse). Next is probably Era 2 transition (Forge + Smithing) or Storage with caps/spoilage, but ask me what I want to work on rather than assuming.
>
> Please follow the patterns established in existing code. Accessibility-first (reduced motion, accessibility fonts, no flashing without a setting to disable). Hidden alignment never shown to the player as a number.

That gets the new assistant into the same context. They'll read the docs, see the code, and be ready to continue.

---

## Committing

Standard `git add . && git commit -m "..." && git push`. Suggested commit messages have been provided at the end of each iteration in chat — they're descriptive and follow no specific convention beyond clarity.

For solo work (you), one big commit per feature is fine. If you ever collaborate, prefer smaller commits.

---

*Update this doc whenever a session ends with meaningful changes. The goal is for "next time you open this" to be a 30-second reorientation, not an archaeology project.*
