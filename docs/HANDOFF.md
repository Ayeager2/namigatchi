# Handoff — Lithos

AI-optimized continuity doc. Bullets not prose. Drop content when shipped; never grow into paragraphs.

---

## Project
**Lithos** — React 19 + Vite long-arc incremental game with cosmic horror flavor. Browser-only (eventually Steam). 8 eras planned: Scavenger → Awakening → Settler → Awakened World → Arcane Industry → Eldritch Reckoning → Ascendant → Cosmic. Hidden alignment, prestige, ascension. **Currently Era 3 feature-complete.**

## Doc map
Read in order:

1. `docs/AI_CONTEXT.md` — file map · state shape · rules · where-to-add-what tables (start here, ~5 min)
2. `docs/HANDOFF.md` — this file: current state + next moves
3. `docs/systems.md` — per-system status (🟢/🟡/⬜/🔮). Open only when working on that system.
4. `docs/ERA_PLAN.md` — design rationale for cross-era arcs
5. `docs/BUGS.md` — known paper-cuts
6. `docs/roadmap.md`, `docs/architecture.md` — design history. Skip unless you need rationale.

## Architectural rules
- **Content-as-data.** `src/content/*.js` plain objects. No functions inside content.
- **Thin reducer + pure systems.** `src/state/reducer.js` dispatches → `src/systems/*` runs logic.
- **Persistent vs run split.** `state.persistent` survives prestige; `state.run` wipes. Revealed resources auto-persist via `persistent.permanentlyKnown` — any resource with a `hiddenUntil` rule, once revealed before a prestige, stays revealed forever.
- **Pure scene composition.** `systems/scene.js` decides what shows; UI just renders.
- **Hidden alignment + World Score never shown as a number.** Surface through consequences.
- **Anti-spam from day one.** Cooldowns; no key-repeat auto-fire.
- **Accessibility-first.** Reduced motion, dyslexia fonts, no flashing without opt-in.

## State (current commit)

### Playable end-to-end
- **Era 0** (once per save; skipped after first ascension) — gather → find rock → 10 fragments → awakening
- **Era 1** — hut → research tree (16+ nodes) → Fire Pit · Water Hole · Garden · Cairn → primitive tools + pure weapons (Wooden Club / Stone Spear / Stone Mace) → water tier system (Stagnant 🩸 / Muddy 💧 / Boiled 🫖 + dysentery + Drink dropdown + Boil action) → multi-round combat (Wild Dog) → hunting → six survival stats (HP/hunger/thirst/energy/Resolve/Sanity/Spirit)
- **Era 2** — Smithing + Forge + Era-2 dual-use tools (Stone Axe / Pickaxe / Bone Knife / Bow w/ `weaponStats`) → Fletching → Home + Stone Walls + Silo + Farmhouse settlement chain → Raider combat-class threat → Altar Work → Stone Altar → Scroll 📜 / Ink 🖋️ via `producesResource` craft pattern → prestige UI reveals
- **Era 3** — Arcane Awakening reveals fragments as Arcane Shards → 7 magic paths × 21 study nodes (timed, pause-on-action 5s idle, lossless switching, cross-path Wardweave/Ghostcall/Truesight, apex-gated Voidcall on `alignment.evil ≥ 5`) → 10 study-gated spells via `requires.studied` → Whisperer / Hollow Hound / Iconoclast / Corrupted Walker / Soulless Stalker (sanity-damage, ignores armor) → Fragment Knife / Spirit Censer / Warding Talisman arcane tier → Ritual action (fragments → Spirit) → altar etchings persist via `persistent.altarEtchings`

### Cross-cutting systems (shipped)
Per-system status in `docs/systems.md`. Grouped highlights:

- **Foundation** — persistent/run split · thin reducer + pure systems · content-as-data · scene composition · versioned save migration · settings/audio/keyboard shortcuts (G/R/E/D/H, customizable) · splash screen · save export/import
- **Combat** — equipped slots (8 main + 13 accessory) · pure + dual-use weapons (`weaponStats` alongside tool `effect`) · multi-round fight loop with 3–8 narrative lines per encounter · 4 combat-class threats · armor/defense split (armor personal, defense settlement-only) · `damageType` routing (hp/sanity/spirit) · death-debuff cascade (combat HP=0 → magnitude scales all stats, no run reset, food-based recovery) · per-fight `applyToolWear(run, "combat")`
- **Meta** — Echo Shop (14 upgrades, 5 categories: Cache/Body/Mind/Skills/Arcane) · ascension QoL (prestige starts Era 1; `persistent.permanentlyKnown` auto-persists revealed resources; RESET_RUN still starts Era 0) · 50 random events across Era 1/2/3 with hidden alignment · World Score hidden meter (6 thresholds + apex reveal at 100) · dysentery + disease module · prestige system with reward breakdown
- **UI** — left-rail tabs · right column · footer action strip · Stone strip with Channel-the-Rock + active-study indicator · dev panel (6 tabs) · Spells modal · Tools modal · Echo Shop modal · Prestige + Reset modals · Settings · Event modal

