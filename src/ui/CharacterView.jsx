// Character view (#44) — read-only three-panel stat sheet + equipment row.
//
// Three columns:
//   • Survival  — HP / Hunger / Thirst / Energy / Resolve / Sanity / Spirit
//                 (Spirit only renders Era 3+ to keep the surface honest)
//   • Bridge    — STR. Until #47 stat-modulation lands, STR is proxied by
//                 death-debuff magnitude (the inverse of "how broken am I").
//                 STR = 10 - floor(magnitude * 10), so a fresh body is 10
//                 and a fully cascaded death-debuff drops it to ~5.
//   • Combat    — DEX / SPD / MAG / Spirit / Armor. DEX/SPD/MAG are
//                 placeholders (gray dashes) until #47 wires the stat math.
//                 Armor reads from study completions (Wardweave etc.).
//
// Below the three panels: equipment row showing the 8 main slots + an
// expandable accessory tray (back, overArmor, talisman, rings).
//
// READ-ONLY. Equip/unequip is the #45 task. This page just surfaces what
// you've got so you can read your character at a glance.

import { useState } from "react";
import { SLOTS, getEquippable } from "../systems/equipment.js";
import { getPersonalArmor } from "../systems/combat.js";
import { getDeathDebuffMagnitude } from "../systems/death.js";
import { computeEra } from "../systems/era.js";

// ─── Stat tooltips (read by hover) ───────────────────────────────────
const STAT_TIPS = {
  hp: "Hit points. Drops from combat, dysentery, sanity collapse. At 0 you fall — death-debuff applies, the run does not reset.",
  hunger: "Rises over time and with heavy work. High hunger drains HP. Eat to lower it.",
  thirst: "Rises faster than hunger. High thirst drains HP. Drink water — boiled is safest.",
  energy: "Spent on actions (gather, build, fight). Low energy slows you down. Rest restores.",
  resolve: "Willpower. Drops from setbacks. Low Resolve dims most action gains.",
  sanity: "Your grip on the world. Damaged by demons, the void, the wrong words. At 0 the world stops making sense.",
  spirit: "Magical energy (Era 3+). Spent casting spells. Refills slowly; the Ritual converts fragments → spirit.",
  str: "Strength — the bridge stat. Carries weight, swings weapons, resists damage. Currently proxied by your death-debuff state (full health = 10, a fully cascaded debuff drops it toward 5). Real STR modulation lands with #47.",
  dex: "Dexterity — ranged accuracy and evasion. Placeholder until #47 wires the stat math.",
  spd: "Speed — action cooldowns. Placeholder until #47.",
  mag: "Magic — spell damage and effect magnitude. Placeholder until #47.",
  armor: "Personal armor — reduces hp damage from foes in combat. Sourced from study completions (Wardweave) and future armor crafts.",
};

function StatRow({ label, value, max, icon, tooltip, kind = "default", placeholder }) {
  return (
    <div
      className={`char-stat-row char-stat-row--${kind}`}
      title={tooltip || undefined}
    >
      <span className="char-stat-icon" aria-hidden="true">{icon}</span>
      <span className="char-stat-label">{label}</span>
      <span className="char-stat-value">
        {placeholder ? <span className="muted">—</span> : value}
        {max != null && !placeholder && (
          <span className="char-stat-max muted"> / {max}</span>
        )}
      </span>
    </div>
  );
}

function Slot({ slot, equipped, label }) {
  const cur = equipped?.[slot];
  if (cur?.twoHandedHeldIn) {
    return (
      <div className="char-slot is-locked" title={`Two-handed weapon held in ${cur.twoHandedHeldIn}`}>
        <span className="char-slot-label muted">{label}</span>
        <span className="char-slot-value muted">2h in {cur.twoHandedHeldIn}</span>
      </div>
    );
  }
  if (!cur) {
    return (
      <div className="char-slot is-empty">
        <span className="char-slot-label muted">{label}</span>
        <span className="char-slot-value muted">empty</span>
      </div>
    );
  }
  const def = getEquippable(cur.id);
  return (
    <div className="char-slot is-filled" title={def?.description || def?.name || cur.id}>
      <span className="char-slot-label muted">{label}</span>
      <span className="char-slot-value">
        <span aria-hidden="true">{def?.icon || ""}</span> {def?.name || cur.id}
      </span>
    </div>
  );
}

