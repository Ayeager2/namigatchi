// Combat resolution — passive multi-round fight loop with rich log
// narration. Task #33 (Combat Phase 2).
//
// Locked: passive resolution, no modal. Routine encounters happen during
// gather/hunt and resolve automatically in 3–8 log lines. Boss fights
// (#40) get their own turn-based modal later; this file handles the
// everyday combat that fills the era arcs.
//
// Fight loop:
//   1. Pick opener narration (intro the foe).
//   2. Each round: player attacks, then threat (if alive) attacks.
//   3. Hit math: rng() < (attacker.acc - target.eva). If hit, roll damage
//      [min, max], crit doubles, subtract target armor, apply HP delta.
//   4. Log a narration line per attack (hit / miss / crit).
//   5. End condition: foe HP ≤ 0 (victory) | player HP ≤ 0 (defeat) |
//      MAX_ROUNDS cap (stalemate — flee).
//   6. Apply combat durability wear once at the end via applyToolWear.
//
// What this file reads:
//   • run.equipped → equipped weapon's weaponStats (Phase 1 / #32)
//   • run.studyStatBonuses.armor → from Wardweave (#31)
//   • run.stats → current hp/sanity/spirit
//   • getDefense(state) → settlement defense (existing). Phase 1 of #39
//     leaves this contributing to combat too — Phase 2/E will split.
//
// What this file does NOT yet do:
//   • Per-stat damage routing for sanity/spirit threats — Phase 2 ships
//     hp-only combat-class threats. The hook is in place (damageType
//     field) but no horror/arcane combat threats are authored yet.
//   • Death-debuff (#50) — combat death stubbed to revive at 1 HP with
//     a TODO marker until #50 lands.
//   • Combat-skill XP (#34) — wired in the next phase.
//
// See ERA_PLAN.md "Combat + Weapons + Specialized Skills" for the design.

import {
  getEquippedMeleeDef,
  getEquippedRangedDef,
} from "./equipment.js";
import { applyToolWear } from "./crafting.js";
import { applyEffect } from "./survival.js";
import { getStudyStatBonuses } from "./studies.js";
import { applyDeathDebuff } from "./death.js";
import { randInt } from "../util/rng.js";

// Note: `getDefense` from systems/defense.js is no longer imported here.
// Per Task #39 (locked 2026-05), `defense` is the SETTLEMENT stat — it
// protects your structures from raids and food theft (resolveThreat in
// threats.js). It does NOT reduce personal combat damage anymore. Only
// the `armor` stat (currently sourced from study completions like
// Wardweave) reduces hits in the fight loop. Walls don't help when a
// wild dog jumps you in the wilderness.

// ─── Constants ─────────────────────────────────────────────────────────

// Hard cap on rounds — keeps a misconfigured fight from infinite-looping.
const MAX_ROUNDS = 12;

// Player's default evasion before DEX (#47) lands. Tiny — fights feel
// honest, not luck-driven.
const PLAYER_BASE_EVA = 0.05;

// Fallback "weapon" when nothing is equipped. The player CAN fight bare-
// handed; the numbers warn them not to.
const FISTS = {
  id: "_fists",
  name: "your fists",
  icon: "👊",
  weaponStats: { damage: [1, 2], acc: 0.6, crit: 0.02, type: "melee" },
};

// ─── Narration templates (fallbacks) ──────────────────────────────────
//
// Each line supports {weapon}, {threat}, {dmg} substitutions. Threat defs
// can provide their own pools via `combatFlavor.attack` / `.miss` etc.;
// these are the fallback pools when a threat doesn't.