### Locked design decisions
- **Spirit = magic-energy stat** (was reserved as Mana; locked active in Era 3+)
- **STR = bridge stat** between survival and combat (lands at #34; death-debuff magnitude is the proxy until then)
- **Armor vs Defense** — armor reduces personal combat hp damage; defense is settlement-only (raids, food theft). Walls don't help when a dog jumps you in the wilderness.
- **Boss fights = turn-based modal** (#40 not yet shipped). Routine combat = passive log (shipped).
- **Voidcall apex-gated** by `alignment.evil ≥ 5`. Each Voidcall costs `worldScore −1`.
- **Ascension starts Era 1** (rock awakened + hut raised). RESET_RUN (death/give-up) still starts Era 0. The cosmic-horror opening hurts when you've earned it.
- **Resources stay known across runs.** Anything revealed before ascending stays revealed forever via `persistent.permanentlyKnown` (generic; works for any future hidden resource).
- **Skills are run-only.** Echo Shop's "Memory" upgrades seed start-of-run levels; XP never carries.
- **Seven magic paths, not three** (locked via AskUserQuestion). Cross-path nodes encourage build identity.
- **Combat-class vs one-shot threats coexist** — `threat.combat` field flips to fight-loop; threats without it stay narrative-rich one-shots. `routeThreat()` in `systems/threats.js` dispatches.
- **Arcane Studies layered on Stone's Teachings**, not replacing. Teachings = instant-listen for fundamentals. Altar = deep magic with timers.
- **Multiple in-progress studies allowed**, lossless pause-on-action, free switching. Materials are the cost; time is yours to hold.

## Next moves (suggested order: #34 → #41 → #40 → #43 → #44 → #35 onward)

**Combat arc (4/7 done):**
- **#34** — weapon progression + combat skills (`swordplay` / `archery` / `magicCombat`). Per-instance weapon XP from kills feeds damage/crit/acc rolls. Smallest combat win with real progression.
- **#41** — boss roster authoring. ≥1 mini + ≥1 main per era + elemental gates Era 3+. New `content/bosses.js`.
- **#40** — boss-fight modal turn-based UI. Reuses passive resolution math; exposes turn-by-turn. Attack / Spell / Item / Defend / Flee. Death is retry-friendly. `ui/BossFightModal.jsx`.
- **#35** — specialized gather actions (Chop / Mine / Forage) + resources (iron_ore, coal, herbs, mushrooms, arrows) + skills (mining, woodcutting, fletching).
- **#36** — iron tier + smithing skill (dual-use Iron Hatchet vs Iron Battle Axe; Iron ingot recipe at Forge).
- **#37** — weapon enchants tied to Arcane Studies. Enchant slots per weapon level (1/2/3). Unlocks via Light/Bend/Elemental completions. Altar UI.

**Character / Crafting page arc (#43–#49):**
- **#43** view-architecture — Shell `view` state ("world" / "character" / "crafting"). Center column swaps; header / scene / right column / StonePanel / ActionStrip stay.
- **#44** read-only Character page — three-panel stat sheet (Survival | Bridge: STR | Combat: DEX/SPD/MAG/Spirit/Armor) + equipment slots row. Body & Mind tab retires.
- **#45** equipment inventory grid + equip/unequip UI (top tabs: All / Weapons / Defense / Herbs / Magic / Tools / Crafting / Other). Inventory tab in left rail retires.
- **#46** tooltip-compare on hover (multi-slot ring handling).
- **#47** combat stats actually modulate combat (STR melee+protein; DEX ranged+acc+eva; MAG spell dmg; SPD cooldowns; Spirit regen).
- **#48** Crafting page — full takeover sub-tabbed (Blacksmithing/Alchemy/Fletching/Farming/Woodworking/Tailoring). ToolsModal retires.
- **#49** polish — tab transitions, hover states, equip flourishes, damaged-stat red overlay on stat bars.

**Polish / paper-cuts:**
- BUGS.md #008 — per-era body class for ambient color
- Bird tiering / grub birds (Era 1 hunting depth)
- Shelter-tier rest scaling (half-shipped — needs the no-shelter penalty half)
- SFX expansion (gather/build/awaken/combat/death-cascade)

**Deferred until combat + character pages ship:**
- **#38** City management (Era 4+) — villagers, role assignment, village-level threats

## Dev panel
Ctrl+Shift+D or floating 🛠️ (bottom-left). Gated by `import.meta.env.DEV` or `settings.devUnlocked`. All actions go through DEV_PATCH; force-fired threats pump flavor via `patch.events`.

Header status line: era · built · researched · alignment · echoes · WS · studies completed/in-progress · next-era requirements.

Six tabs:
- **🚀 Quick** — Era jumps (1/2/3) · full unlocks per era · rock + fragments · bulk resources
- **🌍 Content** — Per-item toggles for buildings/research/tools. ✓/×N status. Scroll/Ink recipes route to their resource ids.
- **🧠 State** — Per-stat sliders (0/50/max) for all seven stats · skill levels · alignment setters · spell-cooldown clear · status toggles (warded, dysentery 5min) · death-debuff controls (apply cascade, set magnitude, clear; live readout)
- **⚔️ Encounters** — Force-fire each threat by id (bypasses chance + warded gates) · equipment slots readout · pure weapons section (give + equip into either hand) · quick-equip dual-use tools (Axe/Knife/Pickaxe/Bow/FragKnife → right slot) · pest controls · event cooldown wipe · clear active event
- **🕯️ Arcane** — Stone Altar one-tap build (with prereqs) · scroll/ink grants · water-tier shortcuts · complete active study · complete all studies · study reset · World Score quick-set (0/5/15/30/50/80/100) + nudge ±5 · altar etchings inspector + wipe
- **⏱️ System** — Time skip · inventory dump · wipe run · nuke save

Test recipes:
- **Combat end-to-end**: Encounters → give every weapon → equip into handRight → Force Wild Dog → watch fight log
- **Death cascade**: State → Apply Death Debuff → eat repeatedly to tick magnitude to 0
- **Arcane Studies**: Arcane → Build Stone Altar → +5 Scrolls/Inks → Studies tab → start study → Arcane → Complete active study → check Spells modal
- **World Score thresholds**: Arcane → WS → 30 → gather → watch water-promotion log. WS → 100 fires apex reveal once.
- **Dysentery**: State → Apply Dysentery → watch doubled hunger/thirst drain + per-tick HP/sanity bleed
- **Ascension QoL**: Quick → 🚀 Unlock all Era 3 → State → max stats → Channel the Rock → new run starts hut-raised, fragments still readable as "Arcane Shards"
- **Echo Shop**: Channel the Rock → click header Echoes badge OR Echo Shop button on prestige modal → buy upgrades → new run seeds with their effects (verify via Inventory + stat bars)
- **Sanity-damage threat**: equip any weapon → Encounters → Force Soulless Stalker → sanity drains per round, armor doesn't help

## Onboarding prompt for a fresh agent

Paste this when starting a new conversation:

> Working on **Lithos** — React 19 + Vite incremental game, cosmic horror, browser-only.
>
> **State:** Era 3 feature-complete. Era 0→3 gameplay loop runs end-to-end with real RPG combat, Arcane Studies, World Score, ascension QoL, Echo Shop.
>
> **Active arcs** (cross-era, not era content):
> - Combat Phase 3+ (tasks #34–#41): weapon XP, iron tier, enchants, boss roster + modal
> - Character / Crafting page (#43–#49): view-architecture, three-panel stat sheet, equip UI, crafting takeover
>
> **Read first:** `docs/AI_CONTEXT.md` (file map + state shape + rules), then `docs/HANDOFF.md`. Open `docs/systems.md` only when working on a specific system.
>
> **Code conventions:** content-as-data in `src/content/*.js` (no functions). Thin reducer in `src/state/reducer.js` → pure systems in `src/systems/*`. Persistent vs run state split (`persistent.permanentlyKnown` auto-handles revealed resources). Hidden alignment never shown as a number. Accessibility-first.
>
> Ask what to work on rather than assuming.

## Update protocol

When ending a session with meaningful changes, update this doc:

1. **Move shipped items** from "Next moves" → "State (current commit)" in the right group (Foundation / Combat / Meta / UI) or under the relevant era in "Playable end-to-end".
2. **Add new tasks** to "Next moves" with **one line each** — task number, system area, what it adds. No prose paragraphs.
3. **Update locked decisions** if a new design call was made.
4. **Add a dev-panel test recipe** if a new system shipped — one line, format: "Name: tab → action → action → expected result".
5. **Adjust the onboarding prompt** if the active arcs changed (the bullet list, not the prose around it).
6. **Keep prose-free.** Bullets, not paragraphs. If you find yourself writing a paragraph, split it into bullets or move it to systems.md / ERA_PLAN.md.
7. **Target ≤200 lines.** This doc's job is 30-second reorientation, not exhaustive listing.
