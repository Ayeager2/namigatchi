# Bug Log

Open issues to tackle when we do a polish pass. Each entry has:
- **Status** — `open` / `in-progress` / `fixed` (commit ref)
- **Severity** — `paper-cut` / `medium` / `bad`
- **Repro** — how to see it
- **Notes** — design decisions / approach

Add new bugs at the top. When fixing, leave the entry with status `fixed` and a date so we have a history.

---

## #008 — Era background indicator (visual cue on era change)

**Status:** open
**Severity:** paper-cut

**Want:** Some kind of background indicator when a new era starts — a subtle treatment that tells the player "the world has shifted" beyond just the era name in the header. Could be:
- A subtle color shift on the page/main panel background per era (Era 0 = ashen brown, Era 1 = slightly warmer, Era 3 = purple-tinted etc.)
- A one-shot animation that plays on era transition (radial glow expanding from center?)
- A small era badge in the header that's more visually distinct
- Possibly tying into the master scene's evolving image (when art arrives)

**Notes:** Per-era CSS body classes already exist conceptually (we have body class infrastructure for themes). Could add `body.era-N` and let CSS adjust accents. The transition story event already fires — could trigger a CSS keyframe to play once. Worth confirming with user whether they want the *background to change permanently per era*, or just a *one-shot transition flourish*.

---

## #007 — Notification badge on main page for available tree items

**Status:** open
**Severity:** medium

**Want:** When the player has the materials to either build or research something they haven't yet, a small red circle notification appears on the relevant trigger card (Buildings card / Stone strip for Teachings). Shows the count.

**Sketch:** `Buildings (3 available) 🔴3`. Red circle in corner of trigger card with the count. Disappears when count = 0.

**Notes:** Easy to compute — iterate visible buildings/research, count where `canBuild(state, b.id).ok` or `canListen(state, r.id).ok`. Pair this with #006 below — once items get a green + in the tree, the count on the trigger card tells the player "stop in here, there's stuff to do."

---

## #006 — Green "+" affordance indicator on tree nodes

**Status:** open
**Severity:** medium

**Want:** Tree node visual cue showing the player has the materials to build/research it RIGHT NOW. Small green "+" badge in the corner of the node SVG circle. Distinct from "unlocked / requirements met" (which the existing border-color shows) — this is specifically "you can act on this *now*."

**Sketch:** In `BuildingsTreeModal.jsx` and `TeachingsTreeModal.jsx`, after computing the node state (`available` / `locked` / `built`), also compute `canAfford = canBuild(state, b.id).ok` (or `canListen` for teachings). If true and not yet built/learned, render an additional `<text>` or `<circle>` in the SVG group with the "+" mark. CSS class `.tree-node-affordable-mark` for styling.

**Notes:** Pairs with #005 — once locked nodes are visible, the green + tells the player which ones they can pursue right now versus which need more progression. Pairs with #007 (notification badge) for the "click in to see what's actionable" pattern.

---

## #005 — Tree modals hide nodes whose prerequisites aren't met

**Status:** open
**Severity:** bad

**Repro:** Open Buildings tree modal. Only Hut, Fire Pit, Forge, Home, and a few others are visible. The Stone Walls, Silo, Farmhouse, Alembic, Water Pit, Garden, and Cairn are all in `content/buildings.js` but don't show in the tree. Same for Teachings — tier-3+ nodes that require certain alignment / research / building disappear from view.

**Root cause:** `getVisibleBuildings` in `src/systems/building.js` and `getVisibleResearch` in `src/systems/research.js` filter out anything whose `requires.researched` / `requires.hasBuilding` / `requires.alignment` aren't satisfied. The trigger card's "available" count uses this fine, but the **tree modal** consumes the same filter — so it never shows locked content. Result: the player can't see the tree growing ahead of them.

**Fix approach:**
1. Split into two functions per system:
   - `getKnownBuildings(state)` — returns everything that should appear in the tree (everything except truly secret content). Includes locked nodes.
   - `getAvailableBuildings(state)` — returns only buildings the player can actually start working on (current behavior of `getVisibleBuildings`).
