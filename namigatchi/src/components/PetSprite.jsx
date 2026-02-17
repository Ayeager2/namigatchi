// src/components/PetSprite.jsx
import React, { useMemo } from "react";
import { getVisualState, getVisualClass, VISUAL } from "../tama/visualState";

const emojiFor = (v) => {
  switch (v) {
    case VISUAL.DEAD: return "🪦";
    case VISUAL.SLEEP: return "😴";
    case VISUAL.TANTRUM: return "😡";
    case VISUAL.SICK: return "🤒";
    case VISUAL.INJURED: return "🤕";
    case VISUAL.POOP: return "💩";
    case VISUAL.STINKY: return "🦨";
    case VISUAL.NEEDY: return "🥺";
    case VISUAL.TIRED: return "🥱";
    case VISUAL.BORED: return "😐";
    case VISUAL.HAPPY: return "😊";
    default: return "🙂";
  }
};

export default function PetSprite({ state, mood, size = 96 }) {
  const visual = useMemo(() => getVisualState(state, mood), [state, mood]);
  const className = useMemo(() => getVisualClass(visual), [visual]);
  const icon = emojiFor(visual);

  return (
    <div
      className={className}
      style={{
        width: size * 2.2,
        border: "1px solid #e5e5e5",
        borderRadius: 16,
        padding: 16,
        display: "grid",
        placeItems: "center",
        background: "#fafafa",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: size, lineHeight: 1 }}>
        {icon}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        {state.formName} • {visual}
      </div>
    </div>
  );
}
