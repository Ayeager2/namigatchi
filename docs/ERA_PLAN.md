# Era 2 expansion + Era 3 plan

Living planning doc capturing the next two eras' content. Tasks (in the
in-app todo list) track concrete implementation slices. This doc is the
"why and what" — tasks are the "do."

---

## Era 2 — Settler (shipped + planned expansion)

### Already shipped
- Era trigger: hut + fire pit + Foraging + Fire + Knapping → era flips to 2
- 🌅 transition story event (one-shot per run)
- Smithing research → Forge building
- 4 forge-required tools: Stone Axe, Stone Pickaxe, Bone Knife, Bow
- Fletching research
- Resource-specific tool bonuses (wood/stone/food/water)
- Prestige UI auto-reveals at era ≥ 2

### New for Era 2: chained "settlement" buildings (Task #43 — SHIPPED)

A research-then-build chain that anchors the player to a place. The Hut is
shelter; the **Home** is *yours*. From there you build outward.

Shipped:
- **Home research** — cost wood:40, stone:30, food:5, water:3. Tier 5,
  parent: smithing. Unlocks the Home building.
- **Home building** — cost wood:60, stone:50, water:5. Grants +1 gather
  yield, `restBonus { energy:10, happiness:3, sanity:2 }` flowed through
  the Rest action, and resolve/sanity boost on build via the existing
  build-effect path. Required before Walls/Silo/Farmhouse become visible
  in the tree.
- **Stone Walls** (parent: Home) — cost stone:100, wood:30. `effect.defense: 3`
  and `effect.foodStealReduction: 2`. Threats system aggregates these
  alongside research.
- **Rudimentary Silo** (parent: Home + Garden) — cost stone:50, wood:40.
  storageCaps `{ food:30, bird_meat:20 }` and `effect.spoilageMultiplier: 0.7`.
  Storage system reads the multiplier in both `processSpoilage` and
  `spoilStatusFromDef` (UI bar reflects the slowdown).
- **Rudimentary Farmhouse** (parent: Home + Garden) — cost stone:30, wood:60,
  food:5. `passiveProduce { wood: { perMinute: 0.5 } }` plus a Farmhouse +
  Garden combination modulator that multiplies garden food by 1.5.

Wiring touched: `src/content/research.js` (home), `src/content/buildings.js`
(home/walls/silo/farmhouse), `src/systems/building.js` (canBuild +
getVisibleBuildings honor `requires.hasBuilding`), `src/systems/threats.js`
(building defense + foodStealReduction aggregators), `src/systems/passive.js`
(farmhouse garden modulator), `src/systems/storage.js`
(getSpoilageMultiplier, building-mult propagated through spoilage path),
`src/systems/survival.js` (generic building restBonus aggregator),
`src/content/survival.js` (`messageWithHome` for Rest).

### New for Era 2: NPC-hint events (Task #44 — SHIPPED)

Each event is a `requires.notHasBuilding` gate so the suggestion disappears
once the building lands:

- **wandererHintHome** — fires when hut is built but home is not.
- **soldierHintWalls** — fires when home is built but walls are not.
- **childHintSilo** — fires when home is built but silo is not.
- **farmerHintFarmhouse** — fires when garden is built but farmhouse is
  not (drops +3 grubs as a quiet gift).

Wiring: `src/content/events.js` (4 new events), `src/systems/events.js`
(`isEventEligible` now honors `requires.notHasBuilding`, accepts string or
array).

These also serve as **proto-companion encounters** for later eras — the
same NPCs are intended to return after the building is up and offer to
stay, bridging into the companion system.

---

## Era 3 — Awakened World (Magical Medieval) — first slice SHIPPED

Roadmap vision: "Magic emerges. Spirit stat. Alchemy. Enchantment. Ritual.
Magical fragments refine into spells. Alignment crystallizes. First demons."

