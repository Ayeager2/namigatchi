# Handoff & Continuity

This doc lets you (or a fresh AI assistant) pick up exactly where the previous session left off — on a different machine, after a long break, or in a brand-new conversation.

Read this **first** when resuming work. The other docs are reference; this is the briefing.

> **🤖 AI assistants:** read [`docs/AI_CONTEXT.md`](AI_CONTEXT.md) FIRST. It's the dense pointer-rich spine designed for fast onboarding (architectural rules, file map, where-to-add-what tables, state shape). Then come back here for current state and next moves. Skip the human-narrative docs (`roadmap.md`, `architecture.md`) unless you need design rationale for a specific decision.

---

## What is this project?

**Lithos** is a long-arc incremental/idle game with cosmic horror flavor, built in React + Vite (browser-only for now, eventually Steam-bound).

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
- **Era 1 (Awakening):** build hut → research tree (now 16+ nodes across 4 tiers, includes Boiling + Altar Work) → build fire pit + **Water Hole** (renamed Well) + Garden + Cairn → craft primitive tools → hunt birds → manage hunger/thirst/energy/HP/resolve/sanity → **water tier system** (Stagnant 🩸 / Muddy 💧 / Boiled 🫖, each with dysentery risk) via **Drink dropdown** with risk hints → **Boil action** (muddy → boiled at fire pit) → defend against scavenger threats → respond to random events with hidden alignment → manage caps + spoilage
- **Era 2 (Settler):** trigger as before → 🌅 era transition story event → research Smithing → build Forge → craft Era-2 tools → research Fletching → ranged hunting via Bow → research Home → build Home → build settlement chain (Stone Walls, Silo, Farmhouse) → **research Altar Work** → **build Stone Altar** (the gate to Arcane Studies) → craft **Scrolls 📜 + Ink 🖋️** (Alchemy recipes — 2 wood + 1 fragment, 1 wood + 1 grub) → prestige UI ("Channel the Rock") reveals for the first time
- **Era 3 (Awakened World):** as before → also unlocks deeper studies (cross-path nodes like Wardweave / Ghostcall / Truesight) and the Voidcall path (apex-gated by alignment.evil ≥ 5)

### Arcane Studies system (NEW — shipped 2026-05)
**Lithos's deep magic layer**, fully playable end-to-end:

- **Stone Altar** building (Era 2, requires Home + Altar Work research) — passive +0.2 sanity/min + +0.1 spirit/min trickle, gates the Studies tab
- **Studies left-rail tab** appears once the Altar is built
- **Path Trees modal** with **seven paths**: Light · Bend · Elemental · Sigilcraft · Memory · Stoneword · Voidcall (apex-gated)
- **21 study nodes** authored in first pass, including 3 cross-path nodes (Wardweave: Sanctuary + First Sigil → +2 Armor; Ghostcall: First Echo + Curse; Truesight: Weakness-Sight + Cleansing Word)
- **Timed study mechanic** — each node has a duration (tier 1 ≈ 2 min, tier 4+ ≈ 12 min). Progress accrues ONLY while idle (no actions for 5s). Multiple studies in-progress allowed; one active at a time; switching is free and lossless. Cancel discards time but doesn't refund materials.
- **Cost gating** — every study consumes 1 scroll + 1 ink + path-flavored extras at start
- **Per-path completion deltas** (locked):
  - Light: +3 sanity, +1 good
  - Bend: −3 sanity, +1 evil
  - Elemental: +1 sanity, +1 world score
  - Sigilcraft: +1 sanity, +0.5 world score
  - Memory: +2 sanity, +0.5 world score
  - Stoneword: +2 sanity, +0.5 world score
  - Voidcall: **−5 sanity, +2 evil, −1 world score** — the world thins where you stand
- **10 new spells** unlocked by studies (greaterMending, cleansingWord, blessing, greaterBend, curse, soulflame, dominate, echo, ghostcall, voidcall) — gated via new `requires.studied` field in spells
- **Altar etchings** persist across runs (`persistent.altarEtchings`) — first study, first per-path, first cross-path, every Voidcall completion
- **Stone strip surfaces active study** — subtle progress bar at the bottom of the strip with pause indicator when player acts. Lets the player feel the clock tick from anywhere in the UI.

### World Score system (NEW — shipped 2026-05)
**Hidden silent meter** tracking how much the world *remembers* under the player's hand. Contributed by Elemental study completions (+1), Sigilcraft/Memory/Stoneword (+0.5 each), helpful event choices (+0.5 / +1), Ash Cleanse passive trickle. Eroded by Voidcall completions (−1) and casts (−1).

