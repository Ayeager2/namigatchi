// Boss-fight modal — turn-based combat UI (#40).
//
// Two phases:
//   1. Picker: list available bosses from getBossesAvailable(state).
//   2. Fight:  per-turn Attack / Spell / Item / Defend / Flee.
//
// Combat math runs client-side via combat.js rollPlayerAttack /
// rollFoeAttack. Spells + consumables dispatched mid-fight use the real
// CAST_SPELL / USE_TOOL paths (so spirit, fragments, inventory, and
// cooldowns all behave naturally). The modal tracks damage taken from the
// foe locally and commits the totals via actions.endBossFight() when the
// fight ends — that single dispatch applies the hp/sanity/spirit deltas,
// awards loot on victory, fires the firstDefeatLog + etching once, or
// applies the death-debuff cascade on defeat. See systems/boss.js.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAllBosses,
  getBossesAvailable,
  getBoss,
} from "../content/bosses.js";
import {
  rollPlayerAttack,
  rollFoeAttack,
  pickOpener,
  pickVictoryLine,
  pickDefeatLine,
  getEffectiveWeapon,
} from "../systems/combat.js";
import { getKnownSpells, canCastSpell } from "../systems/spells.js";
import { getAllTools } from "../content/tools.js";
import { canUseTool } from "../systems/consumables.js";

const FLEE_SUCCESS_CHANCE = 0.6;

function Bar({ label, current, max, accent = "hp" }) {
  const pct = Math.max(0, Math.min(1, current / max));
  return (
    <div className={`boss-bar boss-bar--${accent}`}>
      <span className="boss-bar-label">{label}</span>
      <div className="boss-bar-track">
        <div
          className="boss-bar-fill"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className="boss-bar-num">{Math.round(current)} / {max}</span>
    </div>
  );
}