export default function CharacterView({ state }) {
  const [accessoriesOpen, setAccessoriesOpen] = useState(false);
  const stats = state?.run?.stats || {};
  const equipped = state?.run?.equipped || {};
  const era = computeEra(state);
  const showSpirit = era >= 3;

  // STR proxy: 10 - floor(magnitude * 10). Magnitude 0 → STR 10.
  // Magnitude 0.5 → STR 5. Until #47, this is the bridge stat readout.
  const ddMag = getDeathDebuffMagnitude(state.run);
  const str = Math.max(0, 10 - Math.floor(ddMag * 10));
  const armor = getPersonalArmor(state);

  const rings = Array.isArray(equipped.rings) ? equipped.rings : [];
  const filledRings = rings.filter(Boolean).length;
  const accessoryFilled =
    (equipped.back ? 1 : 0) +
    (equipped.overArmor ? 1 : 0) +
    (equipped.talisman ? 1 : 0) +
    filledRings;

  return (
    <section className="action-panel action-panel--character">
      <div className="panel-header">
        <h2>Character</h2>
        <p className="muted">
          The body, the bridge, the mind. Read-only for now — equipping moves to a dedicated panel (#45).
        </p>
      </div>

      <div className="char-grid">
        {/* ─── Survival column ─── */}
        <div className="char-col char-col--survival">
          <h3 className="char-col-title">Survival</h3>
          <StatRow label="HP" value={Math.round(stats.hp ?? 100)} max={100} icon="❤️" tooltip={STAT_TIPS.hp} kind="hp" />
          <StatRow label="Hunger" value={Math.round(stats.hunger ?? 0)} max={100} icon="🍽️" tooltip={STAT_TIPS.hunger} />
          <StatRow label="Thirst" value={Math.round(stats.thirst ?? 0)} max={100} icon="💧" tooltip={STAT_TIPS.thirst} />
          <StatRow label="Energy" value={Math.round(stats.energy ?? 100)} max={100} icon="⚡" tooltip={STAT_TIPS.energy} />
          <StatRow label="Resolve" value={Math.round(stats.happiness ?? 50)} max={100} icon="✦" tooltip={STAT_TIPS.resolve} kind="resolve" />
          <StatRow label="Sanity" value={Math.round(stats.sanity ?? 50)} max={100} icon="◐" tooltip={STAT_TIPS.sanity} kind="sanity" />
          {showSpirit && (
            <StatRow label="Spirit" value={Math.round(stats.spirit ?? 50)} max={100} icon="✨" tooltip={STAT_TIPS.spirit} kind="spirit" />
          )}
        </div>

        {/* ─── Bridge column ─── */}
        <div className="char-col char-col--bridge">
          <h3 className="char-col-title">Bridge</h3>
          <StatRow label="STR" value={str} max={10} icon="💪" tooltip={STAT_TIPS.str} kind="str" />
          {ddMag > 0 && (
            <p className="muted char-col-note">
              ⚠️ Death-debuff active (magnitude {Math.round(ddMag * 100)}%).
              Eat to recover — STR rises as the cascade lifts.
            </p>
          )}
          {ddMag === 0 && (
            <p className="muted char-col-note">
              Bridge stats connect Survival to Combat. Real STR modulation lands with #47.
            </p>
          )}
        </div>

        {/* ─── Combat column ─── */}
        <div className="char-col char-col--combat">
          <h3 className="char-col-title">Combat</h3>
          <StatRow label="DEX" icon="🎯" tooltip={STAT_TIPS.dex} placeholder />
          <StatRow label="SPD" icon="💨" tooltip={STAT_TIPS.spd} placeholder />
          <StatRow label="MAG" icon="🪄" tooltip={STAT_TIPS.mag} placeholder />
          {showSpirit && (
            <StatRow label="Spirit" value={Math.round(stats.spirit ?? 50)} max={100} icon="✨" tooltip={STAT_TIPS.spirit} kind="spirit" />
          )}
          <StatRow label="Armor" value={armor} icon="🛡️" tooltip={STAT_TIPS.armor} />
        </div>
      </div>

      {/* ─── Equipment row ─── */}
      <div className="char-equipment">
        <h3 className="char-equip-title">Equipment</h3>
        <div className="char-slots char-slots--main">
          <Slot slot={SLOTS.HEAD} equipped={equipped} label="Head" />
          <Slot slot={SLOTS.CHEST} equipped={equipped} label="Chest" />
          <Slot slot={SLOTS.LEGGINGS} equipped={equipped} label="Legs" />
          <Slot slot={SLOTS.BOOTS} equipped={equipped} label="Boots" />
          <Slot slot={SLOTS.GLOVES} equipped={equipped} label="Gloves" />
          <Slot slot={SLOTS.HAND_LEFT} equipped={equipped} label="Left hand" />
          <Slot slot={SLOTS.HAND_RIGHT} equipped={equipped} label="Right hand" />
          <Slot slot={SLOTS.RANGED} equipped={equipped} label="Ranged" />
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm char-accessories-toggle"
          onClick={() => setAccessoriesOpen((v) => !v)}
        >
          {accessoriesOpen ? "Hide" : "Show"} accessories
          {accessoryFilled > 0 && (
            <span className="char-accessories-count"> ({accessoryFilled} filled)</span>
          )}
        </button>

        {accessoriesOpen && (
          <div className="char-slots char-slots--accessories">
            <Slot slot={SLOTS.BACK} equipped={equipped} label="Back" />
            <Slot slot={SLOTS.OVER_ARMOR} equipped={equipped} label="Over-armor" />
            <Slot slot={SLOTS.TALISMAN} equipped={equipped} label="Talisman" />
            {rings.map((r, i) => (
              <div
                key={`ring-${i}`}
                className={`char-slot ${r ? "is-filled" : "is-empty"}`}
                title={r ? getEquippable(r.id)?.description : "Empty ring slot"}
              >
                <span className="char-slot-label muted">Ring {i + 1}</span>
                <span className={`char-slot-value ${r ? "" : "muted"}`}>
                  {r ? (
                    <>
                      <span aria-hidden="true">{getEquippable(r.id)?.icon || ""}</span>{" "}
                      {getEquippable(r.id)?.name || r.id}
                    </>
                  ) : (
                    "empty"
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