**Graduated effects table** (no UI feedback until apex):

| Threshold | Effect |
|---|---|
| ≥ 5 | Gather yield ×1.05 |
| ≥ 15 | Garden output ×1.20 (stacks with farmhouse + Quicken Growth) |
| ≥ 30 | Gathered water_stagnant promotes to water_muddy ~10% of the time |
| ≥ 50 | Water Hole produces water_boiled directly (skips muddy) |
| ≥ 80 | Garden produces bird_meat instead of grubs |
| ≥ 100 | Apex reveal — one-shot log event tells the player the meter exists |

### Dysentery + disease system (NEW — shipped 2026-05)
Drinking stagnant or muddy water rolls against `dysenteryChance` (25% / 10% / 2% per tier). Sick state doubles hunger/thirst drain and applies slow HP / sanity / spirit drain. Cleared by Mending Word spell, Mending Potion, or fades naturally (5–10 min). Boiled water drunk while sick shortens recovery by 60s. Foundation for future illnesses.

### Echo Shop (prestige spending)
After channeling, Echoes can be spent in the **🌀 Echo Shop** — click the Echoes badge in the header, or hit the "Echo Shop" button on the prestige modal before channeling. 14 upgrades across 5 categories (Cache / Body / Mind / Skills / Arcane). Tiered upgrades cost `ceil(baseCost * 1.5^level)`; one-time upgrades buy once. Purchases land in `persistent.echoUpgrades` and seed every new run via `applyEchoUpgrades(freshRun(), persistent)` in RESET_RUN and PRESTIGE.

### Echo Shop (prestige spending)
After channeling, Echoes can be spent in the **🌀 Echo Shop** — click the Echoes badge in the header, or hit the "Echo Shop" button on the prestige modal before channeling. 14 upgrades across 5 categories (Cache / Body / Mind / Skills / Arcane). Tiered upgrades cost `ceil(baseCost * 1.5^level)`; one-time upgrades buy once. Purchases land in `persistent.echoUpgrades` and seed every new run via `applyEchoUpgrades(freshRun(), persistent)` in RESET_RUN and PRESTIGE. Examples: Old Wood (+10 wood per level × 5 levels), Tougher Body (+20 starting HP, one-time), Foraging Memory (start with foraging at +1 level per tier × 5 tiers), Sliver of Stone (+5 fragments per level × 3 levels), Banked Spirit (+10 starting Spirit per level × 4 levels).

### Major systems shipped (🟢 in systems.md)
State management (persistent + run split), reducer pattern, content-as-data, scene composition, gathering loop with anti-spam cooldown, keyboard shortcuts (G/R/E/D/H, customizable), rock awakening, splash screen, buildings in tree modal (now including **Stone Altar**), passive production with offline catchup, teachings tree, primitive + Era-2 + arcane crafting with durability, hunting with skill-driven yield, skills system, survival (HP/hunger/thirst/energy + Resolve/Sanity/Spirit), threats incl. Whisperer/Hollow Hound/Iconoclast, random events (50 across Era 1/2/3) with hidden alignment, pest events, settings, audio with era-driven music, save/load with versioned migration, prestige + Echo Shop, layout refactor (left rail with tabs + right column + footer action strip + Stone strip with Channel-the-Rock + active-study indicator), **water tier system** (Stagnant/Muddy/Boiled + virtual-water cost), **dysentery + disease module**, **Drink dropdown** with risk hints, **Boil action**, **Stone Altar building**, **Scroll + Ink resources** with new `producesResource` craft pattern, **Arcane Studies system** (timed-study engine + pause-on-action + 21 nodes across 7 paths + per-path completion deltas + spell unlocks via `requires.studied` + altar etchings persisting across runs + Studies UI), **World Score** (hidden meter + 6 graduated thresholds + apex reveal).

### Major systems planned (⬜ in systems.md / queued in task list)
**Combat arc** — equipped weapon slot foundation (Phase 1), passive combat resolution + rich log narration (Phase 2), weapon progression + combat skills swordplay/archery/magicCombat (Phase 3), specialized gather actions Chop/Mine/Forage + iron_ore/coal/herbs (Phase 4), iron tier + smithing (Phase 5), weapon enchants tied to Arcane Studies (Phase 6). **Boss system** (turn-based modal, 1 mini + 1 main per era, elemental gates Era 3+). **Stat-damage with targeted recovery** (different threats hit different stats; protein recovers strength; herbs recover sanity). **Death-debuff system** (STR % loss cascades to all stats; food recovers gradually). **Character page** (full-page UI replacing center body, three-panel stat display with STR bridging survival + combat, 8 main equipment slots + 13 accessories tray, tooltip comparison). **Crafting page** (full-body, family-subtabbed: Blacksmithing/Alchemy/Fletching/Farming/Woodworking/Tailoring). **City management** (Era 4+, deferred).