**Shipped:** entry condition (#51), Spirit stat (#45), arcaneAwakening
reveal (#46), 3 starter spells (#47), Whisperer demon (#50), era
transition story, alchemy + Alembic + 3 potions (#48), alignment
surfacing in research/spells/events (#49), Banish + Bend
alignment-gated spells, Hollow Hound demon, `warded` status.

**Third slice shipped:** arcane tool tier (Fragment Knife, Spirit
Censer, Warding Talisman), Ritual action, Iconoclast demon (stat-only;
building-damage variant deferred to its own iteration).

**Still deferred:** Iconoclast's chance to destroy a building (needs
save migration + UI for "your X was destroyed"). Possibly: Ritual
cooldown, more Era 3 buildings (sanctum?), Era 4 onward.

### Era 3 entry condition (Task #51 — SHIPPED)

Forge built + Smithing learned + Fletching learned + Bow crafted (proves
Era 2 mastery). Plus probably **Home built** from the Era 2 expansion above
— the magical era is for those who have a place to *be magical in*.

`computeEra` returns 3. Era 3 transition story event fires (one-shot per
run): a darker moment, sanity dip + Spirit stat reveal.

### Spirit stat (Task #45)

New stat — NOT a rename of `happiness` (which stays as Resolve, daily
wellbeing). Spirit is the *magical-energy meter*.

- 0–100, high = ready to cast
- Drains from casting spells
- Refills from Rest (slow) and a future Ritual action (faster, costs water
  + fragments)
- Hidden until Era 3; SurvivalBars adds a third stat row when era ≥ 3
- Some Era 3 events drain Spirit if alignment is mismatched

### Fragments revealed (Task #46)

The hidden-resource mechanism already exists. The `arcaneAwakening`
research node is referenced in `resources.js` (`hiddenUntil: { researched:
"arcaneAwakening" }`) but the node itself doesn't exist yet. Add it.

- First Era 3 research the player learns
- Cost: a fragments-only payment (10? 20?) — first time fragments are
  spent intentionally
- On-learned: fragments rename from "???" / "Unknown" → "Arcane Shards" in
  the Arcane category. The reveal is instant and dramatic.

### Spells = research nodes that grant actions (Task #47)

Pattern: a spell is research that, when learned, unlocks a new action
button (or passive bonus). Costs fragments + Spirit on cast.

Initial spell set:
- **Mending Word** (good-leaning) — heals 20 HP. Cost: 1 fragment + 15
  Spirit. Cooldown 60s.
- **Soothe** (good-leaning) — +15 Sanity. Cost: 1 fragment + 10 Spirit.
- **Inner Hearth** (neutral) — +20 Resolve. Cost: 1 fragment + 5 Spirit.
- **Banish** (good-leaning, gated behind alignment ≥ 3) — clears active
  threat / repels demon. Cost: 2 fragments + 25 Spirit.
- **Bend** (evil-leaning, gated behind alignment ≥ 3) — steal Resolve from
  the world to refill yours. Cost: 1 fragment + 15 Spirit. -1 good
  alignment per cast.

### Alchemy / potions (Task #48)

Tools system extends to a **consumable** category. One-shot items, no
durability — uses = 1.

- New building: **Alembic** (parent: Forge). Required for brewing.
- **Potion of Mending** — instant 40 HP. Crafted from 2 fragments + 5
  grubs + 3 water.
- **Potion of Stillness** — instant 30 Sanity. Crafted from 2 fragments +
  5 feathers + 3 water.
- **Spirit Draught** — instant full Spirit. Crafted from 3 fragments + 10
  water. Expensive — used for emergencies.

Sets up Era 4's industrial alchemy expansion (mass brewing, automation).

### Alignment surfaces (Task #49)

Choice events get a new `requires.alignment: { good: N }` or `{ evil: N }`
gate. Some choices only *appear* at the right alignment. The hidden good
/evil counter never shows as a number — consequences just emerge.

Test events to ship:
- A benevolent pilgrim offers to teach **Banish** — only visible if good ≥ 5
- A bitter scholar offers to teach **Bend** — only visible if evil ≥ 5
- A child asks for help — the option to help only resolves *meaningfully*
  if Resolve + Sanity high (you can give yourself)

### First demons (Task #50)

New threat type in `src/content/threats.js`:
- **Whisperer** — does ONLY sanity damage (-5 per encounter). Defense
  from Vigilance does nothing. Banish spell or Wards (passive) clear it.
- **Hollow Hound** — does HP + sanity damage. Resists physical (defense
  halved). Stronger threat.
- **Iconoclast** — rarest. Damages Resolve + Sanity, attempts to destroy
  a random building (low chance). Mid-Era-3 nightmare.

These threats only fire at era ≥ 3. They make Spirit/spells *load-bearing*
rather than optional.

### Arcane tool tier

Forge can craft tier-3 arcane tools when the player has the Alembic +
certain spell research. Examples:
- **Fragment Knife** — like Bone Knife but +2 food yield, +1 fragment
  chance per hunt. Drains 1 sanity per use (the blade hums).
- **Spirit Censer** — passive: +1 Spirit per minute while owned.
- **Warding Talisman** — passive: reduces incoming demon damage by 50%.

Tier 3 tools have fragment costs and higher durability.

---

## Era 1 — bird tiering & grub birds

The current "Hunt" mechanic catches generic "Bird" → "Bird Meat" with the Net. Per design feedback, this needs to be **tiered by tool** so progression scales hunting alongside everything else.

### New content shape

- **Grub Bird** — mutated, flightless bird that eats grubs. The ONLY bird the Net can catch. Drops "Grub Bird Meat."
- **Grub Bird Meat** — food, **nutrition: 10** (capped low — survival food, like grubs themselves). Replaces the current generic "Bird Meat" in early game.
- **Bow unlocks higher-tier birds** — at Era 2 when Bow is crafted, Hunt rolls against a different table with better birds. Bigger nutrition, possibly rarer drops (feathers in larger qty).

### Implementation sketch

- `src/content/hunting.js` (or `hunting.js` already exists per ActionPanel import) — split `huntPool` by tool:
  - With Net only: only grub birds available
  - With Bow: better birds in pool (proper Birds — "Carrion Hawk" etc.)
- Hunt action selects pool by which tool the player owns. Tool tier defines reach.
- `src/content/resources.js` — rename `bird_meat` → `grub_bird_meat`, set `nutrition: 10`. Add new food entries for Era 2 birds (`hawk_meat: { nutrition: 25 }` etc.).
- Migration: existing saves with `bird_meat` in inventory should migrate to `grub_bird_meat` on load. Add to `src/state/save.js` `migrate()`.

### Why this matters

Tying gather/hunt yields to the tools owned makes every tool craft *feel* like an upgrade. Currently "I have a Net" gives a flat hunt-button on-screen but the rewards are the same regardless of tool. With tiering, "I have a Bow" means I'm hunting bigger game — the tool's existence changes the game world's offering.

---

## Rest method scales with home tier

Per design feedback: rest should be **punishing at first** (cold ground, no shelter) and *gradually* improve as the player's home upgrades. Currently rest gives a flat energy/HP/resolve boost.

### Design

| Sleep location | Energy gain | Hunger penalty | Thirst penalty | Sanity gain | Resolve gain |
|---|---|---|---|---|---|
| Bare ground (no hut) | +10 | +5 hunger | +5 thirst | -2 | 0 |
| Hut | +30 | +3 hunger | +3 thirst | +1 | +3 |
| Hut + Fire Pit | +50 | +2 hunger | +2 thirst | +2 | +3 |
| Home | +60 | +1 hunger | +1 thirst | +3 | +5 |
| Home + future upgrades | +70+ | 0 | 0 | +4 | +6 |

### Implementation sketch

- `src/content/survival.js` rest action already has `bonusFromBuilding` for fire pit. Extend with negative deltas when no shelter, positive when home built. Or: compute a "shelter tier" and pick the right effect set.
- `src/systems/survival.js` `performSurvivalAction("rest")` reads the shelter tier and applies. New messages per tier: "you shiver against the cold stone…" vs "you sleep deeply in your home."
- Tier source: `getShelterTier(state)` — derives from `state.run.built` (none / hut / hut+firepit / home / home+future).

### Wired now (partial — sanity check needed)

The current rest action already has `bonusFromBuilding: { firepit: { energy: +20, hp: +5, happiness: +2, sanity: +1 } }` and Home grants `restBonus { energy:10, happiness:3, sanity:2 }` (per ERA_PLAN above). So part of this exists. **The "punishing without shelter" half doesn't.** That's the new design — rest *before* hut should drain you, not refill you. Currently rest before hut just gives flat energy. Fix.

---

## Era 2 Home tab — personal upgrades + visual altar

Per design feedback: when the **Home** building is constructed, a new "Home" tab/panel appears on the main UI. This is the player's *personal upgrade space*, distinct from Buildings (which is the *settlement* tree). It's where the player decorates and expands their dwelling — adding interior areas that unlock new actions/buildings.

### Vision

- **Home tab opens** once the Home building is built. Trigger card in the left column or main UI: "Your Home →"
- Inside is a sub-tree (or grid) of **interior upgrades**:
  - **Forge area** — must be researched/built before the standalone Forge building can be raised (or: replaces the Forge as a Home interior)
  - **Alchemy bench** — Era 3 interior, unlocks alchemy at home
  - **Hunting trophies wall** — cosmetic / passive
  - **Library/study** — research speed bonus
  - **Bedroom upgrade** — better rest values (ties into rest-tier design above)
  - **Stone Altar** — the centerpiece (see below)
- The current standalone Forge / Alembic buildings may eventually fold INTO the Home (as interior upgrades) rather than being separate world structures. **Decision pending.**
- Each interior upgrade has its own cost and "research from the stone" requirement.

### The Stone Altar (Era 2 → 3 transition piece)

A very expensive Home interior that the player slowly builds out as a **visual progression record**. Each milestone the player completes adds a new etched relief to the altar's base:

- A small home etched (you raised the Home building)
- Blacksmith icons etched (you crafted N tools)
- Hunting marks etched (you reached Hunting Lv X)
- An eye etched (you awakened the rock)
- An eldritch glyph etched (you researched Arcane Awakening)
- Etc.

The altar **starts as a basic stone pedestal** (~maxes out Era 2's resource budget to build the base). As eras progress, etchings appear automatically as milestones land. It's the visual record of the player's run — a museum of their own progression that they pass each time they visit their Home tab.

**Cost (proposed):** Base pedestal ~ 200 stone + 100 wood + 20 fragments. *Significant* expense — meant to drain Era 2 reserves and signal "you're ready for Era 3 now." The etchings are free (auto-added on milestone completion); the base is the bottleneck.

**Long arc tie-in:** This is where the Era 3 arcane work *begins* — the altar is what fragments are eventually offered to. Building the altar enables certain Era 3 rituals/spells to cast at higher power. The roadmap's "rock as connective tissue" insight has its physical manifestation here.

### Implementation sketch

- New top-level UI element: **Home tab** — a fourth right-column tab maybe? Or a new trigger card next to Buildings? **Decision pending.**
- New content type: `src/content/homeUpgrades.js` (or extend buildings with `category: "home-interior"`) — each upgrade has cost, research requirement, effect.
- Stone Altar is one entry in that list, with a sub-list of etchings that are computed from state milestones (similar to scene composition — pure function of state).
- New milestone-tracking state if needed: `persistent.altarEtchings: { etchingId: { earnedAt } }` so etchings persist across prestige. Or compute on-the-fly from existing milestone stats.

### Why this matters

It creates a *personal* progression space distinct from the *outward* settlement progression. The Buildings tree is "what you built in the world." The Home tab is "what's inside your own walls." The altar is "what you've become" expressed visually. Three nested layers of progression display.

---

## Open design questions (no decisions made yet)

- **Spirit refill curve**: rest-only vs. ritual-action vs. passive
  trickle? Probably hybrid.
- **Spell cooldowns**: per-spell or shared "magic" cooldown?
- **Alignment numeric thresholds**: 3 / 5 / 10? Calibrate against how
  often choice events fire.
- **Demon spawn rate**: how often before they become annoying? Tune
  against player spell access.
- **Order of Era 3 systems**: Spirit + fragments-revealed first (the
  reveal moment), then spells, then alchemy, then alignment + demons?
- **Does Home replace the Hut**, or sit alongside it? Probably
  alongside — Hut becomes the "first night" memory; Home is "you
  live here now."

---

*Last updated: 2026-05*
