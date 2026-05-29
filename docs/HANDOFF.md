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
- **Era 0 (Scavenger):** gather → find rock → collect 10 fragments → rock awakens with consume animation. **Played once per save** — ascension skips this.
- **Era 1 (Awakening):** build hut → research tree (16+ nodes across 4 tiers, includes Boiling + Altar Work) → build fire pit + **Water Hole** (renamed Well) + Garden + Cairn → craft primitive tools + **pure weapons** (Wooden Club / Stone Spear / Stone Mace) → equip a weapon → **multi-round combat encounters** (Wild Dog combat-class threat) → hunt birds → manage hunger/thirst/energy/HP/resolve/sanity → **water tier system** (Stagnant 🩸 / Muddy 💧 / Boiled 🫖, each with dysentery risk) via **Drink dropdown** with risk hints → **Boil action** (muddy → boiled at fire pit) → defend against scavenger threats → respond to random events with hidden alignment → manage caps + spoilage
- **Era 2 (Settler):** trigger as before → 🌅 era transition story event → research Smithing → build Forge → craft Era-2 tools (dual-use Stone Axe / Stone Pickaxe / Bone Knife = tool effects + weaponStats) → research Fletching → ranged hunting via Bow (also a dual-use weapon) → research Home → build Home → build settlement chain (Stone Walls, Silo, Farmhouse) → **Raider threats** (combat-class, real fight) → **research Altar Work** → **build Stone Altar** (the gate to Arcane Studies) → craft **Scrolls 📜 + Ink 🖋️** (Alchemy recipes — 2 wood + 1 fragment, 1 wood + 1 grub) → prestige UI ("Channel the Rock") reveals for the first time
- **Era 3 (Awakened World):** as before → deeper studies (cross-path nodes Wardweave / Ghostcall / Truesight) + Voidcall path (apex-gated by alignment.evil ≥ 5) → **Soulless Stalker** combat-class threat (sanity damage, ignores armor) + **Corrupted Walker** (hp damage, full fight loop) → Fragment Knife dual-use → 10 study-unlocked spells

### Death is no longer a run reset
Combat HP=0 triggers the **death-debuff cascade**: STR-magnitude jumps by 0.5 per death (cap 0.95), every survival stat scales down (HP/Energy/Happy/Sanity/Spirit drop to `raw × (1 − mag)`, Hunger/Thirst climb toward 100). Wake-up narration adapts to what's built (Home → "🏡 You wake in your home..." / Hut → "🛖 You wake at the hut..." / Bare → "🌑 You wake on the ground..."). Recovery: every food consumed reduces magnitude by the food's `deathDebuffRecovery` rate (grubs 0.05 — trace; bird meat 0.12 — real protein; Mending Potion 0.30 — panic button). When magnitude hits 0, debuff lifts: "🪶 The shake in your hands settles. The body is yours again."

### Ascension QoL (locked 2026-05)
**PRESTIGE skips the cosmic-horror opening.** The new run starts at Era 1: rock already found + awakened, hut already raised, survival mechanics live, splash skipped. Player still rebuilds Fire Pit / Water Hole / Garden / Cairn / everything else. The "find a rock in the dust → collect 10 fragments → awakening" sequence is a once-per-save experience.

**Resources stay known across runs.** Anything with a `hiddenUntil` rule that was unhidden at the moment of channeling gets snapshotted into `persistent.permanentlyKnown`. Fragments stop reading "???" once you've ascended carrying knowledge of them. Generic by design — any future hidden resource (mystic ores, voidshards, etc.) inherits the same persistence automatically.

**RESET_RUN (death/give-up) is unchanged** — still starts at Era 0 in the dust. The cosmic-horror opening still hurts when you've earned it.

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

### Combat system (NEW — shipped 2026-05)
Real RPG combat with equipped weapons, multi-round resolution, and rich log narration.