const PLAYER_HIT_LINES = [
  "You raise the {weapon}. The strike lands. {dmg} dmg.",
  "{weapon} bites cleanly. {dmg} dmg.",
  "You step in. {weapon} connects. {dmg} dmg.",
  "A solid swing. {dmg} dmg.",
];
const PLAYER_CRIT_LINES = [
  "The {weapon} finds the soft place. The hit doubles. {dmg} dmg.",
  "Critical — {weapon} lands true. {dmg} dmg.",
  "You see the opening and take it. The {weapon} answers. {dmg} dmg.",
];
const PLAYER_MISS_LINES = [
  "{weapon} bites air.",
  "Your swing falls wide. The {threat} sidesteps.",
  "You overcommit. {weapon} passes harmless.",
  "A near miss. The {threat} pulls back unhurt.",
];
const THREAT_ATTACK_LINES = [
  "The {threat} strikes. {dmg} dmg.",
  "{threat} closes and hits hard. {dmg} dmg.",
];
const THREAT_MISS_LINES = [
  "The {threat} misses.",
  "Their swing falls short. They reset.",
];
const VICTORY_LINES = [
  "The {threat} falls. You stand over it, breathing hard.",
  "It drops. You step back. The wasteland takes it.",
];
const DEFEAT_LINES = [
  "Your legs give out. The world greys at the edges.",
  "You take one too many. The world goes dark.",
];

// ─── Helpers ──────────────────────────────────────────────────────────

function pickRandom(arr, rng) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

