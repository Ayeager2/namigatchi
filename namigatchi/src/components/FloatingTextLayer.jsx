import React from "react";
import "./fx.css";

export default function FloatingTextLayer({ floats }) {
  return (
    <div className="fx-layer" aria-hidden="true">
      {floats.map((f) => (
        <div
          key={f.id}
          className={`fx-float fx-${f.type}`}
          style={{
            left: `${f.x * 100}%`,
            top: `${f.y * 100}%`,
          }}
        >
          {f.text}
        </div>
      ))}
    </div>
  );
}
