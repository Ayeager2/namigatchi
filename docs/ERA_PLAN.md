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
