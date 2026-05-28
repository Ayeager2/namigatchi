# Era Plan — Planned & Shipped

Living planning doc. **`docs/systems.md` is the source of truth for shipped systems** with full detail and code pointers. This doc captures the **design rationale** + the **what's-coming-next** roadmap.

Read order: skim "Planned" below for what's on the table; "Shipped" sections are short pointers to where the full detail lives in systems.md.

---

## 🎯 Planned (active design — not yet built)

### Layout refactor — multi-stage restructure of the main screen

**Status.** Part A (shell height-lock + column scrollbars) **shipped** — see BUGS.md #010. The rest below is design captured for implementation in upcoming sessions.

**The full picture.** Three rounds of restructure that together reshape the main screen:

#### ✅ Part A — Lock shell height, columns scroll independently (SHIPPED)

Desktop only (≥900px). Mobile keeps natural stacking. ~10 lines of CSS in `src/index.css`. Header / Scene / Stone strip / Footer pinned at natural heights; each column gets its own scrollbar. Subtle scrollbar styling (Firefox + WebKit). See BUGS.md #010 for details.

#### Part B — Left column: vertical-rail tabs, Body/Mind as default

Replace stacked cards (Inventory + Buildings trigger + Crafts trigger + Spells trigger) with a **vertical tab rail** along the left edge of the column. Three tabs:

- **Body & Mind** (default, primary) — moves `SurvivalBars` out of the center column and into a dedicated tab here. All 7 stat bars (Hunger, Thirst, Energy, HP, Resolve, Sanity, Spirit) plus the Defense indicator live here. Frees up the center column to focus on actions.
- **Skills** — *migrates from the right column to the left.* Currently `SkillsPanel` is a tab inside `RightColumn`; moves to its own left tab with the same content (skill bars + level + XP curve).
- **Inventory** — current `InventoryPanel.jsx` content (categorized + collapsible). Becomes secondary, not primary.

**Vertical rail orientation.** Tabs stack along the LEFT edge of the column, top to bottom. Each tab is icon-only in its collapsed state with a subtle 32px-wide rail. **Hover or focus expands the rail** outward to show the label ("Body & Mind", "Skills", "Inventory") via CSS transition. Click switches the active tab. Icons:

- Body & Mind — ❤️ or 🫀 (heart) or a custom stat-bars-icon
- Skills — 📊 or skill-meter bar icon
- Inventory — 🎒 or a generic-item icon

This pattern is borrowed from VS Code's activity bar and Discord's server rail. Compact when not in use; reveals identity on hover.

**Right column simplifies.** Removes the Skills tab. Remaining tabs: **Recent**, **Unlocks**, **Stats** (Stats still gated behind first prestige). Three tabs is the right count for the right side; the left getting Skills balances things out.

**Buildings trigger.** Stays as a card or button OUTSIDE the tab system — could live below the vertical rail, or in the Body & Mind tab as a small footer link. Decision pending. Tree-modal UX is its own beast.

**Tools and Arcane:** previous design had them as left tabs, but with Body/Mind as the main tab, the user is shifting that — Tools and Arcane likely live in a **new actions-row UX** (see Part C below) rather than as inventory-tier tabs. Or they get a "Spells" / "Crafting" tab here on the left. **Decision pending.**

#### Part C — Action buttons unified + footer becomes the action strip

The current footer holds the **Reset run / Channel the Rock** button. The current center action panel holds **Gather, Hunt, Eat, Drink, Rest, Ritual**. The user wants these swapped/reorganized:

**Channel the Rock moves into the Stone strip area.** Visually inline with the stone (same row, right side of the strip). Stays purple/awaken-styled to feel like the rock's own action. Pre-prestige-unlock it's hidden; post-unlock it appears next to "The Stone — Awakened" status.

**The footer (where Channel the Rock used to be) becomes the action strip.** All player actions land here in one uniform row:

```
[ Gather ] [ Hunt ] [ Eat ▾ ] [ Drink ▾ ] [ Rest ] [ Ritual ▾ ]
```

- **All same size, same primary color.** No more big primary Gather + smaller secondaries. The action strip is the player's main interaction surface — everything here is equal.
- **Cooldown bars** still render under Gather and Hunt as today.
- **Eat / Drink / Ritual are dropdowns.** Eat already has preference selection via `EatButton`. Drink and Ritual extend the same pattern.

**Why this matters.** Gathering, hunting, eating, drinking, resting, ritual are all *core actions*. Today the visual hierarchy says "Gather is THE action, everything else is secondary." That made sense when there was only one main action. Now there are six — they deserve equal weight.

#### Part D — Drink dropdown + water tier system

See the separate "**Water tiers + dysentery**" planning entry below — this is the content design that gives the Drink dropdown its options.

#### Part E — Ritual dropdown

The Ritual action will eventually offer multiple ritual recipes:

- **Ritual of Stillness** (current default) — 1 fragment + 2 water → +30 Spirit + 3 sanity
- *future* **Ritual of Mending** — fragments + food + water → larger HP heal
- *future* **Ritual of Binding** — fragments + ??? → temporary protective ward (longer than Banish)
- *future* **Ritual of Speaking** — fragments + ??? → forces a specific event/NPC to appear
- Each new ritual unlocked by a research node, costs specific resources, gives specific effect.

Dropdown surfaces all unlocked rituals — same pattern as Eat preferences.

#### Implementation order (proposed)

1. ~~**Part A** — height-lock + column scrollbars (DONE)~~
2. **Part B — left column tabs + Skills migration**. New `LeftColumn.jsx` wrapper, vertical rail with hover-expand, three tabs. Move SurvivalBars import from ActionPanel to a new `BodyMindTab.jsx`. Move SkillsPanel from RightColumn into LeftColumn. Wire up unlock conditions per tab.
3. **Part C — action strip relocation**. Move action buttons out of ActionPanel into a new footer `ActionStrip.jsx`. Standardize button styling. Move Channel the Rock into StonePanel.
4. **Part D — water tiers + dysentery** (content design — separate planning entry below). Adds dropdown options for Drink.
5. **Part E — ritual dropdown** (content design — needs more rituals authored before the dropdown is meaningful).

Each step builds on the previous. B is the biggest single change; C piggybacks once the layout has the new shape; D + E are content/system additions on top.

**Open questions:**
- Where does **Buildings** go? Below the left rail? In Body & Mind tab as a footer? Or its own (4th) tab?
- Where do **Tools** and **Arcane** go? As left tabs, or inline in the action strip's dropdowns somehow? Probably tabs — the Tools panel needs more room than a dropdown.
- Does the left rail also host the **Settings gear**? Or stays floating?
- On mobile, vertical rail probably becomes horizontal tabs at the top of the column. Verify it survives the narrow viewport.

**Why all of this matters.** Three-column scroll-locked layout with semantic tab rails is the standard for incremental games at scale (Antimatter Dimensions, NGU Idle, Realm Grinder all use variations of it). The current "stacked cards with mixed action surfaces" pattern works at small content scale but breaks down as systems grow. Fixing the *shape* while we have moderate content is much cheaper than after a year of additions.

---

### Water tiers + dysentery + drink dropdown

**Status.** ✅ Era 1–2 vertical slice **SHIPPED 2026-05.** Stagnant + Muddy + Boiled tiers, full dysentery disease system, Drink dropdown with risk hints, Boil utility, save migration v1→v2. Era 3+ tiers (Filtered / Purified / Beer) still queued — see "open questions" below. Original spec retained verbatim for reference.

**What shipped in the slice:**
- Three water resources (`water_stagnant`, `water_muddy`, `water_boiled`) in `content/resources.js` with `thirstRelief` / `dysenteryChance` / `tier` / `spoilage`. Boiled water doesn't spoil.
- Virtual-water cost helper (`totalWater`, `spendWater`) so existing `cost: { water: N }` data continues to work and drains lowest-tier-first.
- Gathering now yields `water_stagnant`; Water Hole (the renamed Well) produces `water_muddy`.
- New `boiling` research node (Era 1–2, after Cooking) unlocks the `boilWater` action: 1 wood + 1 muddy → 1 boiled at the Fire Pit.
- Full `systems/disease.js` module: dysentery rolls on risky drinks, doubles hunger/thirst drain, -30% gather/hunt yield, slow HP/sanity/spirit/happiness drain, 5–10min duration, chronic compounding. Cured by Mending Word spell, Mending Potion, or fades naturally. Boiled water drunk while sick shortens recovery by 60s.
- `ui/DrinkButton.jsx` dropdown mirroring EatButton: tier rows with ⚠ risk chip, Boil utility row at the bottom when prerequisites met. Preference persists in `settings.drinkPreference`.
- Save migration v1→v2 in `state/save.js`: existing `water` → `water_muddy` if Water Hole built, else `water_stagnant`. Lifetime stats also remapped.
- Events system virtualizes `water` cost (any tier) and grant (lands as muddy).

