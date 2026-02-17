import React, { useState } from "react";
import { useTamagotchi } from "../hooks/useTamagotchi";
import PetSprite from "./PetSprite";
import ShopPanel from "./ShopPanel";
import { useFloatingText } from "../hooks/useFloatingText";
import FloatingTextLayer from "./FloatingTextLayer";
import "./fx.css";

function Bar({ label, value, invert }) {
  const display = invert ? 100 - value : value;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{label}</strong>
        <span>{Math.round(display)}%</span>
      </div>
      <div style={{ height: 10, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${display}%`, height: "100%", background: "#999" }} />
      </div>
    </div>
  );
}

export default function TamaPanel() {
  const { state, mood, severity, actions } = useTamagotchi({ storageKey: "tama-save-v2" });
  const [newName, setNewName] = useState(state.name);
  const { floats, addFloat } = useFloatingText();

  const disabled = !state.alive;

  return (
    <div style={{ maxWidth: 520, padding: 16, border: "1px solid #ddd", borderRadius: 14 , position: "relative"}}>
      <FloatingTextLayer floats={floats} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>
          {state.name} {state.alive ? "" : "💀"} <span style={{ fontSize: 14, opacity: 0.7 }}>({state.formName})</span>
        </h2>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Mood: <strong>{mood}</strong> • Stage: <strong>{state.stage}</strong>
        </div>
      </div>

      <div style={{ marginTop: 10, marginBottom: 10, fontSize: 13 }}>
        <div>
          Age: <strong>{Math.floor(state.ageMinutes)}</strong> min • Coins: <strong>{state.coins}</strong> • Weight:{" "}
          <strong>{state.weight.toFixed(1)}</strong>
        </div>
        <div>
          Status:{" "}
          <strong>
            {state.sleeping ? "Sleeping" : "Awake"}
            {state.sick ? " • Sick" : ""}
            {state.injured ? " • Injured" : ""}
            {state.calling ? " • Calling!" : ""}
            {state.tantrum ? " • Tantrum!" : ""}
          </strong>
        </div>
        <div>Poop piles: <strong>{state.poops}</strong> • Need severity: <strong>{Math.round(severity)}</strong></div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <PetSprite state={state} mood={mood} size={84} />
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <div><strong>Tip:</strong> If you see 💩, hit Clean.</div>
          <div>If it’s 😡, try Discipline.</div>
          <div>If it’s 🤒/🤕, use Medicine/Bandage.</div>
        </div>
      </div>

      <Bar label="Health" value={state.health} />
      <Bar label="Energy" value={state.energy} />
      <Bar label="Fun" value={state.fun} />
      <Bar label="Hygiene" value={state.hygiene} />
      <Bar label="Hunger" value={state.hunger} invert />
      <Bar label="Thirst" value={state.thirst} invert />
      <Bar label="Affection" value={state.affection} />
      <Bar label="Discipline" value={state.discipline} />
      <Bar label="Neglect" value={state.neglect} />

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      <button
        className="fx-btn fx-btn--good"
        onClick={() => {
          actions.feed();
          addFloat("-HUNGER", { type: "good", x: 0.5, y: 0.25 });
        }}
        disabled={disabled}
      >
        Feed
      </button>

      <button
        className="fx-btn fx-btn--good"
        onClick={() => {
          actions.water();
          addFloat("-THIRST", { type: "good", x: 0.52, y: 0.25 });
        }}
        disabled={disabled}
      >
        Water
      </button>

      <button
        className="fx-btn fx-btn--good"
        onClick={() => {
          actions.play();
          addFloat("+FUN", { type: "good", x: 0.5, y: 0.25 });
          addFloat("+1 💰", { type: "neutral", x: 0.62, y: 0.28 });
        }}
        disabled={disabled || state.sleeping}
      >
        Play
      </button>

      <button
        className="fx-btn fx-btn--good"
        onClick={() => {
          actions.clean();
          addFloat("+HYGIENE", { type: "good", x: 0.5, y: 0.25 });
          if ((state.poops ?? 0) > 0) addFloat("💩 CLEARED", { type: "neutral", x: 0.62, y: 0.3 });
        }}
        disabled={disabled}
      >
        Clean
      </button>

      <button
        className="fx-btn fx-btn--good"
        onClick={() => {
          actions.medicine();
          if (state.sick) {
            addFloat("MEDICINE", { type: "neutral", x: 0.5, y: 0.22 });
            addFloat("+HEALTH", { type: "good", x: 0.62, y: 0.28 });
          } else {
            addFloat("Not sick", { type: "neutral", x: 0.5, y: 0.22 });
          }
        }}
        disabled={disabled}
      >
        Medicine
      </button>

      <button
        className="fx-btn fx-btn--good"
        onClick={() => {
          actions.bandage();
          if (state.injured) {
            addFloat("BANDAGE", { type: "neutral", x: 0.5, y: 0.22 });
            addFloat("+HEALTH", { type: "good", x: 0.62, y: 0.28 });
          } else {
            addFloat("Not injured", { type: "neutral", x: 0.5, y: 0.22 });
          }
        }}
        disabled={disabled}
      >
        Bandage
      </button>

      <button
        className="fx-btn"
        onClick={() => {
          actions.discipline();
          addFloat("DISCIPLINE", { type: "neutral", x: 0.5, y: 0.22 });
          if (state.tantrum) addFloat("Tantrum ↓", { type: "good", x: 0.62, y: 0.28 });
          if (state.calling) addFloat("Call ↓", { type: "good", x: 0.62, y: 0.3 });
        }}
        disabled={disabled || state.sleeping}
      >
        Discipline
      </button>

      {state.sleeping ? (
        <button
          className="fx-btn"
          onClick={() => {
            actions.wake();
            addFloat("WAKE", { type: "neutral", x: 0.5, y: 0.22 });
          }}
          disabled={disabled}
        >
          Wake
        </button>
      ) : (
        <button
          className="fx-btn"
          onClick={() => {
            actions.sleep();
            addFloat("SLEEP", { type: "neutral", x: 0.5, y: 0.22 });
          }}
          disabled={disabled}
        >
          Sleep
        </button>
      )}

      <button
        className="fx-btn fx-btn--good"
        onClick={() => {
          const res = actions.miniGameGuess(Date.now());
          // res might be undefined depending on your implementation, so guard it
          if (res?.win) {
            addFloat("YOU WIN!", { type: "good", x: 0.5, y: 0.22 });
            addFloat("+COINS", { type: "neutral", x: 0.62, y: 0.28 });
          } else {
            addFloat("Nice try", { type: "neutral", x: 0.5, y: 0.22 });
            addFloat("+1 💰", { type: "neutral", x: 0.62, y: 0.28 });
          }
        }}
        disabled={disabled || state.sleeping}
        title="Simple mini-game reward"
      >
        Mini-game
      </button>

      <button
        className="fx-btn"
        onClick={() => {
          actions.reset();
          addFloat("RESET", { type: "neutral", x: 0.5, y: 0.22 });
        }}
      >
        Reset
      </button>
    </div>


      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 10, border: "1px solid #ddd" }}
          placeholder="New name"
        />
        <button onClick={() => actions.rename(newName)} disabled={!newName.trim()}>
          Rename
        </button>
      </div>

      <ShopPanel state={state} actions={actions} addFloat={addFloat} />
      <div
        className={state.tantrum ? "fx-shake" : ""}
        style={{
          maxWidth: 520,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 14,
          position: "relative",
        }}
      >
        <FloatingTextLayer floats={floats} />
        ...
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Log</div>
        <div style={{ maxHeight: 140, overflow: "auto", border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
          {(state.log || []).length === 0 ? (
            <div style={{ opacity: 0.7 }}>No events yet.</div>
          ) : (
            state.log.map((e, idx) => (
              <div key={idx} style={{ fontSize: 12, marginBottom: 6 }}>
                <span style={{ opacity: 0.6 }}>{new Date(e.t).toLocaleTimeString()}:</span> {e.msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