### Notable design decisions on file
- Tracks unlock as eras progress; persistent across prestige; player can pin any unlocked track
- "Resolve" is the happiness stat name; Spirit is the magic-resource stat (was reserved, now active in Era 3+)
- Fragments display as "Unknown ???" until `arcaneAwakening` research unlocks the truth; Scrolls + Ink hidden similarly until `altarWork` is learned
- Sanity drops only from horror events (threats, damage, eldritch); Resolve drops from physical deprivation and rises from comfort/progression
- **Skills are run-only**, fully reset on prestige
- **Spirit and Mana are the same thing** — locked decision. UI uses "Spirit" everywhere; the underlying stat key is `spirit`.
- **STR is the bridge stat between survival and combat** — will be added when Combat Phase 1 lands. Protein-based foods recover it.
- **Two defense stats** — locked. `defense` (existing) stays for settlement/raid defense (food theft, structure damage). New `armor` (Combat Phase 1/2) is personal damage reduction.
- **Boss fights = turn-based modal**, retry-friendly. Routine combat is passive-log.
- **Death debuff cascades from STR** — combat death = wake at home, no run reset. STR drops 50%; that % cascades to all survival stats.
- **Arcane Studies = layered on top of Stone's Teachings**, not replacing it. Teachings stays instant-listen for fundamentals; the Altar is where deep magic study happens with timers.
- **Multiple in-progress studies allowed**, lossless pause-on-action, free switching. Materials are the cost; time is yours to hold.
- **Voidcall is APEX-GATED** by `alignment.evil ≥ 5`. Every Voidcall completion costs the world (worldScore −1). Designed as the "I've gone too far" path with the strongest payoff.
- **Seven magic paths, not three** — locked via AskUserQuestion. Cross-path nodes encourage build identity ("Light + Sigilcraft" plays different from "Bend + Memory").
- **Hidden alignment never shown as a number.** Same now true of **World Score** until 100 apex reveal.

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

Header shows era · counts · alignment · echoes · **WS (World Score) · studies completed/in-progress**, plus a "Next era needs:" line listing exactly what's missing for the next era. **Six** tabs:

- **🚀 Quick** — Era jumps (1/2/3), full unlocks per era, rock + fragments, bulk resource grants
- **🌍 Content** — Granular toggles for every building, research node, and tool. ✓ marks owned; stackable potions/materials show ×N. (Scroll/Ink recipes route to their resource ids automatically.)
- **🧠 State** — Per-stat sliders, skill levels, alignment setters, spell-cooldown clear, **status toggles including Dysentery (apply 5 min / clear)**
- **⚔️ Encounters** — Force-fire each threat by name, pest controls, event cooldown wipe, clear active event modal
- **🕯️ Arcane (NEW)** — Stone Altar one-tap build (with prereqs), scroll + ink grants, water-tier shortcuts, study completion (active / all), study reset, **World Score quick-set (0 / 5 / 15 / 30 / 50 / 80 / 100) + nudge ±5**, altar etchings inspector + wipe
- **⏱️ System** — Time skip, inventory dump, wipe run, nuke save

Gated by `import.meta.env.DEV`, so it does NOT ship in production builds. If you want it in a built game for testing, set `settings.devUnlocked = true`.

All dev actions emit a "🛠️ Foo done." log line so you can see what changed. They use the same DEV_PATCH reducer action, which keeps state changes predictable. Force-fired threats additionally pump their own flavor messages into the log via `patch.events`.

**Typical workflows:**
- Test Era 3 spell: Quick → 🚀 Unlock all Era 3 → State → set alignment to good 5 → Content → toggle banishSpell research → cast from in-game UI.
- **Test Arcane Studies end-to-end**: Arcane → 🕯️ Build Stone Altar → 📜 +5 Scrolls & Inks → open Studies tab → Open Path Trees → Start a study → Arcane → Complete active study → check the Spells modal for the unlock.
- **Test World Score thresholds**: Arcane → WS → 30 → gather a few times → watch the log light up with "💦 The water's less of the dust today" promotions. WS → 100 fires the apex reveal once.
- **Test dysentery**: State → Apply Dysentery (5 min) → watch the doubled hunger/thirst decay + per-tick HP/sanity drain.
- **Test Warding Talisman**: Content → arcane tools → Warding Talisman → Encounters → Force Whisperer / Hollow Hound.

---

## Likely next moves (pick one when resuming)

