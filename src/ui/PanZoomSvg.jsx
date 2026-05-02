// Shared pan + zoom container for SVG-based tree modals (buildings, teachings).
//
// Props:
//   width, height — viewBox dimensions of the underlying tree
//   children       — SVG content (already laid out in those coords)
//   minZoom, maxZoom — clamp range (default 0.5..2.5)
//
// React quirk that bit us (bug #004): React attaches `onWheel` as a passive
// listener by default, which means `e.preventDefault()` is silently ignored
// and the page scrolls behind the modal. Workaround: attach the wheel
// handler manually with `addEventListener(..., { passive: false })`.

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

  // Latest scale/tx/ty for the wheel handler (which is registered once).
  const latestRef = useRef({ scale, tx, ty });
  latestRef.current = { scale, tx, ty };

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
      const bounded = applyBounds(newTx, newTy, nextScale);
      setScale(nextScale);
      setTx(bounded.tx);
      setTy(bounded.ty);
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, minZoom, maxZoom]);

  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
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