**Original design captured below (still relevant for Era 3+ extension):**

**The problem.** Right now Water is a single resource. The Well produces it, the Water Skin stores it, Drink consumes it for thirst. Same item from Era 1 to endgame. That's flat: no progression, no consequence, no reason to build the upgrade chain beyond raw throughput.

**The fix.** Water becomes a **tiered resource family**, with each tier unlocked by a building or research milestone. Lower tiers are *available but risky* — they relieve thirst but carry disease risk. Upgrading the water source is real progression.

#### Tier ladder

| Tier | Resource ID | Era unlock | Thirst relief | Dysentery chance | Notes |
|---|---|---|---|---|---|
| Stagnant | `water_stagnant` | Era 1 default (gather/forage) | +20 thirst | ~25% | Replaces base water as starting drink — the ground/puddle option |
| Muddy | `water_muddy` | Era 1 — **Water Hole** building (rename of existing Well?) | +35 thirst | ~10% | First real upgrade — still not clean, but drinkable |
| Boiled | `water_boiled` | Era 2 — **Boiling** research + Fire Pit + cookpot | +50 thirst | ~2% | Process: boil muddy water at fire pit. Costs wood (fuel). |
| Filtered | `water_filtered` | Era 2 — **Filtration** research (charcoal + sand) | +50 thirst | 0% | Cleaner than boiled, no fuel cost per drink, but needs filter media |
| Purified | `water_purified` | Era 3 — **Purification** research (likely arcane-flavored, fragment cost) | +60 thirst + +2 spirit | 0% | Arcane-touched water, faint shimmer |
| Beer | `beer` | Era 3+ — **Brewing** research + grain harvest + brewing vessel (use Alembic?) | +40 thirst + +3 resolve + -1 sanity? | 0% | Trade item for NPCs/companions, mood lift, slight clarity cost |

**The new Well concept.** Possibly rename the existing **Well** building → **Water Hole** to fit the "muddy water" flavor. Or keep Well as the upgrade *from* Water Hole. Decision pending. The progression should feel like: scoop puddle → dig water hole → boil/filter at fire → purify with arcane → brew beer.

#### Dysentery disease mechanic

**Trigger.** Drinking a tier with `dysenteryChance > 0` rolls against that chance. On hit, player gets the `dysentery` status.