The Arcane Studies arc is complete. The natural next focus is the **Combat / Weapons / Skills** arc, which is the largest unbuilt system and has 7 phases queued. Detailed task list in the in-app TodoList (#32–#42, #50) and design specs in `docs/ERA_PLAN.md` under "Combat + Weapons + Specialized Skills (RPG layer)" and "Character page + Crafting page (full-body UI restructure)".

Suggested ordering:

1. **Combat Phase 1: equipped weapon slot foundation (#32).** Small, visible. Add `run.equipped`, `content/weapons.js` with tier-1 weapons (Wooden Club, Stone Spear, Stone Mace), dual-use pattern (hatchet vs battle axe — same family, different stat distribution). 8 main equipment slots + accessories tray. First slottable weapon → tooltip-compare arrives later.
2. **Combat Phase 2: passive resolution + rich log (#33).** Move existing threat system into a real fight loop. 3–6 log lines per encounter. New `content/threats.js` tiered roster. Pair with **#39 armor split**, **#42 stat damage**, and **#50 death-debuff** to land combat with weight.
3. **Character Page Phase A view architecture (#43).** Pure plumbing — Shell.jsx grows a `view` state, left-rail tabs can be full-page (replace center column). Lays the foundation for #44 Character page + #48 Crafting page.
4. **Character Page Phase B read-only (#44).** Three-panel stat display (Survival / Bridge: STR / Combat: DEX/SPD/MAG/Spirit/Armor). Equipment slots row. Body & Mind tab retires. First visually satisfying "character sheet."
5. **Combat Phases 3–6 + Character Phases C–G.** Build out weapon progression, specialized gather, iron tier, enchants, equipment inventory grid, tooltip-compare, Crafting page family-subtabs, polish. Each is itself multi-session.
6. **Boss roster + boss-fight modal (#40, #41).** Author the content — at least 1 mini + 1 main per era, plus elemental gates Era 3+. Modal UI for turn-based combat.
7. **Polish + Era 1 paper-cuts.** Era background indicator (BUGS.md #008). Bird tiering / grub birds. Shelter-tier rest. Audio expansion.
8. **City management (#38, deferred).** Don't start until Combat + Character pages ship.

When in doubt, ask before assuming.

---

## How to onboard a fresh AI assistant

If starting a new conversation (different machine, new session, different model — anything that loses prior context), paste this prompt at the start:

> I'm continuing work on **Lithos**, a JS/React long-arc incremental game with cosmic horror flavor. Built in React 19 + Vite, browser-only for now, eventually Steam-bound.
>
> **Before suggesting anything, please read these in order:**
> 1. `docs/HANDOFF.md` — current state and onboarding
> 2. `docs/roadmap.md` — vision and design decisions
> 3. `docs/architecture.md` — structural patterns
> 4. `docs/systems.md` — every system's current state
>
> The codebase is **content-as-data**: game content lives in `src/content/*.js` as plain data objects (no functions inside content). Systems in `src/systems/*` read content and run logic. UI components in `src/ui/*` render state. Reducer is thin; logic lives in systems.
>
> We're in **Era 2/3** territory — full gameplay loop through Era 3 (Arcane Studies, World Score, dysentery + tiered water, alignment-driven content, 50 events). Recent sessions shipped: **water tier system** (Stagnant/Muddy/Boiled with dysentery rolls per drink), **Drink dropdown** with risk hints, **Boil action**, the entire **Arcane Studies arc** (Stone Altar building + scroll/ink resources + timed-study engine with pause-on-action + 21 nodes across 7 paths including apex-gated Voidcall + 10 new spells unlocked via `requires.studied` + altar etchings persisting across runs + full Studies UI), and the **World Score** hidden meter (6 graduated thresholds + apex reveal). The next big arc is **Combat / Weapons / Skills + Character page** — fully specced in `docs/ERA_PLAN.md`, queued in tasks #32–#50. But ask me what I want to work on rather than assuming.
>
> Please follow the patterns established in existing code. Accessibility-first (reduced motion, accessibility fonts, no flashing without a setting to disable). Hidden alignment never shown to the player as a number.

That gets the new assistant into the same context. They'll read the docs, see the code, and be ready to continue.

---

## Committing

Standard `git add . && git commit -m "..." && git push`. Suggested commit messages have been provided at the end of each iteration in chat — they're descriptive and follow no specific convention beyond clarity.

For solo work (you), one big commit per feature is fine. If you ever collaborate, prefer smaller commits.

---

*Update this doc whenever a session ends with meaningful changes. The goal is for "next time you open this" to be a 30-second reorientation, not an archaeology project.*
