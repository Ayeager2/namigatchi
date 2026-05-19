# Era Plan — Planned & Shipped

Living planning doc. **`docs/systems.md` is the source of truth for shipped systems** with full detail and code pointers. This doc captures the **design rationale** + the **what's-coming-next** roadmap.

Read order: skim "Planned" below for what's on the table; "Shipped" sections are short pointers to where the full detail lives in systems.md.

---

## 🎯 Planned (active design — not yet built)

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