**Effects while sick:**
- Passive hunger drain doubled (you can't keep food down)
- Passive thirst drain doubled (fluid loss)
- HP slow drain (~1/min)
- Sanity drain (~0.5/min) — being sick is demoralizing
- Resolve slow drain
- Gather/Hunt success penalty (~−30%) — too weak to forage well
- Visual: 🤢 icon next to HP bar, body class `.body-sick` for tinting

**Duration & recovery:**
- Base duration: ~5–10 minutes real time (tunable)
- Drinking **purified** or **boiled** water during sickness shortens duration by ~1 min per drink
- **Mending Word spell** clears it
- **Mending Tincture** clears it
- Rest while sick doesn't help (sleep doesn't cure dysentery, but doesn't worsen)

**Persistence:** `run.statuses.dysentery = { active: true, startedAt: ts, expiresAt: ts }`. Cleared on prestige.

#### Drink dropdown UX (ties to Layout refactor Part D)

Currently a single **Drink** button. Becomes a dropdown like `EatButton`:

```
[ Drink ▾ ]
  ├── Stagnant Water (×3)   +20 thirst, ⚠ 25% sick
  ├── Muddy Water (×7)      +35 thirst, ⚠ 10% sick
  ├── Boiled Water (×2)     +50 thirst
  └── (locked tiers hidden until unlocked)
```

- Default selection persists in localStorage settings.
- Best-available auto-select unless player overrides.
- Risky tiers get a warning glyph (⚠) and tooltip explaining dysentery chance.
- Locked tiers don't appear at all (clean dropdown).

#### Implementation sketch

1. `src/content/resources.js` — add `water_stagnant`, `water_muddy`, `water_boiled`, `water_filtered`, `water_purified`, `beer` as separate resources. Each gets `category: "drink"`, `thirstRelief`, `dysenteryChance`, optional `secondaryEffects`.
2. `src/content/research.js` — add Boiling, Filtration, Purification, Brewing nodes (Era 2 → Era 3+).
3. `src/content/buildings.js` — confirm or rename Well → Water Hole. New "Boiling Pot" or use Fire Pit + cookpot. Possibly Brewing Vessel separate from Alembic.
4. `src/systems/disease.js` — new module for dysentery (+ future diseases). Handles roll on drink, status setup, tick effects, recovery.
5. `src/systems/survival.js` — Drink action takes a `waterType` param, looks up the resource, applies thirst + rolls disease.
6. `src/ui/DrinkButton.jsx` — new dropdown component mirroring `EatButton`.
7. `src/state/save.js` — migrate existing `water` → `water_stagnant` (or `water_muddy` if Well is built) on load. Add dysentery status defaults.

#### Open questions

- **Which tier replaces "starting water"?** Probably `water_stagnant` is what gathering yields by default, with `water_muddy` arriving once Well/Water Hole is built. Migration of existing saves: assume saved `water` is muddy if Well is built, stagnant otherwise.
- ~~**Well vs. Water Hole naming.**~~ **Decided 2026-05:** *rename* the existing Well → Water Hole (Era 1, muddy water). A later Well building becomes the clean-water upgrade (or rolls into Boiling/Filtration research). Water Hole is more early-Era-1-flavored, Well sounds advanced.
- **Spoilage.** Should stagnant/muddy water spoil faster? Probably yes — adds pressure to upgrade. Boiled/filtered/purified water stable.
- **Beer's sanity trade-off.** Tunable. Could be a cute neutral resource, or a real mood lift with a side effect.
- **Disease severity scaling.** Should chronic dysentery (re-sickening before recovery) compound? Probably yes — repeated risky drinks should hurt more.

**Why this matters.** Today the only difference between Era 1 and Era 3 player water management is *how much* — same item, more of it. Tiering water turns drinking into a recurring decision: "I'm out of boiled and I'm parched — do I risk the muddy?" Plus dysentery is the first **disease system** which unlocks a whole vector (other illnesses: infected wound, exposure, food poisoning…) for future eras.

---

### Era 1 polish — bird tiering & grub birds

The current Hunt mechanic catches generic "Bird Meat" with the Net. Per design feedback, **hunting should tier by tool** so progression scales hunting alongside everything else.

**New content shape:**
- **Grub Bird** — mutated, flightless bird that eats grubs. The ONLY bird the Net can catch. Drops "Grub Bird Meat."
- **Grub Bird Meat** — food, **nutrition: 10** (capped low — survival food, like grubs). Replaces the current generic Bird Meat in early game.
- **Bow unlocks higher-tier birds** — at Era 2 when Bow is crafted, Hunt rolls against a different table with better birds (Carrion Hawk etc.). Bigger nutrition, more feathers.

**Implementation sketch:**
- `src/content/huntTable.js` — split pool by which tool the player owns. Net: only grub birds. Bow: real birds added.
- `src/content/resources.js` — rename `bird_meat` → `grub_bird_meat`, set `nutrition: 10`. Add `hawk_meat: { nutrition: 25 }` (or similar) for Bow tier.
- Migration in `src/state/save.js` `migrate()` — existing saves with `bird_meat` rename to `grub_bird_meat` on load.

**Why this matters.** Tying yields to the *tool owned* makes every tool craft *feel* like an upgrade. The tool's existence changes what the world offers.

---

### Era 1 polish — shelter-tier rest

Rest currently gives positive returns even with no shelter. Per design feedback, **sleeping on the cold ground should punish you**; each shelter upgrade should improve the payoff.

**Design (proposed):**

| Sleep location | Energy gain | Hunger penalty | Thirst penalty | Sanity gain | Resolve gain |
|---|---|---|---|---|---|
| Bare ground (no hut) | +10 | +5 hunger | +5 thirst | -2 | 0 |
| Hut | +30 | +3 hunger | +3 thirst | +1 | +3 |
| Hut + Fire Pit | +50 | +2 hunger | +2 thirst | +2 | +3 |
| Home | +60 | +1 hunger | +1 thirst | +3 | +5 |
| Home + future upgrades | +70+ | 0 | 0 | +4 | +6 |

**Wired now (partial).** Rest already reads `bonusFromBuilding.firepit` and Home `restBonus`. The "punishing without shelter" half doesn't exist — bare-ground rest still gives flat energy. Fix: extend `performSurvivalAction("rest")` to derive a shelter tier from `state.run.built` and apply the matching effect set.

---

### Era 2 → 3 transition — Home tab + Stone Altar

When the **Home** building is up, a new **Home tab** appears on the main UI. Distinct from the Buildings tree (settlement, outward) — Home is the *interior, personal* progression space.

**Home tab contents:**
- **Forge area** — interior alternative to the standalone Forge building (decision pending — does this replace, or sit alongside?)
- **Alchemy bench** — Era 3 interior, unlocks alchemy at home
- **Hunting trophies wall** — cosmetic / passive bonus
- **Library/study** — research speed bonus
- **Bedroom upgrade** — ties into shelter-tier rest design above
- **Stone Altar** — the centerpiece

**Stone Altar.** Very expensive Home interior (~200 stone + 100 wood + 20 fragments — meant to drain Era 2 reserves and signal "you're ready for Era 3"). Starts as a basic pedestal. As milestones land, etchings appear automatically: a home etched (Home built), blacksmith icons (N tools crafted), hunting marks (Hunting Lv X), an eye etched (rock awakened), eldritch glyph (arcaneAwakening learned), etc. **Visual record of the player's run** — they pass it every time they visit their Home tab.

**Long-arc tie-in.** The altar is where fragments are eventually offered. Era 3+ rituals/spells cast at higher power when the altar exists. Physical manifestation of the rock-as-connective-tissue insight.

**Implementation sketch:**
- New top-level UI element — **Home tab.** Fourth right-column tab OR a new trigger card next to Buildings. Decision pending.
- New content type: `src/content/homeUpgrades.js` (or extend buildings with `category: "home-interior"`).
- Stone Altar etchings computed from state milestones (pure function, like scene composition). Likely `persistent.altarEtchings` so they survive prestige.

**Why this matters.** Three nested progression layers: Buildings (what you built in the world), Home (what's inside your walls), Altar (what you've become).

---

### Arcane Studies — timed magic study + path subtrees + hidden World Score

**Status.** Design captured 2026-05. Major new system bridging Era 2 → late game. Layered on top of existing Stone's Teachings (which keeps the listen-once model for Era 0–2 fundamentals). The Altar is where deeper magic actually gets *learned*.

**Locked-in decisions (AskUserQuestion 2026-05):**
- **Layered**, not replacing — existing Teachings tree is preserved. Altar is the second, deeper layer.
- **Pause on any active action** — research only progresses while the player is idle. Encourages a "sit at the altar and study" rhythm.

#### The shape of the system

```
Stone's Teachings (existing, Era 0–2)         Arcane Studies (NEW, Era 2+)
─────────────────────────────────             ─────────────────────────────
listen-once at the stone strip                timed study at the Stone Altar
costs resources (wood, water, stone)          costs resources + 1 scroll + 1 ink
fundamentals (fire, knapping, foraging)       deep magic + world-restoration
unlocks tools / buildings                     unlocks spells / boosts / passives
no path / alignment effect                    strong sanity + alignment + world-score effects
```

Player progresses: fundamentals at the stone → build the Stone Altar → start studying paths.

#### New resources

- **Scroll** (`scroll`) — papyrus/parchment. Crafted at the (later) Library or via a survival recipe. Era 2 unlock. Cost: 2 wood + 1 fragment, yields 1 scroll. Stackable consumable. Stored at low cap until storage upgrades.
- **Ink** (`ink`) — pigment. Charred wood + grub fluids, basically. Or feathers + water. Era 2 unlock. Stackable consumable.
- Both are consumed when you *start* a study (not on completion — abandoning a study still costs the materials).

#### New building: Stone Altar

**Cost** (proposed): 80 stone + 40 wood + 5 fragments. Era 2.
**Requires**: `home` built (the altar lives in your home) + a new teaching `altarWork` learned at the stone strip.
**Effect**:
- Unlocks the **Arcane Studies** tab (left rail icon: 📜 or 🕯️).
- Required to start any timed study.
- Small passive sanity trickle (+0.2/min) — being near the altar is calming.
- Long-arc tie-in: Era 3 etchings appear on the altar as study milestones complete (the trophy-wall idea from the Era 2→3 transition entry above).

#### Timed research mechanic

- Each study node carries a `durationMs`. Tier 1 paths: ~2 min. Tier 4+: 10+ min.
- **Multiple in-progress studies allowed.** State: `run.studyProgress = { [nodeId]: { startedAt, accumulatedMs } }`. Each entry holds its own accumulated time forever — they don't expire.
- One study is *active* at a time: `run.activeStudyId`. Only the active one accrues time.
- Switching active study is free — point your attention elsewhere, the previous one freezes exactly where it was. **No time or material loss on switch.**
- Pause-on-action: progress accrues to the active study ONLY while `run.lastActionAt` is older than `IDLE_THRESHOLD_MS` (proposed: 5 s). Any player action — gather, hunt, eat, drink, build, craft, ritual, spell-cast, event-respond — sets `lastActionAt = now`, freezing the clock. **Action-pause is lossless** — come back later, pick up exactly where you left off.
- TICK runs the study advancer: `if (now - lastActionAt > IDLE_THRESHOLD) studyProgress[activeStudyId].accumulatedMs += elapsed`.
- On completion: apply effects, remove the node from `studyProgress`, log a flourish event.
- UI: progress bar(s) on the Altar tab. Tooltip shows "Studying… 04:13 / 12:00 — pauses when you act."
- Starting a study costs 1 scroll + 1 ink (consumed at start, not refunded if you switch away).
- **Abandoning** a study explicitly (Cancel button) discards its accumulated time but refunds nothing — same effect as just never finishing it. Materials were the price of admission; time was free to hold.

#### Seven magic paths (subtrees) — expanded 2026-05

Locked in via AskUserQuestion: **7 total paths**, with **mixed crossover** topology — most nodes are path-specific, but deep / apex nodes require completion across multiple paths. Each path's per-completion delta is locked in `content/studies.js` `STUDY_PATHS` and applied uniformly by performCompleteStudy (#31).

**1. The Light path** — heals, wards, blessings
- *Per completion:* +3 sanity, +1 good alignment
- Example nodes: Greater Mending · Sanctuary · Cleansing Word · Blessing

**2. The Bend path** — drain, curse, dominate
- *Per completion:* −3 sanity, +1 evil alignment
- Example nodes: Greater Bend · Curse · Soulflame · Dominate

**3. The Elemental path** — earth, water, growth, restoration
- *Per completion:* +1 sanity, +1 world score
- Example nodes: Coax Spring · Quicken Growth · Stone Mend · Ash Cleanse

**4. Sigilcraft (Inkwork)** — written magic, persistent enchantments
- *Per completion:* +1 sanity, +0.5 world score
- Example nodes: First Sigil · Binding Mark · (later: enchant unlocks for Combat Phase 6)
- **Foundation node** (First Sigil) gates weapon enchant slots
- Ties: scroll + ink resources, weapon enchants (#37)

**5. Memory (Echo)** — recall lost, restore broken, read past of threats
- *Per completion:* +2 sanity, +0.5 world score
- Example nodes: First Echo · Reading the Past · (later: deep recall, restore-from-rubble)
- Ties: prestige Echo currency lore, threat-stat visibility in combat log

**6. Stoneword (Listening)** — divination, perception, foresight
- *Per completion:* +2 sanity, +0.5 world score
- Example nodes: First Listening · Weakness-Sight · (later: event preview, hidden resource sense)
- Cosmic-horror foresight vibe

**7. Voidcall (Beyond)** — pull from outside the world. APEX-GATED.
- *Per completion:* **−5 sanity, +2 evil, −1 world score** — the world thins where you stand
- Hidden until `alignment.evil ≥ 5` (deep commitment to Bend)
- Example nodes: First Beckoning · (later: open the door, summon beyond)
- The literal cost of evil power — you erode the very world you live in

**Cross-path nodes** sit visually within their "home" path's tree, but their `requires.parents` cross paths. First content examples:
- **Wardweave** (Sigilcraft home) — requires `sanctuary` (Light) + `firstSigil` (Sigilcraft). Grants permanent +2 Armor (Task #39).
- **Ghostcall** (Memory home) — requires `firstEcho` (Memory) + `curse` (Bend). Summons the shade of defeated threats.
- **Truesight** (Stoneword home, tier 4) — requires `weaknessSight` (Stoneword) + `cleansingWord` (Light). +20% combat acc + 10% evasion.

The crossover encourages **build identity**: a "Light + Sigilcraft" player ends up with a different toolkit than "Bend + Memory" or "Elemental + Stoneword."

#### Hidden World Score

The cosmos remembers what you've done for it. Silent counter, no UI display until late thresholds reveal it.

**Contributions (positive):**
- Each Elemental study completion: +1
- Helping an NPC in an event (food/water gifts, "Tend their wounds"): +0.5
- Rituals at the altar: +0.2 per
- Specific lore-laden events: +1 to +3
- A future "restore" mechanic for ruined buildings/lands

**Effects (graduated):**
| Threshold | Effect |
|---|---|
| 5 | Gather rate +5% — the world gives a little more |
| 15 | Garden output +20% |
| 30 | Gathering occasionally yields `water_muddy` instead of `water_stagnant` (~10% of water gathers) |
| 50 | Water Hole production tier promotes — produces `water_boiled` directly |
| 80 | Garden tier promotes — produces higher-tier food |
| 100 | Late-game environmental shift — flavor cue + small reveal that the player understands the meter exists |

Apex effects feed into the Era arc — restoring the world is a real path to Era 4+.

#### Sanity + alignment tie-in

Already wired infrastructure (`run.alignment.good/evil`, `stats.sanity`) — the Studies system just becomes a major new source of those deltas. A balanced player can stay sane by mixing Light and Elemental study; a Dark-heavy player drives Sanity low and starts triggering dread events (existing system).

#### Implementation sketch (rough — needs a real plan when we get to it)

1. **Content data**
   - `src/content/resources.js` — add `scroll`, `ink` (drink-category? craftable-category? new category).
   - `src/content/buildings.js` — add `stoneAltar`.
   - `src/content/research.js` — add a tier-N teaching `altarWork` that unlocks the altar building.
   - `src/content/studies.js` (NEW) — path subtrees, durations, effects. Three top-level path roots, then tier 1–4+ nodes per path.

2. **Systems**
   - `src/systems/studies.js` (NEW) — `canStartStudy`, `performStartStudy`, `performCancelStudy`, `tickStudy`, `getActiveStudy`. The big one.
   - `src/systems/world.js` (NEW) — World Score counter, contribution hooks, effect computation. Pure functions.
   - `src/systems/gathering.js` — read world-score effects (tier promotion for water yields, etc.).
   - `src/systems/passive.js` — read world-score effects for Water Hole / Garden tier promotion.
   - Action-side: every reducer case (`GATHER`, `BUILD`, etc.) needs to write `run.lastActionAt = now` so the studies pause-logic sees activity.

3. **State**
   - `src/state/run.js` — add `activeStudy`, `studiesCompleted`, `lastActionAt`. Add `worldScore` (under persistent? or run? — TBD).
   - `src/state/save.js` — v2 → v3 migration for new fields.

4. **UI**
   - `src/ui/StudiesPanel.jsx` (NEW) — left rail tab when Altar built. Shows active study + path tree picker.
   - `src/ui/StudyTreeModal.jsx` (NEW) — three tabbed trees (Light / Bend / Elemental), each with its own path nodes.
   - `src/ui/Shell.jsx` — wire new tab, surface active-study progress somewhere persistent (maybe in the Stone strip?).
   - `src/ui/LeftColumn.jsx` — add "Studies" tab when Altar built (badge with progress).

5. **Polish**
   - Active study should have a subtle progress indicator visible from the main view (small bar under the stone strip?) so the player feels it ticking.
   - When pause fires (action interrupts), brief visual flicker on the indicator — "you broke focus."
   - Completion event with a flourish: log entry + a brief modal showing what you learned.

#### Open questions

- **Scroll / Ink crafting tier** — at the Crafts panel as a tool recipe (works fine with current system but they're not really tools), or as a new survival action like Boil (more idiomatic), or via the Altar itself ("write a scroll" as an Altar action)?
- **World Score: persistent vs run-local?** Probably run-local — it's *this* world you're restoring; prestige wipes it. But the LIFETIME score could be persistent for echo unlocks.
- **Can you cancel a study?** Proposed: yes, 50% scroll/ink refund. The 50% loss makes the choice feel weighty.
- **Should the active study show in the Stone strip** (replacing/sharing space with the "click to listen" text)? Or only in the Studies tab? The strip-shared version keeps the player aware of progress even when away from the Studies tab.
- **What blocks a study from starting?** Need scroll+ink, need altar built, need the path-root research. Anything else? Maybe "must be at least 50% energy" (study takes focus, exhausted player can't).
- **Pause-clock edge cases.** What about TICK-only changes (passive production)? Probably don't count as "action." Only player-initiated dispatches set `lastActionAt`.
- **Save-migration risk.** v2→v3 needs to gracefully handle existing players who land in a state where the Altar appears as available. Default activeStudy to null, defaults for everything else.

#### Why this matters

This is the *real* magic system. Today's magic is shallow: listen once, cast forever. With Arcane Studies, learning magic becomes a deliberate activity — the player chooses where to spend their attention. The three paths give the alignment system its first major *gameplay* hook (instead of being a silent score that occasionally surfaces a different event). The World Score gives positive-aligned players a tangible progression path (currently they get sanity stability and not much else). And the timed mechanic encourages a play rhythm: bursts of activity, then sit at the altar and study while you breathe.

The whole system fits the "stone teaches" arc — the basic teachings come quick because the stone whispers them. The deep magic takes time because *you* are doing the work now.

---

### Combat + Weapons + Specialized Skills (RPG layer)

**Status.** Design captured 2026-05. Era 2+ rollout, multi-session. The game has had skeletal combat (threats during gathering) and one tool-shaped weapon (Bone Knife) — this turns it into an actual RPG layer.

**Locked-in decisions (AskUserQuestion 2026-05):**
- **Combat resolution: passive with rich log.** No modal interruption. Encounters resolve automatically based on weapon + stats + level. The log narrates the fight as 3–6 lines instead of 1. Idle-friendly. (Boss fights might get a modal later — TBD.)
- **Weapons: equipped slot with progression.** ONE active weapon (later main + off-hand + ranged). Weapon has level + durability + enchant slots. Crafting CREATES the instance; using it builds skill + weapon level. Inventory shows weapons as cards, not counts.
- **Skills: both (Era-gated).** Era 0–1 keeps the single Gather button. Era 2+ unlocks specialized action buttons (Chop, Mine, Forage) as the appropriate tool is crafted. Generic Gather stays as fallback.

#### Player battle stats

Existing: `HP`, `defense` (from buildings/research). Adding:

| Stat | Source | Notes |
|---|---|---|
| `atk_melee` | weapon damage + swordplay skill | base damage roll |
| `atk_ranged` | ranged weapon + archery skill | base damage roll |
| `atk_magic` | spell power + Arcane completions | for the magic-combat path |
| `acc` | weapon + skill | % chance to hit |
| `eva` | future agility stat / armor | % chance to dodge |
| `crit` | weapon enchants + skill | crit chance + multiplier |
| `init` | future speed stat | turn order (matters more if we add bosses) |

v1 ships with HP, defense, atk_melee/atk_ranged, acc, eva. Crit and init can come later.

#### Combat resolution loop

When a threat fires during a player action (gather/hunt/etc.):

1. **Initiative.** Usually player first; ambush threats go first. Surprise tag on the encounter.
2. **Round.** Each round, both sides take a turn. Player's turn picks the best applicable equipped weapon (auto). Threat picks its attack from its def.
3. **Hit check.** Roll `acc - eva`. If hit, roll damage `[lo, hi]` with weapon variance, subtract target defense, apply HP delta.
4. **Log.** Rich narration — "You raise the spear. The first jab grazes. The second sinks deep. The hound stumbles." Lots of variety from a template pool keyed off (weapon, threat, outcome).
5. **End conditions.** One side at 0 HP, or player flees (escape % from threat tier + agility). Death at HP 0 is a run end (existing flow).

The fight log gets its own kind in the log (e.g. `combat`) and the UI can group consecutive combat lines visually.

#### Threat tiering

Existing: `birdFlock` pest + a few gather-roll threats. Build out:

- **Tier 1 (Era 1):** scavenger animals — wild dogs, scarab swarms. Low HP, low damage.
- **Tier 2 (Era 2):** raiders, larger predators, sandstorm beasts. Real threats — punish unarmed players.
- **Tier 3 (Era 3):** corrupted things, demons, abyssal predators. Magical defense matters.
- **Bosses (era-end milestones):** named encounters. Might warrant a modal — decision deferred.

Threat defs live in `src/content/threats.js` (new — split from events). Roster: HP, damage, attack pool (multiple attacks per threat), tags (ambush / fleeable / etc.), spawn weight by era.

#### Weapons — equipped slot with progression

**State shape:**
```js
run.equipped = {
  melee:  { id: "bronzeSword", level: 3, xp: 18, durability: 42, enchants: [] },
  ranged: { id: "bow",         level: 5, xp: 7,  durability: 51, enchants: [] },
  // future: offhand, focus (spell amplifier), armor
}
```

**Weapon defs** (in `src/content/weapons.js` — new file, distinct from `tools.js`):
- `id`, `name`, `icon`, `category` (primitive/bronze/iron/arcane), `type` (melee/ranged)
- `cost` (craft cost), `requires` (research / building / skill gates)
- `damage: [min, max]`, `acc: 0.0–1.0`, `crit`, `weight` (affects fatigue?)
- `durability: { max, wearsOn: "combat" }` — durability ticks on each fight, not on each turn
- `xpToLevel: [n1, n2, ...]` — XP needed per level
- `enchantSlots: 0/1/2/3`
- `levelBonus: { damage: +1/lvl, crit: +0.01/lvl }` — what leveling actually does

**Crafting flow:**
- Same Tools/Crafts panel surfaces weapons (or split into a Weapons subtab).
- Crafting a weapon you don't have CREATES the instance, slots it as the active weapon for its type (or holds it in inventory if you already have one equipped).
- Better weapons OVERWRITE older ones when equipped — old instance can stay in inventory ("rusty stone axe") for sentimental value, or auto-melt for partial refund.

**Wear:**
- Each completed fight ticks `durability -= 1`. (Or each hit landed — tunable.)
- At 0 durability the weapon breaks (existing tool breakage logic generalized).

#### Enchants (Era 3+, ties to Arcane Studies)

After Arcane Studies (Bend / Light / Elemental paths) lands:
- Each weapon level grants enchant slots (1 at lvl 3, 2 at lvl 6, 3 at lvl 9).
- Enchants are unlocked as Arcane Studies completions:
  - **Fire-bite** (Bend) — +3 damage, 20% chance to apply burn (HP drain over time)
  - **Drain** (Bend) — heal 25% of damage dealt
  - **Truesight** (Light) — +15% accuracy, ignores eva
  - **Wardstrike** (Light) — chance to apply Soothe to self on hit
  - **Earthcall** (Elemental) — +1 stone on kill (the world remembers)
  - **Verdant** (Elemental) — chance for kill to spawn a `food` resource at corpse
- Applied via an Altar UI: "embed enchant into weapon" — consumes fragments + the enchant rune (a new resource? or just from completed studies?).

#### Specialized gather actions (Era 2+ unlock)

Era 0–1 keeps a single Gather button. Once Era 2+ and the right tool is owned, *additional* action buttons appear in the strip or as a dropdown:

| Action | Tool required | Yields | Skill |
|---|---|---|---|
| **Chop** | Stone Axe / Bronze Axe / Iron Axe | wood (heavy weight), occasional rare wood tiers | `woodcutting` |
| **Mine** | Stone Pickaxe / Bronze Pickaxe / Iron Pickaxe | stone (heavy), `iron_ore` (new), `coal` (new) | `mining` |
| **Forage** | Digging Stick / better foraging tools | food (varied tiers), `herbs` (new), `mushrooms` (new) | `foraging` (existing) |
| **Fish** (Era 3+) | Fishing Spear / Net Rod | new `fish` resource tiers | `fishing` (new) |
| Generic **Gather** | none required | mixed table (current behavior) | `foraging` |

Each specialized action has:
- Its own cooldown (slightly shorter than generic Gather since it's more focused)
- Its own skill XP track
- Tool durability cost (already exists)
- A clear "I'm choosing what to do" feel

#### Skill expansion

Existing skills (in `src/content/skills.js`): foraging, hunting, crafting, building. Adding:

- `mining` — XP from Mine
- `woodcutting` — XP from Chop
- `fletching` — XP from crafting ranged weapons + arrows
- `smithing` — XP from crafting metal weapons (Era 2+), boosts forge output
- `swordplay` — XP from winning melee fights
- `archery` — XP from winning ranged fights
- `magicCombat` — XP from defeating threats with spells
- `combat` (parent) — could be a derived stat showing overall combat readiness, vs splitting into the three above. Decision pending.

Each skill levels via existing XP curve (in `skills.js`). Level adds to that skill's relevant stat.

#### Iron ore + coal + new resources

Mining gives access to a new resource ladder, parallel to water tiers:

- `iron_ore` — Era 2 mining, requires Pickaxe
- `coal` — Era 2 mining, fuel for the Forge (currently Forge uses wood; coal is more efficient)
- `iron_ingot` — smithing recipe (1 iron_ore + 1 coal at forge → 1 iron_ingot)
- `steel_ingot` — Era 3 advanced smithing
- `herbs` / `mushrooms` — Era 2 forage, alchemy reagents
- `arrow` — Era 2 fletching consumable (used by bow per shot)

#### City Management (Era 4+, distant future)

Mentioned by player as a future direction. Captured here for visibility but **NOT planned in detail yet**.

Sketch: Late Era 3 / Era 4 NPCs settle in the wasteland near the player. Each villager has a specialty (woodcutter / miner / smith / farmer / scholar / guard). Player assigns roles. Villagers auto-produce in the background (their own passive layer) but need housing + food + water. Trade economy emerges. Defensive needs increase — raids on the village.

This connects back to **defense + walls** (existing buildings) and the **threat tier expansion** above — late-game threats are raids on your village, not just personal encounters.

Real design pass for City Management happens after Era 3 magic + combat are solid.

#### Implementation phasing (multi-session)

These are PHASES, not session-fitting tasks — each phase is itself multi-session.

**Phase 1 — Equipped weapon foundation**
- `run.equipped` state + reducer cases (EQUIP_WEAPON, UNEQUIP_WEAPON)
- `content/weapons.js` with tier-1 weapons (Wooden Club, Stone Spear, Stone Mace)
- Weapon UI in Tools panel (or new Weapons subtab) — shows currently equipped + inventory of weapons
- Existing Bone Knife / Bow stay as "hybrid tools" — tag with `weaponStats` so they count when equipped to their slot

**Phase 2 — Combat resolution upgrade**
- New `systems/combat.js` — fight loop, hit/damage math, log narration
- `content/threats.js` (split from events) — tiered threat roster
- Rich combat log lines + UI grouping of consecutive combat events
- Death-by-combat path (already exists conceptually as HP=0, just needs better death narration)

**Phase 3 — Weapon progression**
- Weapon level/XP from kills
- Combat skill tracks (swordplay, archery)
- Weapon-level bonuses applied in combat resolution

**Phase 4 — Specialized gather actions**
- New action types: CHOP, MINE, FORAGE (refinement of GATHER)
- Tool gating in ActionStrip / left rail
- New skills (mining, woodcutting, fletching)
- New resources: iron_ore, coal, herbs, mushrooms, arrows

**Phase 5 — Iron tier + smithing**
- Iron_ingot crafting at Forge
- Iron-tier weapons (Iron Sword, Iron Pickaxe, etc.) replacing bronze stones
- Smithing skill XP
- New buildings: Anvil? Smelter? Or extend Forge.

**Phase 6 — Enchants + magical weapons (after Arcane Studies)**
- Weapon enchant slots populated from Arcane Studies completions
- New Altar UI for enchant application
- Magical weapon archetype (Arcane Blade, Phantom Bow)

**Phase 7 — City Management** (deferred)
- Villager NPCs with specialties
- Village-level threats (raids)
- Resource economy

#### Locked-in decisions (continued, 2026-05)

- **Dual-use tools/weapons: yes, with subfamily pattern.** A wood-cutting axe and a battle axe are the *same family* (axe → swordplay XP, axe-skill effects) but split into subfamilies with different stat distributions:
  - **Hatchet** — big `woodBonus`, modest `damage`. Tool-leaning.
  - **Battle Axe** — big `damage`, modest `woodBonus` (or none). Weapon-leaning.
  - Same skill (`swordplay` for melee combat, `woodcutting` for wood yield). Same gathering button (Chop). Same combat resolution.
  - Player can equip a pickaxe as their weapon — it'll work, but the math will tell them why that was a bad idea.
  - Pattern extends: **Cooking Knife** vs **Dagger** (foodBonus vs damage). **Spike Pickaxe** vs **War Pick**. **Pruning Hook** vs **Sickle**. Each pair: same family, same skill, different emphasis.
  - The system *invites* identity: "I'm a builder who picks up the hatchet to defend my home" reads in the math, not just in flavor.

- **Two defense stats.** They live separately:
  - `armor` (NEW) — **personal damage reduction in combat.** Applies when threats attack the player. Sources: armor crafts (later), Light-path enchants, body-related buildings/research.
  - `defense` (existing) — **settlement / home / city defense.** Applies when threats attack your *structures* (raids, food theft, future village raids). Sources: walls, vigilance, future city upgrades. Keep the existing meaning intact; just stop using it for personal combat.
  - Rename in code? Probably keep `defense` for the settlement meaning (existing data files use it). New `armor` field on stats. No retroactive migration needed.

- **Boss fights: turn-based modal.** Locked. Each boss is meant to be *epically hard at first* — the player has to grind weapon/skill levels and farm resources before they can credibly challenge it. Bosses gate progression:
  - **Per era: at least 1 mini-boss + 1 main boss.** The main boss completion advances era unlocks (or unlocks a Stone teaching that does).
  - **Elemental bosses** (Era 3+): one boss per elemental type the player has introduced via Arcane Studies. Defeating each unlocks deeper power in that path.
  - **Apex / world bosses**: gate ultimate progression. Defeating one feels like "the stone opens further" — a real ceremonial moment, big log lines, milestones earned.
  - Modal UI: turn-based combat with attack/spell/item/defend/flee. Reuses the same combat resolution math as passive fights, just exposed turn-by-turn.

- **Stat damage + targeted recovery.** Locked. HP loss in combat is no longer the only injury type:
  - Different threats deal different **damage profiles**: a horror creature drains `sanity`; a corrupted thing drains `spirit`; a brute deals straight HP and `energy`/`strength` damage; a venomous thing might apply lingering hunger/thirst drain.
  - Stats stay damaged until the player consumes the matching recovery item type. Rest alone doesn't fix everything anymore.
  - Recovery profile table (proposed):

  | Stat | Damaged by | Recovers via |
  |---|---|---|
  | `hp` | physical attacks | Mending Potion, bird_meat, rest+firepit |
  | `sanity` | horror / dark threats | Stillness Potion, Soothe spell, Light-path study, rest at home |
  | `spirit` | arcane / corrupted threats | Spirit Draught, Ritual, time at altar |
  | `energy` | exhausting fights | Rest, sleep at shelter tier |
  | `strength` (NEW?) | brute physical combat | Protein foods (bird_meat, future fish/jerky), Mending |
  | `hunger` | starve-tagged enemies | any food |
  | `thirst` | parch-tagged enemies | any water (the post-Part-D ladder) |

  - This is the moral force of the spec: **food types matter** because they recover different things. Bird meat isn't just better nutrition — it's the only thing that builds your `strength` back.
  - Open: do we add `strength` as a NEW stat, or fold it into existing `energy`? See open questions.

#### Open design questions

- **Hunt action vs weapon-driven combat.** Today's Hunt button uses tools (net/snare/bow) for bird hunting. With weapons-as-slots, does Hunt become a wrapper around "use my ranged weapon on flying threats"? Probably yes — Hunt becomes Hunt-with-ranged. A melee weapon in the slot doesn't unlock Hunt.
- **Magic vs weapon dichotomy.** Should a magic-heavy player still need a weapon for the threats their spells can't handle? Probably yes — even the wisest scholar needs a knife. So weapons are universal, magic is additive.
- **`strength` as a new stat?** The stat-damage system reads naturally with it: brute combat drains strength, protein recovers it. But it adds an 8th stat to the survival panel. Alternative: fold it into `energy` (combat exhausts you, protein restores energy faster than carbs). Decision deferred to combat Phase 2/3.
- **Boss content density.** Locked: ≥1 mini-boss + ≥1 main boss per era. Plus elemental bosses Era 3+. That's a lot of named content to author. Sketch the boss roster early so we can pace the rest of the work toward it.
- **Boss death = run-end?** If a boss kills you, is it just normal HP=0 (run reset) or does it have something gentler — partial penalty, retry with stats kept? The latter respects the grind. Decision: probably retry-friendly (boss death = wake at home with stat damage, no run reset), but the player chooses to attempt the boss knowing the risk.
- **Subfamily naming.** "Hatchet vs Battle Axe" reads well. "Cooking Knife vs Dagger" is fine. Some pairs are awkward — "Spike Pickaxe" feels invented; mining-pick + warpick maybe? Author them deliberately when Phase 1 lands.

#### Why this matters

Today's combat is two emoji and a log line. With this expansion, fighting a wild dog becomes a *moment*: you see your bronze sword level up after the kill, your swordplay skill nudge forward, the threat description's flavor read true to your weapon ("you grip the haft and swing — the dog yelps"). It's the difference between a number going up and a sword learning its work.

Specialized gather actions transform Era 2+ from "press Gather over and over" to "I should chop more wood for the smith — do I have time to mine iron first?" Each action a choice with weight.

And combining these with Arcane Studies + World Score, the late game becomes about *what kind of player you are*: scholar with a knife, warrior with a censer, restorer with a hammer. Mechanics support identity.

---

### Character page + Crafting page (full-body UI restructure)

**Status.** Design captured 2026-05. Major UI restructure plus the combat-stats expansion. Era 2+ feature — comes online once weapons land.

**The shape.** Two new "full-page" tabs appear in the existing left rail. When clicked, the **main body** of the screen swaps from the default World panel to the selected page. The Header / Scene / Stone strip / Footer / Right column stay where they are. The center column hosts whatever page is active.

```
┌─────────────────────────────────────────────────────┐
│ Header (Lithos · era)                               │
├─────────────────────────────────────────────────────┤
│ Scene (always visible)                              │
├──┬───────────────────────────────────────┬──────────┤
│ R│                                       │ Right    │
│ a│  CENTER COLUMN — view-switched:       │ column   │
│ i│   • "world" (default ActionPanel)     │ Recent   │
│ l│   • "character"  (new)                │ Unlocks  │
│  │   • "crafting"   (new)                │ Stats    │
│  │   • future: "studies", "altar", etc.  │          │
├──┴───────────────────────────────────────┴──────────┤
│ StonePanel                                          │
│ ActionStrip                                         │
└─────────────────────────────────────────────────────┘
```

Architecture: Shell.jsx grows a `view` state (default "world"). LeftColumn's rail tabs come in two flavors now:
- **Compact tabs** (current behavior) — content renders in the small content pane next to the rail (Skills lives here, etc.).
- **Full-page tabs** (new) — clicking sets `view` and replaces the center column. Click again or hit a Back button to return to "world."

The Body & Mind tab from Part B is **absorbed into the Character page** and retired from the rail — its content (survival bars) becomes one of the panels inside Character.

#### Character page detailed layout

Three panels side by side, then equipment slots, then equipment inventory at the bottom.

```
╭─ Survival ──╮ ╭─ Bridge ─╮ ╭─ Combat ────╮
│ HP     80   │ │  STR 12  │ │ DEX     8   │
│ Hunger 40   │ │  ↕ ↕ ↕   │ │ SPD     6   │
│ Thirst 55   │ │          │ │ MAG     3   │
│ Energy 72   │ │          │ │ Mana   25   │
│ Happy  60   │ │          │ │ Armor   4   │
│ Sanity 50   │ │          │ │             │
│ Spirit 50   │ │          │ │             │
╰─────────────╯ ╰──────────╯ ╰─────────────╯

EQUIPPED
[Melee][Ranged][Offhand][Focus][Body][Head][Charm]

╭─ Inventory ───────────────────────────────────────╮
│ [All] [Weapons] [Defense] [Herbs] [Magic] [Other] │
│   └─ sub: [Melee] [Ranged] [Throwing]             │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                     │
│ │ 🗡 │ │ 🏹 │ │ 🍞 │ │ 🩹 │ │... │ ← grid of items │
│ └───┘ └───┘ └───┘ └───┘ └───┘                     │
╰───────────────────────────────────────────────────╯
```

**STR sits visually in the middle** because it's the bridge between Survival and Combat — protein recovery in Survival, melee damage scaling in Combat.

#### New combat stats (locked)

| Stat | Display | Bridges to | Sources |
|---|---|---|---|
| `strength` | STR | survival (protein recovery, carry cap) AND combat (melee damage) | training (swordplay XP), gear, food-based growth |
| `dexterity` | DEX | combat (ranged damage, accuracy, evasion) | archery skill, gear |
| `speed` | SPD | combat (initiative, action cooldowns) | echoes, gear, future agility training |
| `magic` | MAG | combat (spell damage) | Arcane Studies completions, gear |
| `mana` | Mana | combat (spell resource) | regenerates over time, refilled by rest / draught / altar |
| `armor` | Armor | combat (flat damage reduction) | armor crafts, Light-path enchants |

**Existing stats stay** (HP, hunger, thirst, energy, happiness, sanity, spirit). The Character page just shows them next to the new combat stats.

**Open: Spirit vs Mana naming.** Currently spells cost `spirit`. Two options:
- A) **Rename** the displayed text from "Spirit" to "Mana" — data key stays `spirit`. Spell costs read clean ("Mana 15"). Clean.
- B) **Two separate stats** — Spirit (willpower for rituals + sanity-adjacent) and Mana (spell fuel). Adds complexity; might feel redundant.

Default: **Option A**, lock in Phase 1 of this work. Flag for revisit if a real differentiation emerges.

#### Equipment slots (locked: equipped-slot pattern)

Initial slot set:
- **Melee** — primary close-range weapon
- **Ranged** — bow / throwing
- **Offhand** — shield, dagger, or focus
- **Focus** (Era 3+, ties to Arcane Studies) — spell amplifier
- **Body** — armor (Era 2+)
- **Head** — helmet / circlet / hood
- **Charm** — accessory slot with passive bonuses

Each slot reads from `run.equipped[slot]`. Stat math sums across slots. Empty slots: no effect.

#### Tooltip comparison

Hover any item in the equipment inventory → tooltip shows:
- The candidate item's full stats
- The currently equipped item in the same slot (if any)
- Diff per stat, color-coded (green for better, red for worse, gray for unchanged)

Pure function: `compareItems(equipped, candidate, statKeys)` returns the deltas. Tooltip component renders them.

Example:
```
┌─ Bronze Sword ───────────────────┐
│ Damage:  8–14    (+2 → +6 over)  │
│ Crit:    5%      (+2%)           │
│ Acc:     92%     (no change)     │
│ Lvl:     1                       │
│ Durab:   50 / 50                 │
│ ──────────                       │
│ Currently: Stone Mace            │
│   Damage: 6–8                    │
│   Crit:   3%                     │
└──────────────────────────────────┘
```

#### Item inventory: two-level tab nav

**Top tabs** (left-to-right): All / Weapons / Defense / Herbs / Magic Items / Tools / Crafting Materials / Other.
**Sub-tabs** (within each top tab, left-rail style on the side of the inventory): finer subtypes.
- Under Weapons: Melee / Ranged / Throwing / Magic Foci
- Under Defense: Body / Head / Charms / Shields
- Under Herbs: Healing / Magical / Cooking
- Under Magic Items: Scrolls / Potions / Enchants / Runes

Each tab shows the relevant inventory items as a *grid of cards* (not a list). Each card: icon, name, count, durability bar (for gear), and an "equip" button if appropriate.

#### Crafting page (mirrors structure)

Same full-page takeover pattern. Sub-tabbed by craft family:
- **Blacksmithing** — visible after `smithing` research. Metal weapons, armor, tools.
- **Alchemy** — visible after `alchemy` research. Potions, scrolls, ink, enchant materials.
- **Fletching** — visible after `fletching` research. Bows, arrows, ranged weapons.
- **Farming** — visible after `farming` (new) research. Seeds, growth treatments, garden expansion.
- **Woodworking** — visible after a new `woodworking` research. Wooden weapons, building parts, tools.
- **Tailoring** (Era 3+) — clothing/armor.

Each subtab shows that family's recipes as a tree (or list — TBD whether trees stay or flatten here). The current ToolsModal contents distribute across these subtabs.

#### Migration / what gets retired

- **Body & Mind tab** in the left rail → absorbed into Character page's Survival panel. Tab removed.
- **Inventory tab** in the left rail → absorbed into Character page bottom. Tab removed (or kept as compact-glance only — TBD).
- **Tools / Crafts** trigger card / modal → becomes Crafting page. Modal removed.
- **Right column** stays unchanged when in any view (always shows Recent / Unlocks / Stats — useful at all times).

Existing rail tabs that **stay**:
- **Skills** — still a compact tab (skill bars are small + frequently checked, no need for takeover)
- **Buildings** — still a trigger card opening the Buildings tree modal (the tree modal is its own thing, no need to fold into a page)
- **Arcane** — still a trigger card → SpellsModal (similar reasoning)
- **Studies** (future, after Arcane Studies ships) — maybe full-page eventually

New full-page tabs in the rail:
- **🧑 Character** — the page above
- **🔨 Crafting** — the page above

#### Implementation phasing

This is multi-session. Roughly:

**Phase A — View architecture.** Shell.jsx gains the `view` state. LeftColumn supports full-page tabs that dispatch view changes. Add a back button / breadcrumb. No new content — just plumb the routing.

**Phase B — Character page (read-only first).** Render the Survival + Combat + Equipment slots layout. Combat stats start at fixed values (no actual modifiers yet). Equipment slots show currently-equipped items from `run.equipped`. No editing.

**Phase C — Equipment inventory grid + equip/unequip.** Bottom panel with tab nav. Item cards. Equip/unequip wired through reducer. Visible equipment slots update.

**Phase D — Tooltip comparison engine.** Hover deltas, color-coded.

**Phase E — Combat stats actually modulate combat.** Wires into Combat Phase 2/3 work. STR adds to melee damage. DEX adds to ranged + accuracy. MAG adds to spell damage. SPD reduces cooldowns. Armor reduces incoming damage.

**Phase F — Crafting page.** Full-page takeover, sub-tabbed by family. Migrate current Tools/Crafts content into the appropriate subtabs. Each subtab visible when its gating research is done.

**Phase G — Polish.** Animations on tab switch, item card hover states, equip/unequip flourishes.

#### Locked-in decisions (continued, 2026-05)

- **Spirit, not Mana.** Locked. Spirit and Mana are semantically the same — the existing `spirit` stat IS the spell resource. Keep the name "Spirit" everywhere in the UI; no rename. The combat-stats table reads "Spirit" not "Mana." Done.

- **Skills accessible from Character page.** Locked. The existing Skills rail tab stays compact AND Skills are reachable from inside the Character page (probably as a tab/section — e.g. the Character page has a small Skills card or a sub-tab strip alongside Equipment Inventory). Either way: one click from the character view to see your skill levels.

- **Right column stays visible** when Character/Crafting is open. Locked. Recent log + Unlocks + Stats are useful at all times; the Character page is wide enough without claiming the right column too.

- **STR death penalty + cascading debuff.** Locked. The big mechanic. When the player dies in combat:

  1. **STR takes a flat % hit.** First death: 50%. The % is tunable (and may decay across runs as you toughen). Captures as `run.statuses.deathDebuff.magnitude` (0.0–1.0).
  2. **The same % cascades to every other survival stat,** in the direction that *feels like waking up half-dead*:
     - HP → drops to (raw × (1 − magnitude))
     - Energy → drops to (raw × (1 − magnitude))      ("need a nap")
     - Happiness → drops to (raw × (1 − magnitude))
     - Sanity → drops to (raw × (1 − magnitude))
     - Spirit → drops to (raw × (1 − magnitude))
     - Hunger → climbs toward max ((100 − raw) is consumed by magnitude)   ("starving")
     - Thirst → climbs toward max                                            ("parched")
  3. **No run reset.** Death = wake up debuffed. The player crawls back through eating, drinking, and resting.
  4. **Recovery: every food consumed shaves magnitude down by a per-food rate.** Protein recovers fastest; non-protein still helps (every food gives back *something*). Each consumption: `magnitude = max(0, magnitude − foodDef.deathDebuffRecovery)`. When magnitude hits 0, debuff lifts.

  **Food recovery rates** (proposed starting tune, all units in magnitude-points subtracted per consumption):

  | Food | Hunger relief | Death-debuff recovery | Notes |
  |---|---|---|---|
  | Grubs (raw) | +3 | 0.05 | low protein, trace recovery |
  | Cooked grubs (future) | +5 | 0.08 | cooking bumps it |
  | Bird meat (raw) | +22 | 0.12 | the real protein |
  | Cooked bird meat (future) | +30 | 0.20 | cooked protein = real recovery |
  | Fish (future Era 2+) | +20 | 0.10 | protein, sub-bird |
  | Herbs / berries (future) | +5 | 0.02 | trace — every food gives back *something* |
  | Bread / grain (future) | +15 | 0.04 | carb-leaning |
  | Mending Potion | n/a | 0.30 | the panic button — full magnitude in ~4 doses |

  These map onto the broader "stats damage + targeted recovery" system locked earlier — death debuff is just a *severe* form of stat damage where STR is the keystone.

- **Equipment slot layout — locked.** Two-tier visibility:

  **Always-visible main slots** (8):

  ```
       ┌──Head──┐
       └────────┘
   ┌─Lhand─┐ ┌──Chest──┐ ┌─Rhand─┐
   │       │ │         │ │       │
   └───────┘ ├─────────┤ └───────┘
             │ Leggings│
   ┌─Ranged┐ ├─────────┤ ┌─Gloves┐
   │ (back)│ │  Boots  │ │       │
   └───────┘ └─────────┘ └───────┘
                   ▾ accessories
  ```

  - **Hand-Left**, **Hand-Right** — two melee slots. Dual wield is a real choice. A two-handed weapon (greatsword, war-pick, bow if you go that route) takes both hands.
  - **Ranged** — bow / throwing weapon slot. Sits on the back even when not drawn. Hunt action requires something here.
  - **Head**, **Chest**, **Leggings**, **Boots**, **Gloves** — body armor slots. Each contributes Armor / resistances / passive stat bonuses.

  **Accessories tray** (expand-collapse via small arrow):

  - **Rings** — 10 total: 5 per hand (one per finger). Each ring can carry a passive stat bonus (+STR, +DEX, +crit %, +regen, etc.) or a magical enchant. Late-game customization layer.
  - **Back** — cloak / cape / over-armor (separate from Ranged-slot bow — that's worn, this is layered on top).
  - **Over-armor** — outer layer beyond Chest (heavy plate, robes, etc.).
  - **Talisman / Charm / Necklace** — passive utility slot(s) — content TBD.

  Total fully-expanded: ~21 slots. Stat math sums across every equipped slot; empty slots = no contribution. UI default collapsed to the 8 main slots so it stays calm; the player expands when they want to fiddle with rings.

- **Spirit regen rate — locked, very slow.** Spirit (the spell resource) trickles back slowly by default — tuned to maybe **+0.3 to +0.5 / minute** at the start. Speed-ups come from:
  - Leveling the `magicCombat` / future `spirit` skill (each level adds a small regen tick)
  - Equipped gear that grants regen (rings, charms, Spirit Censer)
  - **Spirit Draught** potion — full burst refill (existing item)
  - **Rituals** at the Altar (later — see Arcane Studies)
  - Time spent IDLE near the altar (Arcane Studies passive)
  - High Sanity also helping (already implicit; could formalize)

  The early game is the "magic is precious" period — you'll cast Mending Word and then be dry for ten minutes. Mid-game gear and skills smooth this out. Late game it's plentiful.

- **Charm slot content — deferred.** Real design pass happens when accessory content lands. For now: placeholder that accepts items tagged `accessoryType: "charm"`. Likely fillers: echo-purchased trinkets, found relics from events, arcane study products.

#### Open questions (post-lock)

- **Boss death vs other death.** Earlier locked: boss death is retry-friendly, no run reset. Now also: ALL combat deaths trigger the death-debuff cascade. Open: does HP=0 outside combat (e.g. dehydration from neglected thirst) also trigger the cascade, or does that stay as a run-reset? Default: any HP=0 → death-debuff (the *narrative* is consistent: "you collapsed; you woke up"). Run reset only on prestige / Channel-the-Rock / explicit reset. Decision deferred to Combat Phase 2.
- **Death-debuff escalation.** First death at 50% magnitude. Should subsequent deaths within the same run stack? Maybe — second death adds 0.25 more to current magnitude, capped at 0.95 (you can never be 100% dead). Or maybe each death uses the SAME 50% so consecutive deaths feel beatable. Tune in Phase B.
- **The "wake up" location.** Where does the player wake up? Probably at the Hut (or Home if built). Need a beat of narrative when they come to — "You wake. The Stone watches. The Stone reminds you that you are alive."

#### Why this matters

The current UI is fine for early game but hits a ceiling fast. Six rail tabs already strains the rail; adding Weapons + Equipment + Crafting families on top would overflow. Full-page tabs unlock real room — the Character page can breathe, the Crafting page can show subfamilies. And the **Character page becomes the *home screen of identity*** — the player's gear, stats, and bridge between survival and combat all in one view. Stops being an idle game with a side-pane inventory; starts being an RPG with a survival layer.

---

### Open design questions (no decisions yet)

- **Does the Forge fold into the Home tab** or stay as a standalone building?
- **Stone Altar etchings — persistent or run-local?** (Probably persistent so they survive prestige — the altar is your trophy wall across many runs.)
- **Spirit refill curve** — rest-only vs. ritual-action vs. passive trickle? (Currently hybrid via Spirit Censer + Rest + Ritual.)
- **Spell cooldowns** — per-spell or shared "magic" cooldown? (Currently per-spell.)
- **Iconoclast building-destruction** — needs save migration + UI "your X was destroyed" toast. Deferred.
- **Ritual cooldown** — currently spammable if costs are met. Possibly intentional; possibly tune later.
- **Era 4 entry condition** — TBD. Probably involves the Altar + alignment threshold + several spells learned.

---

## 📦 Shipped (short summaries — full detail in systems.md)

### Era 0 — Scavenger ✅
Gather → find rock → 10 fragments → rock awakens (with consume animation + flash). Full detail: systems.md "Era 0" section.

### Era 1 — Awakening ✅
Hut → Fire Pit → Well → Garden → Cairn. Research tree: 12 tier-1–3 nodes (Foraging, Fire, Knapping, Vigilance, Hidden Stores, Mending, Net Weaving, Hardened Wood, Cooking, Tracking, Water Carrying, Trapping). Survival activates (body + mind stats). Threats (Scavenger). Random events with hidden alignment. Skills (Foraging, Hunting, Crafting, Building). Crafting + primitive tools (Net, Snare, Digging Stick, Water Skin) with durability. Hunting action. Storage caps + spoilage. Passive production (Well water, Garden grubs). Carrion Flock pest. Full detail: systems.md "Era 1" section.

### Era 2 — Settler ✅
**Trigger:** hut + fire pit + Foraging + Fire + Knapping → era flips to 2 → 🌅 story event. **Shipped:** Smithing → Forge → Stone Axe, Stone Pickaxe, Bone Knife, Bow. Fletching research. Resource-specific tool bonuses (wood/stone/food/water). Home research → Home building (rest bonus + +1 gather + resolve/sanity on build). Stone Walls (defense + food-steal reduction). Rudimentary Silo (storage caps + spoilage multiplier). Rudimentary Farmhouse (passive wood + 1.5× Garden food). Four NPC-hint events (wandererHintHome, soldierHintWalls, childHintSilo, farmerHintFarmhouse) — same NPCs intended to return as proto-companions. Prestige UI ("Channel the Rock") auto-reveals at era ≥ 2. Full detail: systems.md "Era 2" section.

### Era 3 — Awakened World ✅ (three slices shipped)
**Trigger:** Forge + Home built + Smithing + Fletching learned + Bow crafted → 🌌 darker transition story (sanity dip). **Spirit stat** activates (third Mind bar). **arcaneAwakening** research (fragments-only cost) reveals fragments as "Arcane Shards." **Starter spells** (Mending Word, Soothe, Inner Hearth) — research-as-spell pattern with per-spell cooldowns, fragment + spirit costs. **Alchemy** research → **Alembic** building → 3 stackable potions (Mending +40 HP, Stillness +30 sanity, Spirit Draught +100 spirit). **Demons** (Whisperer = sanity-only; Hollow Hound = HP + sanity, half-defense; Iconoclast = Resolve + Sanity drain, rarest). **Alignment-crystallizes:** Benevolent Pilgrim (good ≥ 3) and Bitter Scholar (evil ≥ 3) events surface; **Banish** (good ≥ 3) and **Bend** (evil ≥ 3) spells unlock. **Arcane tool tier:** Fragment Knife (+2 food gather, -1 sanity/gather), Spirit Censer (passive +1 Spirit/min), Warding Talisman (half demon damage AND sanity). **Ritual action** (1 fragment + 2 water → +30 Spirit + 3 sanity). `warded` status from Banish blocks demonic threats for 5 minutes. Full detail: systems.md "Era 3" section.

---

## 🔮 Not yet planned in detail — see roadmap.md

Era 4 (Arcane Industry), Era 5 (Eldritch Reckoning), Era 6 (Ascendant), Era 7 (Cosmic). Nested-scale ladders (galactic → universal → multiversal prestige layers). Companions / villagers (the big deferred system).

---

*Last updated alongside doc-sync pass.*