**Equipped slot foundation (#32).** `run.equipped` carries the full slot map:
- **Main slots (8, always visible):** handLeft / handRight (dual-wield) · ranged · head · chest · leggings · boots · gloves
- **Accessories tray (13, collapsible):** 10 rings · back · over-armor · talisman
- Two-handed weapons consume both hands (the off-hand stores a `{ twoHandedHeldIn }` pointer so the UI shows it as busy)
- Helpers: `getEquippedMeleeDef(run)` · `getEquippedRangedDef(run)` · `freshEquipped()` · `canEquip(state, id, slot)` · `performEquip/Unequip/EquipRing/UnequipRing`
- Reducer actions: `EQUIP` / `UNEQUIP` / `EQUIP_RING` / `UNEQUIP_RING` (equip ops are housekeeping, don't pause Arcane Studies)

**Weapon content.**
- Pure weapons (`content/weapons.js`): Wooden Club (no research, 2–4 dmg), Stone Spear (knapping, 3–7 dmg), Stone Mace (knapping, 4–8 dmg). Each has `durability: { wearsOn: "combat" }`.
- Dual-use tools (`content/tools.js`): Stone Axe / Stone Pickaxe / Bone Knife / Bow / Fragment Knife all carry `weaponStats` alongside their tool `effect`. The hatchet pattern: tool-leaning bonuses + modest combat stats. The numbers tell the player why a pickaxe makes a bad weapon.
- All weapons carry `subfamily` (axe/spear/mace/knife/pickaxe/bow/club) for future combat-skill XP routing in Phase 3 (#34).

**Combat resolution (#33).** `systems/combat.js` `resolveFight(state, threatDef, rng)`:
- Multi-round fight loop, max 12 rounds (safety cap)
- Each round: player attacks (`acc - eva` roll, on hit roll damage [min,max] ×2 on crit), then threat attacks
- Threat damage routed by `damageType: "hp" | "sanity" | "spirit"` — armor reduces hp damage only; sanity/spirit bypass armor (the mind has no armor)
- Fights produce 3–8 narrative log lines per encounter using threat-specific `combatFlavor` template pools (opener / attack / miss / victory / defeat) with `{weapon}`, `{threat}`, `{dmg}` substitutions
- Combat log lines use `kind: "combat"` with the `.log-entry--combat` CSS class — consecutive lines fuse into a single fight block via tinted left border
- Per-fight durability wear on equipped weapons via `applyToolWear(run, "combat")` (iterates both tools and weapons)

**Combat-class threats (#33):**
- **🐺 Wild Dog** (Era 1, hut+10 gathers) — 12 HP, acc 0.7, eva 0.05, dmg 2–4 (hp)
- **🗡️ Raider** (Era 2) — 22 HP, acc 0.78, eva 0.10, dmg 3–7 (hp)
- **🦴 Corrupted Walker** (Era 3, demon-class) — 35 HP, acc 0.72, eva 0.05, dmg 4–8 (hp)
- **🪦 Soulless Stalker** (Era 3, demon-class) — 18 HP, acc 0.85, eva 0.15, dmg 3–6 (**sanity**)
- **Existing one-shot threats** (Scavenger / Whisperer / Hollow Hound / Iconoclast) keep their narrative-rich single-event path. `routeThreat()` in `systems/threats.js` sniffs `threat.combat` and dispatches accordingly.

**Armor vs Defense split (#39, locked).** Two separate stats:
- `armor` — personal damage reduction in combat. Sources: study completions (Wardweave +2), future armor crafts, future Light-path enchants. Reduces hp-damage threats only.
- `defense` — settlement/structure defense. Used by raid-style one-shot threats (Scavenger food theft) and future city raids. Read via `systems/defense.js` (extracted from threats.js to break the combat→threats cycle).
- **Walls don't help when a wild dog jumps you in the wilderness** — that's the design intent. Walls protect your camp; armor protects your body.

**Death-debuff cascade (#50).** See "Death is no longer a run reset" above.

**Stat damage (#42, partial).** `damageType` routing on threat combat blocks. Sanity damage (Soulless Stalker), spirit damage (future arcane threats), hp damage (everything else). Recovery items get `recoversStat` annotations alongside `useEffect` (e.g. Stillness Potion clears sanity damage; Mending Potion clears HP damage). Full "damaged-stat tracking" UI lives in #44/#49.

### Echo Shop (prestige spending)
After channeling, Echoes can be spent in the **🌀 Echo Shop** — click the Echoes badge in the header, or hit the "Echo Shop" button on the prestige modal before channeling. 14 upgrades across 5 categories (Cache / Body / Mind / Skills / Arcane). Tiered upgrades cost `ceil(baseCost * 1.5^level)`; one-time upgrades buy once. Purchases land in `persistent.echoUpgrades` and seed every new run via `applyEchoUpgrades(freshRun(), persistent)` in RESET_RUN and PRESTIGE.

### Echo Shop (prestige spending)
After channeling, Echoes can be spent in the **🌀 Echo Shop** — click the Echoes badge in the header, or hit the "Echo Shop" button on the prestige modal before channeling. 14 upgrades across 5 categories (Cache / Body / Mind / Skills / Arcane). Tiered upgrades cost `ceil(baseCost * 1.5^level)`; one-time upgrades buy once. Purchases land in `persistent.echoUpgrades` and seed every new run via `applyEchoUpgrades(freshRun(), persistent)` in RESET_RUN and PRESTIGE. Examples: Old Wood (+10 wood per level × 5 levels), Tougher Body (+20 starting HP, one-time), Foraging Memory (start with foraging at +1 level per tier × 5 tiers), Sliver of Stone (+5 fragments per level × 3 levels), Banked Spirit (+10 starting Spirit per level × 4 levels).

### Major systems shipped (🟢 in systems.md)
State management (persistent + run split), reducer pattern, content-as-data, scene composition, gathering loop with anti-spam cooldown, keyboard shortcuts (G/R/E/D/H, customizable), rock awakening, splash screen, buildings in tree modal (now including **Stone Altar**), passive production with offline catchup, teachings tree, primitive + Era-2 + arcane crafting with durability, hunting with skill-driven yield, skills system, survival (HP/hunger/thirst/energy + Resolve/Sanity/Spirit), threats incl. Whisperer/Hollow Hound/Iconoclast, random events (50 across Era 1/2/3) with hidden alignment, pest events, settings, audio with era-driven music, save/load with versioned migration, prestige + Echo Shop, layout refactor (left rail with tabs + right column + footer action strip + Stone strip with Channel-the-Rock + active-study indicator), **water tier system** (Stagnant/Muddy/Boiled + virtual-water cost), **dysentery + disease module**, **Drink dropdown** with risk hints, **Boil action**, **Stone Altar building**, **Scroll + Ink resources** with new `producesResource` craft pattern, **Arcane Studies system** (timed-study engine + pause-on-action + 21 nodes across 7 paths + per-path completion deltas + spell unlocks via `requires.studied` + altar etchings persisting across runs + Studies UI), **World Score** (hidden meter + 6 graduated thresholds + apex reveal).

### Major systems planned (⬜ in systems.md / queued in task list)
**Combat arc — 4 of 7 done.** Equipped slot foundation ✅, passive resolution ✅, armor/defense split ✅, stat-damage routing ✅, death-debuff ✅. Remaining: weapon progression + combat skills swordplay/archery/magicCombat (#34); specialized gather actions Chop/Mine/Forage + iron_ore/coal/herbs (#35); iron tier + smithing (#36); weapon enchants tied to Arcane Studies (#37); boss-fight modal turn-based UI (#40); boss roster authoring — ≥1 mini + ≥1 main per era + elemental gates (#41). **Character page** (Phase A–G, tasks #43–#49): view-architecture plumbing, three-panel stat sheet (Survival / Bridge: STR / Combat: DEX SPD MAG Spirit Armor), 8+13 equipment slots, tooltip-compare, full equip/unequip UI. **Crafting page** (#48): full-body takeover, family-subtabbed (Blacksmithing/Alchemy/Fletching/Farming/Woodworking/Tailoring). **City management** (Era 4+, #38 — deferred).

### Notable design decisions on file
- Tracks unlock as eras progress; persistent across prestige; player can pin any unlocked track
- "Resolve" is the happiness stat name; Spirit is the magic-resource stat (was reserved, now active in Era 3+)
- Fragments display as "Unknown ???" until `arcaneAwakening` research unlocks the truth; Scrolls + Ink hidden similarly until `altarWork` is learned. **Once revealed and ascended-with, they stay revealed forever** via `persistent.permanentlyKnown`.
- Sanity drops only from horror events (threats, damage, eldritch); Resolve drops from physical deprivation and rises from comfort/progression
- **Skills are run-only**, fully reset on prestige
- **Spirit and Mana are the same thing** — locked decision. UI uses "Spirit" everywhere; the underlying stat key is `spirit`.
- **STR is the bridge stat between survival and combat** — to be added at Combat Phase 3 (#34). Protein-based foods recover it. Death-debuff magnitude currently tracks the cascade scalar in lieu of STR.
- **Two defense stats — armor vs defense (locked, shipped #39).** `defense` is settlement-only (raids, food theft, structure damage). `armor` is personal combat damage reduction. Walls don't help when a wild dog jumps you in the wilderness.
- **Boss fights = turn-based modal**, retry-friendly (#40, not yet shipped). Routine combat is passive-log (#33, shipped).
- **Death debuff cascades on combat HP=0 (shipped #50).** Stats scale by magnitude (first death 0.5, stacking +0.5 per death up to 0.95 cap). HP floored at 1 so the player stays alive. Wake-up narration adapts to what's built. Recovery via every-food-helps eating (grubs 0.05 / bird meat 0.12 / Mending Potion 0.30).
- **Ascension starts at Era 1 (locked).** Prestige skips the cosmic-horror opening — rock awakened + hut raised + survival live on the new run. RESET_RUN (death/give-up) still hurts at Era 0.
- **Resources stay known across runs (locked).** Anything revealed before ascending stays revealed in every future life via `persistent.permanentlyKnown`. Generic — works for any future hidden resource.
- **Combat is passive-log, NOT a modal.** Routine encounters resolve in 3–8 narration lines per fight. Bosses (#40) will use a modal turn-based UI; routine fights stay idle-friendly.
- **Combat-class vs one-shot threats coexist.** `threat.combat` field flips a threat into the fight-loop path; threats without it stay as narrative-rich one-shots. Both shapes live in `content/threats.js`.
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
- **⚔️ Encounters** — Force-fire each threat by name (including combat-class). **Equipment slots readout** (live status of every main slot + ring count). **Pure weapons section** — give + equip buttons for Wooden Club / Stone Spear / Stone Mace into either hand. **Quick-equip dual-use tools** — one-tap Stone Axe / Bone Knife / Stone Pickaxe / Fragment Knife / Bow into the right slot. Pest controls, event cooldown wipe, clear active event modal.
- **🧠 State** — Per-stat sliders, skill levels, alignment setters, spell-cooldown clear, status toggles. **Death-debuff controls**: apply (full cascade), set magnitude to 0.5 / 0.25 / 0, clear. Live readout: `Death debuff: mag 50% · deaths ×1`. **Dysentery**: apply 5 min / clear.
- **🕯️ Arcane** — Stone Altar one-tap build (with prereqs), scroll + ink grants, water-tier shortcuts, study completion (active / all), study reset, **World Score quick-set (0 / 5 / 15 / 30 / 50 / 80 / 100) + nudge ±5**, altar etchings inspector + wipe
- **⏱️ System** — Time skip, inventory dump, wipe run, nuke save

Gated by `import.meta.env.DEV`, so it does NOT ship in production builds. If you want it in a built game for testing, set `settings.devUnlocked = true`.

All dev actions emit a "🛠️ Foo done." log line so you can see what changed. They use the same DEV_PATCH reducer action, which keeps state changes predictable. Force-fired threats additionally pump their own flavor messages into the log via `patch.events`.

**Typical workflows:**
- **Test combat end-to-end**: Encounters → "+1 of every weapon" → "Wooden Club → handRight" → Encounters → Force Wild Dog → watch the multi-line fight log. Try without a weapon to feel the fists math.
- **Test the death cascade**: State → "💔 Apply Death Debuff (cascade)" → watch stats drop + wake-up narration. Then eat repeatedly (or Inventory → +999 → eat through grubs) and watch magnitude tick down to 0.
- **Test Arcane Studies end-to-end**: Arcane → 🕯️ Build Stone Altar → 📜 +5 Scrolls & Inks → open Studies tab → Open Path Trees → Start a study → Arcane → Complete active study → check the Spells modal for the unlock.
- **Test World Score thresholds**: Arcane → WS → 30 → gather a few times → watch the log light up with "💦 The water's less of the dust today" promotions. WS → 100 fires the apex reveal once.
- **Test dysentery**: State → Apply Dysentery (5 min) → watch the doubled hunger/thirst decay + per-tick HP/sanity drain.
- **Test ascension QoL**: Quick → 🚀 Unlock all Era 3 → State → max stats → click "Channel the Rock" (footer or stone strip if eligible) → new run starts with hut already raised + survival live + fragments still readable as "Arcane Shards" (not "???").
- **Test combat-class horror threat (sanity damage)**: equip any weapon → Encounters → Force Soulless Stalker → sanity drains per round, armor doesn't help.

---

## Likely next moves (pick one when resuming)

**Completed since the last handoff update:**
- ✅ Combat Phase 1 (#32) — equipped weapon slot foundation + dual-use pattern + pure tier-1 weapons
- ✅ Combat Phase 2 (#33) — passive multi-round fight loop + rich log narration + 4 combat-class threats
- ✅ Armor/Defense split (#39) — locked: `armor` personal, `defense` settlement
- ✅ Stat damage routing (#42) — damageType field on threats; Soulless Stalker drains sanity
- ✅ Death-debuff cascade (#50) — combat HP=0 → cascade + wake-up + food-based recovery (no run reset)
- ✅ Ascension QoL — prestige starts at Era 1 with rock awakened + hut raised; resources stay known across runs via `persistent.permanentlyKnown`

**Remaining in the Combat arc:**

1. **Combat Phase 3 (#34) — weapon progression + combat skills.** Weapon level/XP from kills (per equipped instance), levels add to damage/crit/acc rolls. New skills: `swordplay`, `archery`, `magicCombat` extending the skills.js system. Wires the existing `weaponStats` numbers into a growth loop.
2. **Boss roster (#41) — author content.** At least 1 mini + 1 main per era; elemental gates Era 3+. Lives in new `content/bosses.js`. Pace toward this — most other combat work doesn't unlock new content, this does.
3. **Boss-fight modal (#40) — turn-based UI.** Reuses passive resolution math but exposes it turn-by-turn. Attack / Spell / Item / Defend / Flee. Death is retry-friendly (death-debuff applies, no run reset). Lives in `ui/BossFightModal.jsx`.
4. **Combat Phase 4 (#35) — specialized gather actions.** Chop / Mine / Forage buttons unlock once the right tool is owned. New resources: iron_ore, coal, herbs, mushrooms, arrows. New skills: mining, woodcutting, fletching. Each action has its own cooldown.
5. **Combat Phase 5 (#36) — iron tier + smithing.** Iron Hatchet vs Iron Battle Axe (dual-use subfamily pattern). Smithing skill from each metal craft. Iron ingot recipe at Forge.
6. **Combat Phase 6 (#37) — weapon enchants.** Ties Combat + Arcane Studies. Enchant slots per weapon level (1/2/3). Enchants unlocked by Light/Bend/Elemental study completions. Altar UI for application.

**Character page arc (#43–#49):**

7. **Phase A (#43) — view architecture.** Pure plumbing: Shell.jsx grows `view` state ("world" | "character" | "crafting"). Compact rail tabs vs full-page rail tabs. Header / Scene / Right column / StonePanel / ActionStrip stay; center column swaps.
8. **Phase B (#44) — read-only Character page.** Three-panel stat sheet: Survival | Bridge (STR) | Combat (DEX/SPD/MAG/Spirit/Armor). Equipment slots row. Body & Mind tab retires. First visually satisfying "character sheet."
9. **Phase C (#45) — equipment inventory grid + equip/unequip UI.** Bottom panel of CharacterPage. Top tabs: All / Weapons / Defense / Herbs / Magic Items / Tools / Crafting Materials / Other. Inventory tab in left rail retires.
10. **Phase D (#46) — tooltip comparison.** Hover any item → tooltip shows candidate stats + currently-equipped + per-stat diff color-coded. Multi-slot handling for rings.
11. **Phase E (#47) — combat stats actually modulate combat.** STR scales melee damage + protein-recovery bridge. DEX scales ranged + acc + eva. MAG scales spell damage. SPD reduces cooldowns. Spirit regen at locked-very-slow base.
12. **Phase F (#48) — Crafting page.** Full-body takeover, sub-tabbed by family: Blacksmithing / Alchemy / Fletching / Farming / Woodworking / Tailoring. ToolsModal retires.
13. **Phase G (#49) — polish + animations.** Tab switch transitions. Hover states. Equip flourishes. Damaged-stat visual state on stat bars (red overlay).

**Era 1 polish + paper-cuts:**

14. **Era background indicator (BUGS.md #008).** Subtle per-era body class for ambient color cues.
15. **Bird tiering / grub birds.** Era 1 hunting depth. Captured in ERA_PLAN.md.
16. **Shelter-tier rest.** Rest quality scales with shelter level (no shelter / hut / hut+firepit / home / etc.). Half-shipped in code; needs the "no shelter = penalty" half.
17. **Audio expansion.** SFX for gather/build/awaken/combat/death-cascade moments.

**Deferred — not until Combat + Character pages ship:**

18. **City management (#38) — Era 4+, deferred.** Villager NPCs, role assignment, village-level threats.

**Suggested ordering when resuming**: #34 → #41 → #40 → #43 → #44 → #35 onward. #34 is the smallest combat-arc win that adds real progression; #41+#40 turn the combat layer into a real era-gating mechanic; #43+#44 give the player a place to *see* what they've built.

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
> We're in **Era 2/3** territory — full gameplay loop through Era 3 with real RPG combat. Already shipped: **water tier system** (Stagnant/Muddy/Boiled + dysentery + Drink dropdown + Boil action), **Arcane Studies arc** (Stone Altar + scroll/ink + timed-study engine with pause-on-action + 21 nodes across 7 paths including apex-gated Voidcall + 10 spells gated by `requires.studied` + altar etchings persisting + Studies UI), **World Score** hidden meter (6 graduated thresholds + apex reveal), **Combat Phases 1–2** (equipped slot foundation with 8+13 slots, dual-use Stone Axe/Bone Knife/Bow + pure Wooden Club/Stone Spear/Stone Mace, multi-round fight loop with rich log narration, 4 combat-class threats Wild Dog/Raider/Corrupted Walker/Soulless Stalker), **armor/defense split** (locked: armor personal, defense settlement), **stat-damage routing** (damageType field; Soulless Stalker drains sanity ignoring armor), **death-debuff cascade** (combat HP=0 → magnitude scales all stats, no run reset, food recovers), and **ascension QoL** (prestige starts at Era 1 with hut + rock awakened; resources stay known across runs via `persistent.permanentlyKnown`). The next big arcs are **Combat Phase 3+ (weapon progression, specialized gather, iron tier, enchants, bosses)** and the **Character/Crafting page** UI restructure — fully specced in `docs/ERA_PLAN.md`, queued in tasks #34–#49. But ask me what I want to work on rather than assuming.
>
> Please follow the patterns established in existing code. Accessibility-first (reduced motion, accessibility fonts, no flashing without a setting to disable). Hidden alignment never shown to the player as a number.

That gets the new assistant into the same context. They'll read the docs, see the code, and be ready to continue.

---

## Committing

Standard `git add . && git commit -m "..." && git push`. Suggested commit messages have been provided at the end of each iteration in chat — they're descriptive and follow no specific convention beyond clarity.

For solo work (you), one big commit per feature is fine. If you ever collaborate, prefer smaller commits.

---

*Update this doc whenever a session ends with meaningful changes. The goal is for "next time you open this" to be a 30-second reorientation, not an archaeology project.*