function substitute(template, subs) {
  if (!template) return "";
  return Object.entries(subs).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

function getEffectiveWeapon(run) {
  // Prefer melee — most fights are at close range. Fall back to ranged if
  // the player only has a bow, and fists if nothing is wielded.
  const melee = getEquippedMeleeDef(run);
  if (melee && melee.weaponStats) return melee;
  const ranged = getEquippedRangedDef(run);
  if (ranged && ranged.weaponStats) return ranged;
  return FISTS;
}

// Personal armor — Wardweave (#31 study) + future armor crafts + Light-
// path enchants (#37). Phase 2 reads this hook so Wardweave-completing
// players see their +2 armor in fight math today.
function getPersonalArmor(state) {
  const bonuses = getStudyStatBonuses(state.run);
  return bonuses.armor || 0;
}

// ─── Main resolver ────────────────────────────────────────────────────

export function resolveFight(state, threatDef, rng = Math.random) {
  const weapon = getEffectiveWeapon(state.run);
  const wStats = weapon.weaponStats || FISTS.weaponStats;
  const cb = threatDef.combat || {};
  const threatAcc = cb.acc ?? 0.7;
  const threatEva = cb.eva ?? 0.05;
  const threatDmg = cb.damage || { min: 2, max: 4 };
  const damageType = cb.damageType || "hp";

  // Starting stats — track local copies, push back to applyEffect at the
  // end (so we get the same clamping as everywhere else).
  const startStats = state.run.stats || {};
  let playerHp = startStats.hp ?? 100;
  let playerSanity = startStats.sanity ?? 50;
  let playerSpirit = startStats.spirit ?? 50;
  let foeHp = cb.hp ?? 10;

  const playerArmor = getPersonalArmor(state);
  // Task #39 (locked): combat damage is reduced ONLY by personal `armor`.
  // The settlement `defense` stat applies to raids on structures (handled
  // by resolveThreat in threats.js), not to attacks on the player.

  const events = [];
  const flavor = threatDef.combatFlavor || {};

  // Opener
  const openerLine = pickRandom(flavor.opener, rng);
  events.push({
    kind: "combat",
    message:
      openerLine ||
      `⚔️ A ${threatDef.name} closes the distance.`,
  });

  // ─── Fight rounds ────────────────────────────────────────────────
  let round = 0;
  let outcome = "stalemate";
  while (round < MAX_ROUNDS) {
    round++;

    // PLAYER TURN
    const playerHitRoll = rng();
    const playerHits = playerHitRoll < (wStats.acc - threatEva);
    if (playerHits) {
      const [lo, hi] = wStats.damage;
      let dmg = randInt(rng, lo, hi);
      const isCrit = rng() < (wStats.crit || 0);
      if (isCrit) dmg *= 2;
      foeHp = Math.max(0, foeHp - dmg);
      const line = isCrit
        ? pickRandom(PLAYER_CRIT_LINES, rng)
        : pickRandom(PLAYER_HIT_LINES, rng);
      events.push({
        kind: "combat",
        message: substitute(line, {
          weapon: weapon.name,
          threat: threatDef.name,
          dmg,
        }),
      });
    } else {
      const line = pickRandom(PLAYER_MISS_LINES, rng);
      events.push({
        kind: "combat",
        message: substitute(line, {
          weapon: weapon.name,
          threat: threatDef.name,
        }),
      });
    }

    if (foeHp <= 0) {
      outcome = "victory";
      break;
    }

    // THREAT TURN
    const threatHitRoll = rng();
    const threatHits = threatHitRoll < (threatAcc - PLAYER_BASE_EVA);
    if (threatHits) {
      const raw = randInt(rng, threatDmg.min, threatDmg.max);
      // Armor reduction. hp-damage threats are softened by personal
      // armor (#39); sanity/spirit damage isn't reduced by armor (the
      // mind has no armor — see #42 for the broader stat-damage system).
      let reduced = raw;
      if (damageType === "hp") {
        reduced = Math.max(0, raw - playerArmor);
      }
      // Apply to the right stat
      if (damageType === "sanity") {
        playerSanity = Math.max(0, playerSanity - reduced);
      } else if (damageType === "spirit") {
        playerSpirit = Math.max(0, playerSpirit - reduced);
      } else {
        playerHp = Math.max(0, playerHp - reduced);
      }
      const line =
        pickRandom(flavor.attack, rng) || pickRandom(THREAT_ATTACK_LINES, rng);
      events.push({
        kind: "combat",
        message: substitute(line, {
          threat: threatDef.name,
          weapon: weapon.name,
          dmg: reduced,
        }),
      });
    } else {
      const line =
        pickRandom(flavor.miss, rng) || pickRandom(THREAT_MISS_LINES, rng);
      events.push({
        kind: "combat",
        message: substitute(line, {
          threat: threatDef.name,
          weapon: weapon.name,
        }),
      });
    }

    if (playerHp <= 0) {
      outcome = "defeat";
      break;
    }
  }

  // ─── Closer ──────────────────────────────────────────────────────
  if (outcome === "victory") {
    const line =
      pickRandom(flavor.victory, rng) || pickRandom(VICTORY_LINES, rng);
    events.push({
      kind: "combat",
      message: substitute(line, { threat: threatDef.name }),
    });
  } else if (outcome === "defeat") {
    const line =
      pickRandom(flavor.defeat, rng) || pickRandom(DEFEAT_LINES, rng);
    events.push({
      kind: "combat",
      message: substitute(line, { threat: threatDef.name }),
    });
    // Death cascade lands here (#50). The defeat narration is the last
    // combat line; what follows is the "wake at home" beat plus the
    // stat cascade. We apply the debuff to a snapshot that already
    // includes any combat damage taken this fight — playerHp/sanity/
    // spirit are baked into the partial-newStats below before we call
    // applyDeathDebuff.
    //
    // Note: applyDeathDebuff will compute its own scaled stats from
    // whatever the current run.stats are. We pre-stage the post-fight
    // stats into `run` so the cascade scales those, not the pre-fight
    // values.
  } else {
    events.push({
      kind: "combat",
      message:
        "⚔️ The fight grinds past patience. You break off and stagger away.",
    });
  }

  // Apply stat deltas through applyEffect so clamping is consistent.
  const newStats = applyEffect(state.run.stats || {}, {
    hp: playerHp - (startStats.hp ?? 100),
    sanity: playerSanity - (startStats.sanity ?? 50),
    spirit: playerSpirit - (startStats.spirit ?? 50),
  });

  let run = { ...state.run, stats: newStats };

  // ─── Death cascade (#50) ────────────────────────────────────────────
  // If the player went to 0 HP this fight, apply the death-debuff. This
  // replaces the previous "revive at 1 HP" stub. The cascade scales every
  // survival stat by the debuff magnitude, lifts HP back to a minimum 1,
  // and records the debuff status. The player wakes at home (or hut).
  // Recovery happens via food eating (see survival.js + content/resources.js
  // deathDebuffRecovery).
  if (outcome === "defeat") {
    const dd = applyDeathDebuff(run);
    run = dd.run;
    events.push(...dd.events);
  }

  // Tick combat wear on the equipped weapon. applyToolWear iterates both
  // tools and weapons (see crafting.js) so durability ticks correctly
  // whether the player wields a Stone Axe (tool with wearsOn: "gather"
  // — won't tick here) or a Stone Mace (weapon with wearsOn: "combat" —
  // will tick).
  const wear = applyToolWear(run, "combat");
  run = wear.run;
  events.push(...wear.events);

  return {
    run,
    persistent: state.persistent,
    events,
    outcome,
    threatId: threatDef.id,
  };
}
