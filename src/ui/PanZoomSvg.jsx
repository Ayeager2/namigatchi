// Shared pan + zoom container for SVG-based tree modals (buildings, teachings).
//
// Props:
//   width, height — viewBox dimensions of the underlying tree
//   children       — SVG content (already laid out in those coords)
//   minZoom, maxZoom — clamp range (default 0.5..2.5)
//
// Features:
//   - Click and drag (pointer events) to pan
//   - Mouse wheel to zoom toward the cursor
//   - "Fit" button resets translation/scale
//   - +/-/0 keyboard shortcuts (when focused) for accessibility
//   - Bounded panning so the tree can't be lost off-screen entirely
//
// Implementation note: we pan/zoom by transforming a single <g> wrapping the
// children. The outer SVG keeps its original viewBox; the transform maps it
// to whatever the user has dragged/zoomed to.

import { useEffect, useRef, useState } from "react";

export default function PanZoomSvg({
  width,
  height,
  children,
  minZoom = 0.5,
  maxZoom = 2.5,
  className = "",
  ariaLabel,
}) {
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Convert client coordinates to SVG coordinates given the current viewBox.
  const clientToSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * width;
    const y = ((clientY - rect.top) / rect.height) * height;
    return { x, y };
  };

  // Bound pan so the tree stays in view. Roughly: at scale=1, pan range is
  // half the canvas in each direction. At higher zoom, we allow more pan.
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const applyBounds = (nextTx, nextTy, nextScale) => {
    const rangeX = (width * (nextScale - 0.4)) / 2;
    const rangeY = (height * (nextScale - 0.4)) / 2;
    return {
      tx: clamp(nextTx, -rangeX, rangeX),
      ty: clamp(nextTy, -rangeY, rangeY),
    };
  };

  const onPointerDown = (e) => {
    // Don't start a pan if the click hit an interactive node.
    if (e.target.closest("[data-no-pan]")) return;
    setDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
    if (e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {
        /* ignore — some elements don't support capture */
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
    const next = applyBounds(dragRef.current.tx + svgDx, dragRef.current.ty + svgDy, scale);
    setTx(next.tx);
    setTy(next.ty);
  };

  const onPointerUp = () => {
    setDragging(false);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.1 : 1 / 1.1;
    const nextScale = clamp(scale * factor, minZoom, maxZoom);
    if (nextScale === scale) return;
    // Zoom toward the cursor — adjust translation so the SVG point under
    // the cursor stays under the cursor.
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    // Current SVG coord under cursor in pre-transform space:
    const cx = (x - tx) / scale;
    const cy = (y - ty) / scale;
    // Target translation so (cx, cy) maps to (x, y) at next scale:
    const newTx = x - cx * nextScale;
    const newTy = y - cy * nextScale;
    const bounded = applyBounds(newTx, newTy, nextScale);
    setScale(nextScale);
    setTx(bounded.tx);
    setTy(bounded.ty);
  };

  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };

  // Keyboard shortcuts when the SVG has focus.
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
        onWheel={onWheel}
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
            setScale(next);
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
            setScale(next);
          }}
          title="Zoom out (-)"
          data-no-pan
        >
          −
        </button>
        <button
          type="button"
          className="panzoom-btn"
          onClick={reset}
          title="Fit (0)"
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
