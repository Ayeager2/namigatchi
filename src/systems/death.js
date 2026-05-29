// Death-debuff system — Task #50. Locked design (AskUserQuestion 2026-05):
//
// Combat death is no longer a run reset. Instead:
//   1. STR takes a flat % hit (the magnitude). First death magnitude is
//      0.5; subsequent deaths within a run stack (capped at 0.95).
//      Currently STR isn't a stat yet (#47), so the magnitude tracks the
//      cascade scalar but doesn't drain STR directly.
//   2. The magnitude cascades to every other survival stat in the
//      "waking up half-dead" direction:
//        HP / Energy / Happiness / Sanity / Spirit → raw × (1 − magnitude)
//        Hunger / Thirst → raw + (100 − raw) × magnitude   (climbs toward max)
//   3. Player wakes at Home (or Hut, or the bare ground) with narration.
//   4. Recovery: every food consumed shaves magnitude by the food's
//      `deathDebuffRecovery` rate. When magnitude hits 0, the debuff
//      lifts and a quiet event fires.
//
// Pairs with:
//   • #33 combat.js — calls applyDeathDebuff on combat HP=0 instead of
//     the previous "revive at 1 HP" stub.
//   • #42 stat-damage — death-debuff is the *severe* form: a coordinated
//     cascade rather than per-threat per-stat drains.
//   • Food/potion defs in content/resources.js + content/tools.js have
//     deathDebuffRecovery rates: grubs 0.05, bird_meat 0.12, cooked
//     versions higher, Mending Potion 0.30 (the panic button).
//
// Status shape (lives under run.statuses.deathDebuff):
//   { active: true, magnitude: 0.5, startedAt: ms, deaths: 1 }

// Magnitude added per death. First death from neutral hits 0.5; second
// consecutive death (still debuffed) caps to 0.95.
const PER_DEATH_MAGNITUDE = 0.5;
const MAX_MAGNITUDE = 0.95;

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function isDebuffed(run) {
  return !!run?.statuses?.deathDebuff?.active;
}

export function getDeathDebuffMagnitude(run) {
  if (!isDebuffed(run)) return 0;
  return run.statuses.deathDebuff.magnitude || 0;
}

// Wake-up location flavor — narrates where the player rolls over.
function wakeNarration(run) {
  if (run?.built?.home) {
    return "🏡 You wake in your home. The roof is above you. The world has not ended. You have not ended.";
  }
  if (run?.built?.hut) {
    return "🛖 You wake at the hut. The straw smells of you. The wasteland is outside. You are inside.";
  }
  return "🌑 You wake on the ground. The dust is in your mouth. The Stone watches.";
}

// Apply the cascade. Called from combat.js when HP hits 0 in a fight.
// Returns { run, events } — events is a small narrative block.
export function applyDeathDebuff(run, now = Date.now()) {
  const existing = run?.statuses?.deathDebuff;
  const prevMag = existing?.magnitude || 0;
  const newMag = clamp(prevMag + PER_DEATH_MAGNITUDE, 0, MAX_MAGNITUDE);
  const deaths = (existing?.deaths || 0) + 1;

  const stats = { ...(run.stats || {}) };

  // Scale stats that fall ("alive but barely"):
  for (const k of ["hp", "energy", "happiness", "sanity", "spirit"]) {
    const cur = stats[k] ?? 50;
    stats[k] = clamp(cur * (1 - newMag), 0, 100);
  }
  // Stats that climb toward max ("starving, parched"):
  for (const k of ["hunger", "thirst"]) {
    const cur = stats[k] ?? 0;
    stats[k] = clamp(cur + (100 - cur) * newMag, 0, 100);
  }
  // HP needs at least 1 (we want them alive, just badly hurt). Boost if
  // the cascade tried to put them at 0.
  if (stats.hp < 1) stats.hp = 1;

  const statuses = {
    ...(run.statuses || {}),
    deathDebuff: {
      active: true,
      magnitude: newMag,
      startedAt: existing?.startedAt || now,
      lastDeathAt: now,
      deaths,
    },
  };

  const events = [
    { kind: "event_bad", message: wakeNarration(run) },
    {
      kind: "event_bad",
      message:
        deaths === 1
          ? "💔 The world is heavier. Your hands shake. Food and rest will steady you, in time."
          : `💔 Death finds you again (×${deaths}). Each one harder to crawl back from.`,
    },
  ];

  return { run: { ...run, stats, statuses }, events };
}

// Apply a food's recovery rate to the active death debuff. Called from
// survival.js performSurvivalAction("eat") for each food consumed.
// Returns { run, events } — usually no event unless the debuff lifts.
export function reduceDeathDebuff(run, recovery, now = Date.now()) {
  if (!recovery || recovery <= 0) return { run, events: [] };
  if (!isDebuffed(run)) return { run, events: [] };

  const cur = run.statuses.deathDebuff.magnitude || 0;
  const next = clamp(cur - recovery, 0, MAX_MAGNITUDE);

  if (next <= 0) {
    // Debuff lifts entirely.
    const statuses = { ...(run.statuses || {}) };
    delete statuses.deathDebuff;
    return {
      run: { ...run, statuses },
      events: [
        {
          kind: "event_good",
          message:
            "🪶 The shake in your hands settles. The body is yours again.",
        },
      ],
    };
  }

  return {
    run: {
      ...run,
      statuses: {
        ...run.statuses,
        deathDebuff: { ...run.statuses.deathDebuff, magnitude: next },
      },
    },
    events: [],
  };
}

// Hard-clear (Mending Word, Mending Potion full-clear use this path
// later if we want spells/potions to fully reset the debuff in one go).
export function clearDeathDebuff(run, reason) {
  if (!isDebuffed(run)) return { run, events: [] };
  const statuses = { ...(run.statuses || {}) };
  delete statuses.deathDebuff;
  const msg =
    reason === "potion"
      ? "🧪 The mending tincture pulls you back together. You stand straighter."
      : "🪶 The cascade lifts in one breath. You stand straighter.";
  return {
    run: { ...run, statuses },
    events: [{ kind: "event_good", message: msg }],
  };
}
