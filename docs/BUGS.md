# Bug Log

Open issues to tackle when we do a polish pass. Each entry has:
- **Status** — `open` / `in-progress` / `fixed` (commit ref)
- **Severity** — `paper-cut` / `medium` / `bad`
- **Repro** — how to see it
- **Notes** — design decisions / approach

Add new bugs at the top. When fixing, leave the entry with status `fixed` and a date so we have a history.

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
