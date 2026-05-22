# Bug Log

Open issues to tackle when we do a polish pass. Each entry has:
- **Status** — `open` / `in-progress` / `fixed` (commit ref)
- **Severity** — `paper-cut` / `medium` / `bad`
- **Repro** — how to see it
- **Notes** — design decisions / approach

Add new bugs at the top. When fixing, leave the entry with status `fixed` and a date so we have a history.

---

## #010 — Page elongates as sidebar content grows (height-locked desktop shell)

**Status:** ✅ fixed (Part A) — 2026-05
**Severity:** medium → paper-cut

**Repro:** On desktop, the left column (Inventory + Buildings + Crafts + Spells) and right column (Recent log) grow taller as content accumulates. The whole page elongates instead of scrolling within each column. Header scrolls out of view, the layout feels unmoored.

**Fix (Part A — shipped).** On desktop only (≥900px), the `.shell` is now a height-locked flex column (`height: 100vh; overflow: hidden`). Header / Scene / Stone strip / Footer stay at natural heights. The grid takes `flex: 1` with `min-height: 0` so it can fill remaining space. Each `.shell-area` (left / center / right) gets `overflow-y: auto` with subtle styled scrollbars (Firefox + WebKit). Mobile (≤900px) keeps natural page-scroll — single-column stack doesn't need height-locking.

**Where.** `src/index.css` — new media-query block after the existing grid rules.

**Still planned (Part B).** Left column tab system (Inventory / Tools / Arcane) to replace the stacked card layout — that's the architectural follow-up. See ERA_PLAN.md "Layout refactor" section. Part A makes the elongation pain stop *today*; Part B makes the left column scale gracefully when more tools and spells land.

---

## #011 — Tree modals can't pan to reach content past the viewBox edges

**Status:** ✅ fixed — 2026-05
**Severity:** bad

**Repro:** After #005 made locked nodes visible, the Buildings tree's tier-5+ structures (Forge, Home, Stone Walls, Silo, Farmhouse, Alembic) all sit *past* the right edge of the 820px viewBox at scale 1.0 — tier-7 Alembic is at x≈1350. The Teachings tree extends similarly upward, with tier-3+ nodes already above the viewBox top. The user could see the tree existed but couldn't drag right/up to reach it — pan got stuck around ±60 SLOP.

**Root cause:** The bounds formula from #009 was `Math.max(0, (scale - 1) * dim) / 2 + SLOP`. It assumed content fits the viewBox at scale 1.0 — which is the opposite of reality for any tree large enough to need pan/zoom in the first place. At scale 1.0 the formula gave overflowX = 0, so pan range was just ±SLOP, which was nowhere near the right edge of the actual content.

**Fix:**
1. Added a `contentBounds={ minX, minY, maxX, maxY }` prop to `PanZoomSvg`. Each tree modal computes its real content extent (from `getBuildingTreeBounds()` / `getTreeBounds()`) and passes it.
2. Rewrote `applyBounds` to compute valid tx/ty range from content extent:
   ```
   txA = width - cMaxX*s   // tx to push right edge of content to right of viewBox
   txB = -cMinX*s          // tx to push left edge of content to left of viewBox
   minTx = min(txA, txB) - SLOP
   maxTx = max(txA, txB) + SLOP
   ```
   Using min/max handles both "content overflows viewBox" (range valid) and "content fits viewBox" (range collapses to ±SLOP) without special-casing.
3. The ⤢ Fit button now actually fits: computes a scale that fits all content (clamped to minZoom) and centers it. Previously it just reset to scale=1 / origin, which left half the tree off-screen.

A `boundsRef` keeps the long-lived wheel listener in sync with the latest `contentBounds` without forcing it to re-register on every prop change.

**Where.** `src/ui/PanZoomSvg.jsx` (new prop + new applyBounds + new reset), `src/ui/BuildingsTreeModal.jsx` and `src/ui/TeachingsTreeModal.jsx` (compute & pass `contentBounds`).

---

## #009 — Tree modal pan gets stuck — can't drag back to center

**Status:** ✅ fixed — 2026-05
**Severity:** medium

**Repro:** Open Teachings (or Buildings) tree modal. Scroll/drag a little bit in any direction. The content moves off-screen and there's no way to drag it back — the visible canvas is now covered in tree nodes (which have `data-no-pan` so clicking them doesn't start a drag), and there's no empty SVG space left to grab.