function BossPicker({ state, available, onPick, onClose }) {
  return (
    <div className="boss-picker">
      <p className="muted">
        Bosses you can challenge right now. A defeat doesn't reset the run
        — but the cost will linger.
      </p>
      {available.length === 0 ? (
        <p className="muted">No challengers stand in your way yet.</p>
      ) : (
        <ul className="boss-list">
          {available.map((b) => {
            const beaten = !!state.persistent.bossesDefeated?.[b.id];
            return (
              <li key={b.id} className="boss-row">
                <div className="boss-row-head">
                  <span className="boss-row-icon" aria-hidden="true">
                    {b.icon}
                  </span>
                  <span className="boss-row-name">
                    {b.name}
                    <span className="boss-row-tag">
                      · Era {b.era} {b.tier === "main" ? "main" : "mini"}
                      {beaten ? " · beaten" : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onPick(b.id)}
                  >
                    Challenge
                  </button>
                </div>
                <p className="boss-row-desc muted">{b.description}</p>
                <p className="boss-row-stats muted">
                  HP {b.combat.hp} · acc {Math.round(b.combat.acc * 100)}%
                  · dmg {b.combat.damage.min}–{b.combat.damage.max}
                  {b.combat.damageType !== "hp"
                    ? ` (${b.combat.damageType})`
                    : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SpellPicker({ state, actions, onPick, onCancel }) {
  const known = getKnownSpells(state);
  if (known.length === 0) {
    return (
      <div className="boss-subpicker">
        <p className="muted">No spells known.</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Back
        </button>
      </div>
    );
  }
  return (
    <div className="boss-subpicker">
      <p className="muted">Pick a spell.</p>
      <ul className="boss-subpicker-list">
        {known.map((s) => {
          const check = canCastSpell(state, s.id);
          return (
            <li key={s.id} className="boss-subpicker-row">
              <span>{s.icon} {s.name}</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!check.ok}
                title={check.ok ? "Cast" : check.reason}
                onClick={() => {
                  actions.castSpell(s.id);
                  onPick(s);
                }}
              >
                Cast
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
        Back
      </button>
    </div>
  );
}

function ItemPicker({ state, actions, onPick, onCancel }) {
  const consumables = useMemo(() => {
    return getAllTools().filter(
      (t) => t.consumable && (state.run.inventory?.[t.id] || 0) > 0
    );
  }, [state.run.inventory]);
  if (consumables.length === 0) {
    return (
      <div className="boss-subpicker">
        <p className="muted">No usable items.</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Back
        </button>
      </div>
    );
  }
  return (
    <div className="boss-subpicker">
      <p className="muted">Pick an item.</p>
      <ul className="boss-subpicker-list">
        {consumables.map((t) => {
          const qty = state.run.inventory?.[t.id] || 0;
          const check = canUseTool(state, t.id);
          return (
            <li key={t.id} className="boss-subpicker-row">
              <span>{t.icon} {t.name} <span className="muted">× {qty}</span></span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!check.ok}
                title={check.ok ? "Use" : check.reason}
                onClick={() => {
                  actions.useTool(t.id);
                  onPick(t);
                }}
              >
                Use
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
        Back
      </button>
    </div>
  );
}

function BossFight({ state, actions, boss, onExit }) {
  const startStats = state.run.stats || {};
  const startHp = Math.round(startStats.hp ?? 100);
  const startSanity = Math.round(startStats.sanity ?? 50);
  const startSpirit = Math.round(startStats.spirit ?? 50);

  const [foeHp, setFoeHp] = useState(boss.combat.hp);
  const [damage, setDamage] = useState({ hp: 0, sanity: 0, spirit: 0 });
  const [log, setLog] = useState(() => [
    { kind: "opener", text: pickOpener(boss) },
  ]);
  const [phase, setPhase] = useState("player"); // player | foe | done
  const [outcome, setOutcome] = useState(null); // victory | defeat | flee
  const [defendQueued, setDefendQueued] = useState(false);
  const [subPicker, setSubPicker] = useState(null); // null | "spell" | "item"
  const committed = useRef(false);
  const logBottomRef = useRef(null);

  useEffect(() => {
    if (logBottomRef.current) {
      logBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [log]);

  // Player real stats this fight = state values minus accumulated damage.
  // Healing/spell effects mutate state.run.stats directly through real
  // dispatches, so the "current" reading auto-updates.
  const liveHp = Math.max(0, Math.round((state.run.stats?.hp ?? 0) - damage.hp));
  const liveSanity = Math.max(
    0,
    Math.round((state.run.stats?.sanity ?? 0) - damage.sanity)
  );
  const liveSpirit = Math.max(
    0,
    Math.round((state.run.stats?.spirit ?? 0) - damage.spirit)
  );

  const weapon = getEffectiveWeapon(state.run);

  function pushLog(entry) {
    setLog((l) => [...l, entry]);
  }

  function commit(finalOutcome, finalDamage) {
    if (committed.current) return;
    committed.current = true;
    actions.endBossFight({
      bossId: boss.id,
      outcome: finalOutcome,
      damage: finalDamage,
    });
  }

  function finishWithVictory(finalDamage) {
    pushLog({ kind: "victory", text: pickVictoryLine(boss) });
    setPhase("done");
    setOutcome("victory");
    commit("victory", finalDamage);
  }

  function finishWithDefeat(finalDamage) {
    pushLog({ kind: "defeat", text: pickDefeatLine(boss) });
    setPhase("done");
    setOutcome("defeat");
    commit("defeat", finalDamage);
  }

  function finishWithFlee(finalDamage) {
    pushLog({ kind: "flee", text: "🏃 You break off and stagger into the dust." });
    setPhase("done");
    setOutcome("flee");
    commit("flee", finalDamage);
  }

  function runFoeTurn(nextDamage) {
    const foe = rollFoeAttack(state, boss);
    let dmg = foe.dmg;
    let prefix = "";
    if (defendQueued && dmg > 0) {
      dmg = Math.floor(dmg / 2);
      prefix = "🛡️ Halved by your guard. ";
      setDefendQueued(false);
    }
    pushLog({ kind: foe.hit ? "foe-hit" : "foe-miss", text: prefix + foe.message });

    if (!foe.hit || dmg === 0) {
      setDamage(nextDamage);
      setPhase("player");
      return;
    }

    const updated = { ...nextDamage };
    if (foe.damageType === "sanity") updated.sanity += dmg;
    else if (foe.damageType === "spirit") updated.spirit += dmg;
    else updated.hp += dmg;
    setDamage(updated);

    // Check defeat: would current real stat drop below 1?
    const liveAfterHp = (state.run.stats?.hp ?? 0) - updated.hp;
    if (liveAfterHp <= 0) {
      finishWithDefeat(updated);
      return;
    }
    setPhase("player");
  }

  function onAttack() {
    if (phase !== "player") return;
    const hit = rollPlayerAttack(state, boss);
    pushLog({
      kind: hit.hit ? (hit.isCrit ? "player-crit" : "player-hit") : "player-miss",
      text: hit.message,
    });
    const nextFoeHp = Math.max(0, foeHp - hit.dmg);
    setFoeHp(nextFoeHp);
    if (nextFoeHp <= 0) {
      finishWithVictory(damage);
      return;
    }
    setPhase("foe");
    setTimeout(() => runFoeTurn(damage), 600);
  }

  function onDefend() {
    if (phase !== "player") return;
    setDefendQueued(true);
    pushLog({ kind: "defend", text: `🛡️ You set your stance. Their next blow lands soft.` });
    setPhase("foe");
    setTimeout(() => runFoeTurn(damage), 400);
  }

  function onSpellCast() {
    setSubPicker(null);
    pushLog({ kind: "spell", text: `✨ The word leaves your mouth.` });
    setPhase("foe");
    setTimeout(() => runFoeTurn(damage), 600);
  }

  function onItemUse() {
    setSubPicker(null);
    pushLog({ kind: "item", text: `🧪 You take the dose.` });
    setPhase("foe");
    setTimeout(() => runFoeTurn(damage), 600);
  }

  function onFlee() {
    if (phase !== "player") return;
    const success = Math.random() < FLEE_SUCCESS_CHANCE;
    if (success) {
      finishWithFlee(damage);
      return;
    }
    pushLog({ kind: "flee-fail", text: `❌ You can't break clear. They get a swing in.` });
    setPhase("foe");
    setTimeout(() => runFoeTurn(damage), 400);
  }

  const playerLocked = phase !== "player" || subPicker !== null;

  return (
    <div className="boss-fight">
      <div className="boss-fight-stats">
        <div className="boss-fight-foe">
          <div className="boss-fight-foe-head">
            <span className="boss-row-icon" aria-hidden="true">{boss.icon}</span>
            <span className="boss-fight-foe-name">{boss.name}</span>
          </div>
          <Bar label="Foe" current={foeHp} max={boss.combat.hp} accent="foe" />
        </div>
        <div className="boss-fight-player">
          <Bar label="HP" current={liveHp} max={100} accent="hp" />
          <Bar label="Sanity" current={liveSanity} max={100} accent="sanity" />
          <Bar label="Spirit" current={liveSpirit} max={100} accent="spirit" />
          <p className="muted boss-fight-weapon">
            Wielding: {weapon.icon || ""} {weapon.name}
          </p>
        </div>
      </div>

      <div className="boss-fight-log" role="log" aria-live="polite">
        {log.map((entry, i) => (
          <p key={i} className={`boss-fight-line boss-fight-line--${entry.kind}`}>
            {entry.text}
          </p>
        ))}
        <div ref={logBottomRef} />
      </div>

      {phase === "done" ? (
        <div className="boss-fight-end">
          <p className="boss-fight-end-label">
            {outcome === "victory" && "🏆 Victory."}
            {outcome === "defeat" && "💀 You fell."}
            {outcome === "flee" && "🏃 You escaped."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onExit}
          >
            Return
          </button>
        </div>
      ) : subPicker === "spell" ? (
        <SpellPicker
          state={state}
          actions={actions}
          onPick={onSpellCast}
          onCancel={() => setSubPicker(null)}
        />
      ) : subPicker === "item" ? (
        <ItemPicker
          state={state}
          actions={actions}
          onPick={onItemUse}
          onCancel={() => setSubPicker(null)}
        />
      ) : (
        <div className="boss-fight-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAttack}
            disabled={playerLocked}
          >
            ⚔️ Attack
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setSubPicker("spell")}
            disabled={playerLocked}
          >
            ✨ Spell
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setSubPicker("item")}
            disabled={playerLocked}
          >
            🧪 Item
          </button>
          <button
            type="button"
            className="btn"
            onClick={onDefend}
            disabled={playerLocked}
          >
            🛡️ Defend
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onFlee}
            disabled={playerLocked}
          >
            🏃 Flee
          </button>
        </div>
      )}
    </div>
  );
}

export default function BossFightModal({ state, actions, initialBossId, onClose }) {
  const available = useMemo(() => getBossesAvailable(state), [state]);
  const [pickedId, setPickedId] = useState(initialBossId || null);
  const boss = pickedId ? getBoss(pickedId) : null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal modal--boss"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={boss ? `Fight: ${boss.name}` : "Challenges"}
      >
        <header className="modal-header">
          <h2>{boss ? `⚔️ ${boss.name}` : "⚔️ Challenges"}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </header>
        <div className="modal-body">
          {boss ? (
            <BossFight
              state={state}
              actions={actions}
              boss={boss}
              onExit={onClose}
            />
          ) : (
            <BossPicker
              state={state}
              available={available}
              onPick={setPickedId}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Optional export for dev panel — full roster regardless of gating.
export function getAllBossesForDev() {
  return getAllBosses();
}
