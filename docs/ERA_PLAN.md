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

**Shipped this iteration:** entry condition (#51), Spirit stat (#45),
arcaneAwakening reveal (#46), 3 starter spells (#47), Whisperer demon (#50),
era transition story.

**Deferred to next slice:** alchemy/potions (#48), alignment surfacing in
choice events (#49), more demons (Hollow Hound, Iconoclast), Banish + Bend
alignment-gated spells, arcane tool tier.

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