2. Tree modals use `getKnownBuildings`. Trigger card uses `getAvailableBuildings` for the count.
3. Add a node state `locked` so the tree can render locked nodes dimmed with a tooltip explaining what's needed.
4. Alignment-gated nodes (good/evil-requiring teachings) should stay hidden — those are designed to *appear* when alignment tips. Distinguish that case from "needs a building."

**Pairs with #006 and #007** — once the locked nodes are visible, the affordance "+" badge and notification count become the meaningful UI signals.

---

## #004 — Wheel-zoom in tree modals scrolls the page behind

**Status:** ✅ fixed — 2026-05
**Severity:** medium

**Repro:** Open Buildings or Teachings tree modal. Mouse-wheel to zoom. The page behind the modal scrolls up/down at the same time.

**Root cause:** React attaches `onWheel` handlers as **passive** by default (since React 17). Passive listeners can't call `preventDefault()` — the call is silently ignored. So my `e.preventDefault()` in the SVG's onWheel was a no-op, and the browser scrolled the page through to the body underneath.

**Fix:** Replace the React-prop `onWheel` with a manual `addEventListener('wheel', handler, { passive: false })` inside a `useEffect`. The handler now actually blocks the page scroll. Plus added `overscroll-behavior: contain` on `.modal-overlay` as a belt-and-suspenders for any future scroll-throughs.

---

## #003 — Buildings & Research tree modals need pan + zoom

**Status:** ✅ fixed — 2026-05
**Severity:** medium

**Fix:** Built a shared `<PanZoomSvg>` component (`src/ui/PanZoomSvg.jsx`) that wraps the SVG in a transformable `<g>`. Both BuildingsTreeModal and TeachingsTreeModal now use it. Features:
- Click and drag to pan (pointer events, captures pointer for smooth dragging)
- Mouse wheel to zoom toward the cursor (so the point under your mouse stays fixed)
- + / − / 0 keyboard shortcuts when the SVG is focused
- Floating control panel: zoom in, zoom out, fit (resets), and live percent indicator
- Bounded panning so the tree can't be lost off-screen
- Node `data-no-pan` attribute so clicks on nodes register as selects, not pan starts

**Note:** Edge tags get the `data-no-pan` skip from being inside the click target check, but actual node clicks still work as selects.

---

## #002 — Food spoilage countdown bar in inventory

**Status:** ✅ fixed — 2026-05
**Severity:** paper-cut

**Fix:** Added `spoilStatusFromDef(resource, capStatus, accum)` to `src/systems/storage.js` that computes time-to-next-loss + percent toward the next loss. InventoryPanel renders a `<SpoilBar>` for each resource that has a `spoilage` def. Features:
- Slim 3px dead-green bar (`#3a4a2a → #5a6a3a` gradient) under each spoiling food row
- When at cap, color shifts to rot-red and the at-cap multiplier is reflected in the rate
- Tooltip on hover: `"{name} is spoiling — about ~N min until next loss."` (with extra "(rotting fast — storage is full)" when at cap)
- Re-renders every 5s so the bar visibly creeps
- When future preservation tech reduces spoilage rate to 0, the bar will naturally disappear (no UI changes needed)

---

## #001 — Gather button width changes mid-cooldown, shoves Hunt below

**Status:** ✅ fixed (twice) — 2026-05 (initial), 2026-05 (redux)
**Severity:** paper-cut

**First fix (didn't stick):** `min-width` on `.btn-gather` / `.btn-hunt`. But the parent `.action-row` had `flex-wrap: wrap` set elsewhere, which still let Hunt wrap when Gather grew its label.

**Redux fix:** Higher-specificity rule on `.action-panel .action-row`: `flex-wrap: nowrap !important`, plus `flex: 1 1 0` and `min-width: 0` on each child button so they share the row equally and shrink with ellipsis if they truly run out of room. Also shortened the labels: "Hunt birds" → "Hunt", "Hunting birds…" → "Hunting…" so the row breathes.

---

*Last updated: 2026-05*
