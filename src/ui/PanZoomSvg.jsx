// Shared pan + zoom container for SVG-based tree modals (buildings, teachings).
//
// Props:
//   width, height   — viewBox dimensions (the *window* on the content)
//   children        — SVG content (already laid out in content coords)
//   contentBounds   — { minX, minY, maxX, maxY } of the actual content's
//                     extent in content coords. Defaults to the viewBox
//                     dimensions, but most real trees extend FAR past it
//                     (e.g. Buildings tier-7 alembic is at x≈1350 in an
//                     820-wide viewBox). Drives the pan range so every
//                     corner of content is reachable at every zoom level.
//   minZoom, maxZoom — clamp range (default 0.5..2.5)
//
// React quirk that bit us (bug #004): React attaches `onWheel` as a passive
// listener by default, which means `e.preventDefault()` is silently ignored
// and the page scrolls behind the modal. Workaround: attach the wheel
// handler manually with `addEventListener(..., { passive: false })`.

import { useEffect, useRef, useState } from "react";

// Pan/zoom container — see header comment above for prop docs.
export default function PanZoomSvg({
  width,
  height,
  children,
  contentBounds,
  minZoom = 0.5,
  maxZoom = 2.5,
  className = "",
  ariaLabel,
}) {
  // Resolve content bounds. If the caller didn't pass any, fall back to
  // assuming content fits the viewBox. (Backward-compatible default.)
  const cb = contentBounds || { minX: 0, minY: 0, maxX: width, maxY: height };
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Latest scale/tx/ty for the wheel handler (which is registered once).
  const latestRef = useRef({ scale, tx, ty });
  latestRef.current = { scale, tx, ty };

  // Latest contentBounds for the long-lived wheel/keyboard handlers, since
  // applyBounds is a fresh closure on every render but the handlers aren't.
  const boundsRef = useRef(cb);
  boundsRef.current = cb;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // Pan range — content-aware.
  //
  // At translation `t` and scale `s`, the visible region in content coords is
  // ([-t/s, (dim - t)/s]). For the user to be able to see content edge at
  // contentCoord = c, we need t somewhere in [dim - c*s, -c*s]:
  //
  //   • To bring the LEFT edge of content (cMinX) onto the right side of the
  //     viewBox: tx = -cMinX * s  → cMinX appears at left of viewbox when
  //     tx = -cMinX*s. To see it at all: tx ≥ -cMinX*s (anything larger pushes
  //     it further into view).
  //   • To bring the RIGHT edge of content (cMaxX) into view from the right:
  //     tx ≤ width - cMaxX*s.
  //
  // So the valid range is [width - cMaxX*s, -cMinX*s]. When content is smaller
  // than the viewBox, this becomes a degenerate (inverted) range — use
  // Math.min/Math.max so callers always get a sensible clamp.
  //
  // SLOP lets the user nudge a bit past the edges so the corner nodes don't
  // hug the bezel.
  //
  // Bug #009 (pan-stuck): old formula tightened to ±SLOP at scale 1.0,
  // assuming content fit the viewBox. But the real trees extend WAY past
  // the viewBox at scale 1.0 — that's why this content-aware version exists.
  const SLOP = 80;
  const applyBoundsWith = (bounds, nextTx, nextTy, nextScale) => {
    const txA = width - bounds.maxX * nextScale;
    const txB = -bounds.minX * nextScale;
    const minTx = Math.min(txA, txB) - SLOP;
    const maxTx = Math.max(txA, txB) + SLOP;

    const tyA = height - bounds.maxY * nextScale;
    const tyB = -bounds.minY * nextScale;
    const minTy = Math.min(tyA, tyB) - SLOP;
    const maxTy = Math.max(tyA, tyB) + SLOP;

    return {
      tx: clamp(nextTx, minTx, maxTx),
      ty: clamp(nextTy, minTy, maxTy),
    };
  };
  const applyBounds = (nextTx, nextTy, nextScale) =>
    applyBoundsWith(cb, nextTx, nextTy, nextScale);

  const onPointerDown = (e) => {
    if (e.target.closest("[data-no-pan]")) return;
    setDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
    if (e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        /* some elements don't support capture */
      }
    }
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgDx = (dx / rect.width) * width;
    const svgDy = (dy / rect.height) * height;
    const next = applyBounds(
      dragRef.current.tx + svgDx,
      dragRef.current.ty + svgDy,
      scale
    );
    setTx(next.tx);
    setTy(next.ty);
  };

  const onPointerUp = () => setDragging(false);

  // Manual wheel listener — non-passive so preventDefault() actually blocks
  // the page scroll behind the modal.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { scale: curScale, tx: curTx, ty: curTy } = latestRef.current;
      const factor = -e.deltaY > 0 ? 1.1 : 1 / 1.1;
      const nextScale = clamp(curScale * factor, minZoom, maxZoom);
      if (nextScale === curScale) return;
      // Convert client → SVG coords for cursor-anchored zoom.
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * width;
      const y = ((e.clientY - rect.top) / rect.height) * height;
      const cx = (x - curTx) / curScale;
      const cy = (y - curTy) / curScale;
      const newTx = x - cx * nextScale;
      const newTy = y - cy * nextScale;
      const bounded = applyBoundsWith(
        boundsRef.current,
        newTx,
        newTy,
        nextScale
      );
      setScale(nextScale);
      setTx(bounded.tx);
      setTy(bounded.ty);
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, minZoom, maxZoom]);

  // Fit-to-view: pick a scale where the whole content bounding box fits in
  // the viewBox, then translate so the center of content is the center of
  // the viewBox. This is what the ⤢ button now does — it's the recovery
  // action when the user has panned themselves into a strange corner. If
  // the caller didn't pass contentBounds, this degenerates to the old
  // "scale 1, origin" behavior.
  const reset = () => {
    const cw = cb.maxX - cb.minX;
    const ch = cb.maxY - cb.minY;
    if (cw <= 0 || ch <= 0) {
      setScale(1);
      setTx(0);
      setTy(0);
      return;
    }
    const sx = width / cw;
    const sy = height / ch;
    const fitScale = clamp(Math.min(sx, sy), minZoom, maxZoom);
    const ccx = (cb.minX + cb.maxX) / 2;
    const ccy = (cb.minY + cb.maxY) / 2;
    setScale(fitScale);
    setTx(width / 2 - ccx * fitScale);
    setTy(height / 2 - ccy * fitScale);
  };

  // Keyboard shortcuts when SVG focused.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onKey = (e) => {
      if (e.key === "+" || e.key === "=") {
        const nextScale = clamp(scale * 1.2, minZoom, maxZoom);
        const bounded = applyBounds(tx, ty, nextScale);
        setScale(nextScale);
        setTx(bounded.tx);
        setTy(bounded.ty);
      } else if (e.key === "-" || e.key === "_") {
        const nextScale = clamp(scale / 1.2, minZoom, maxZoom);
        const bounded = applyBounds(tx, ty, nextScale);
        setScale(nextScale);
        setTx(bounded.tx);
        setTy(bounded.ty);
      } else if (e.key === "0") {
        reset();
      }
    };
    svg.addEventListener("keydown", onKey);
    return () => svg.removeEventListener("keydown", onKey);
  }, [scale, tx, ty, minZoom, maxZoom]);

  return (
    <div className="panzoom-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={`panzoom-svg ${className} ${dragging ? "is-dragging" : ""}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        tabIndex={0}
        aria-label={ariaLabel}
      >
        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>{children}</g>
      </svg>
      <div className="panzoom-controls">
        <button
          type="button"
          className="panzoom-btn"
          onClick={() => {
            const next = clamp(scale * 1.2, minZoom, maxZoom);
            const bounded = applyBounds(tx, ty, next);
            setScale(next);
            setTx(bounded.tx);
            setTy(bounded.ty);
          }}
          title="Zoom in (+)"
          data-no-pan
        >
          +
        </button>
        <button
          type="button"
          className="panzoom-btn"
          onClick={() => {
            const next = clamp(scale / 1.2, minZoom, maxZoom);
            const bounded = applyBounds(tx, ty, next);
            setScale(next);
            setTx(bounded.tx);
            setTy(bounded.ty);
          }}
          title="Zoom out (−)"
          data-no-pan
        >
          −
        </button>
        <button
          type="button"
          className="panzoom-btn panzoom-btn--fit"
          onClick={reset}
          title="Fit tree to view (0) — use this if you get lost"
          data-no-pan
        >
          ⤢
        </button>
        <span className="panzoom-zoom muted" data-no-pan>
          {Math.round(scale * 100)}%
        </span>
      </div>
    </div>
  );
}