**Root cause:** Pan bounds in `PanZoomSvg.jsx`:
```js
const rangeX = (width * (nextScale - 0.4)) / 2;
```
At scale 1.0 this allowed pan of ±(width × 0.3) — meaning content could shift 30% in any direction. Combined with `data-no-pan` on tree nodes (which is correct — node click should select, not pan), the user could pan the tree to a position where all visible SVG space is covered by nodes, leaving nothing draggable.

**Fix:** Bounds formula tightened to `Math.max(0, (scale - 1) * dim) / 2 + SLOP`:
- At scale ≤ 1 (content fits the viewBox): pan range is just `SLOP` (60px) in each direction — enough for breathing room, not enough to lose the tree.
- At scale > 1 (content overflows): pan range grows with overflow so all corners are reachable, plus SLOP buffer.

Plus: the in-modal `+` / `−` zoom buttons now re-clamp pan to the new bounds on each zoom step (previously they only changed scale, leaving stale pan positions). And the `⤢` Fit button got a longer tooltip ("Fit tree to view (0) — use this if you get lost") to make it obvious as the recovery action.

**Where.** `src/ui/PanZoomSvg.jsx` (bounds math + zoom-button re-clamp + Fit tooltip).

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

**Status:** ✅ fixed — 2026-05
**Severity:** medium

**Fix.** Three new red-dot badges that share the same visual language:

- **Left-column rail icons.** `Tools` and `Buildings` rail buttons now carry a small red bubble with the actionable count when there's stuff the player can act on (counted via `getAvailableBuildings` and the craft-affordance check). The Tools and Buildings tabs only carry the badge — Arcane deliberately doesn't, because spells are repeatable casts, not progression.
- **Trigger card open button.** The big "Open Buildings" / "Open Crafts" button now grows a matching red bubble after the label. Same number as the rail badge — visible from inside the tab, the rail badge is visible from outside.
- **Stone strip icon.** Counts `getAvailableResearch(state)` once the rock is awakened. The Teachings tree's entry point now signals "there's something to listen to" without the player having to open the modal.

**Where.** `src/ui/LeftColumn.jsx` (rail + trigger card badges), `src/ui/StonePanel.jsx` (stone icon badge), `src/index.css` (`.lc-rail-badge` / `.lc-trigger-badge` / `.stone-icon-badge` shared definition).

---

## #006 — Green "+" affordance indicator on tree nodes

**Status:** ✅ fixed — 2026-05
**Severity:** medium

**Fix.** Both tree modals (`BuildingsTreeModal.jsx`, `TeachingsTreeModal.jsx`) compute an `isAffordable(state, node)` boolean — `canBuild` / `canListen` returns ok AND the node isn't already built/learned. When true, the node renders an extra `<g className="tree-node-affordable-mark">` containing a small green circle + white "+" anchored to the upper-right of the SVG node circle. The node's own border also flips to green, and the badge gently pulses to draw the eye without being aggressive.

**Where.** Both tree modals added the badge SVG + `is-affordable` class. CSS lives in `src/index.css` under "Affordance '+' badge on tree nodes (BUGS.md #006)".

---

## #005 — Tree modals hide nodes whose prerequisites aren't met

**Status:** ✅ fixed — 2026-05
**Severity:** bad

**Fix.** Split the visibility helpers in both systems:

- `src/systems/building.js` — new `getKnownBuildings(state)` (everything past the rock-awaken gate, including locked) and `getAvailableBuildings(state)` (canBuild ok). `getVisibleBuildings` is kept as a backward-compat alias that maps to `getKnownBuildings`.
- `src/systems/research.js` — new `getKnownResearch(state)` (everything except still-hidden alignment-gated nodes; era-gated and prereq-locked nodes are visible-as-locked) and `getAvailableResearch(state)` (canListen ok). `getVisibleResearch` aliased to `getKnownResearch`.

`BuildingsTreeModal` and `TeachingsTreeModal` switched to `getKnownBuildings` / `getKnownResearch`. `getNodeState` now distinguishes three states cleanly: `built/learned` (done), `available` (prereqs met, may or may not have resources), `locked` (a hard prerequisite is missing — research / parent building / era / rockAwakened / hutBuilt). Locked nodes render dimmed (0.5 opacity bg, 0.4 opacity icon/label) so the player can see the tree growing ahead.

Alignment-gated teachings (Banish / Bend) stay fully hidden — those are designed to *appear* when the silent alignment counter tips, preserving the cosmic-horror reveal.

**Pairs with #006 (green +) and #007 (notification badges)** — together these turn the trees into a planning surface: locked nodes show the path, green + shows what you can do *now*, red dot tells you to come look.

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
