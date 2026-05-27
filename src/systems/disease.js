// Disease system — first illness is dysentery (BUGS.md / ERA_PLAN.md
// "Water tiers + dysentery"). Designed to be the foundation other
// illnesses (infected wound, exposure, food poisoning…) plug into later.
//
// State shape — diseases live under run.statuses:
//
//   run.statuses.dysentery = {
//     active: true,
//     startedAt: <ms epoch>,
//     expiresAt: <ms epoch>,   // base 5–10 min from start
//   }
//
// Public API:
//   rollDysentery(run, chance, now, rng)
//     → { run, events } — given a chance in [0, 1], rolls and applies the
//       status if it hits. If already sick, REFRESHES the timer (chronic
//       compounds — re-drinking risky water while sick prolongs misery).
//
//   tickDiseases(state, now)
//     → { run, events } — call every TICK. Expires any status whose timer
//       has run out. Applies the slow HP / sanity / spirit drain that the
//       disease ticks (the doubled hunger/thirst drain is handled in
//       survival.decayForAction via getDiseaseDecayMultiplier).
//
//   clearDysentery(run, reason)
//     → { run, events } — full clear (Mending Word spell / Mending potion /
//       drink-recovery shortening hooks call this).
//
//   isSick(run, diseaseId)
//     → bool — pure check.
//
//   getDiseaseDecayMultiplier(run)
//     → { hunger, thirst } — multipliers applied to per-action decay in
//       survival.decayForAction. Dysentery doubles both.
//
//   getDiseaseYieldMultiplier(run)
//     → number — multiplier applied to gather/hunt yields in
//       survival.getYieldMultiplier. Dysentery is 0.7 (= -30%).

const MIN_DURATION_MS = 5 * 60 * 1000;   // 5 minutes
const MAX_DURATION_MS = 10 * 60 * 1000;  // 10 minutes

// Per-minute drain rates while dysentery is active. Applied in tickDiseases.
// Hunger/thirst doubling is handled separately by the decay multiplier so it
// happens on every action, not just on tick.
const DYSENTERY_TICK_DRAIN = {
  hp: -1,
  sanity: -0.5,
  spirit: -0.4,
  happiness: -0.5,
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function isSick(run, diseaseId) {
  const s = run?.statuses?.[diseaseId];
  if (!s || !s.active) return false;
  if (s.expiresAt && Date.now() >= s.expiresAt) return false;
  return true;
}

// Returns { hunger, thirst } multipliers for the survival decay system.
// 1.0 = normal; 2.0 = double drain.
export function getDiseaseDecayMultiplier(run) {
  let hunger = 1.0;
  let thirst = 1.0;
  if (isSick(run, "dysentery")) {
    hunger *= 2;
    thirst *= 2;
  }
  return { hunger, thirst };
}

// Multiplier applied to gather/hunt yields. <1 = penalty.
export function getDiseaseYieldMultiplier(run) {
  let mult = 1.0;
  if (isSick(run, "dysentery")) mult *= 0.7;
  return mult;
}

// Roll the dice on drinking risky water. Mutates a copy of run and returns
// it along with any log events.
export function rollDysentery(run, chance, now = Date.now(), rng = Math.random) {
  if (!chance || chance <= 0) return { run, events: [] };
  if (rng() >= chance) return { run, events: [] };

  const alreadySick = isSick(run, "dysentery");
  const duration =
    MIN_DURATION_MS + Math.floor(rng() * (MAX_DURATION_MS - MIN_DURATION_MS));

  // If already sick: extend the timer by half the rolled duration (chronic
  // illness compounds — every relapse pushes the expiry back, never
  // shortens it).
  const existing = run.statuses?.dysentery;
  const newExpires = alreadySick
    ? Math.max(existing.expiresAt || now, now + Math.floor(duration / 2))
    : now + duration;

  const statuses = {
    ...(run.statuses || {}),
    dysentery: {
      active: true,
      startedAt: alreadySick ? existing.startedAt : now,
      expiresAt: newExpires,
    },
  };

  const events = [];
  if (alreadySick) {
    events.push({
      kind: "event_bad",
      message: "🤢 The cramp comes again. The body knows this story.",
    });
  } else {
    events.push({
      kind: "event_bad",
      message:
        "🤢 The water sits wrong. Cramps. Your skin goes clammy. Dysentery — for a while.",
    });
  }

  return { run: { ...run, statuses }, events };
}

// Called when something cures the disease — Mending Word, Mending Potion,
// or a recovery hook from drinking the good stuff.
export function clearDysentery(run, reason) {
  const cur = run?.statuses?.dysentery;
  if (!cur || !cur.active) return { run, events: [] };
  const statuses = { ...(run.statuses || {}) };
  delete statuses.dysentery;
  const message =
    reason === "mending"
      ? "🩹 The Mending Word steadies the gut. The sickness lifts."
      : reason === "potion"
      ? "🧪 The Mending tincture goes down warm. The cramping eases."
      : reason === "boiled-recovery"
      ? "🫖 Boiled water steadies you. The sickness loses a foothold."
      : "🪶 The sickness lifts.";
  return {
    run: { ...run, statuses },
    events: [{ kind: "event_good", message }],
  };
}

// Shortens an ongoing dysentery by `ms`. Called from performDrink when the
// player drinks boiled water while sick — the spec says boiled/purified
// drinks shave ~1 min off recovery per drink.
export function shortenDysentery(run, ms, now = Date.now()) {
  const cur = run?.statuses?.dysentery;
  if (!cur || !cur.active) return { run, events: [] };
  const newExpires = (cur.expiresAt || now) - ms;
  if (newExpires <= now) {
    return clearDysentery(run, "boiled-recovery");
  }
  return {
    run: {
      ...run,
      statuses: {
        ...(run.statuses || {}),
        dysentery: { ...cur, expiresAt: newExpires },
      },
    },
    events: [],
  };
}

// Tick the disease state — call every TICK. Returns { run, events }.
// Slowly drains HP / sanity / spirit / happiness, then checks for expiry.
export function tickDiseases(state, now = Date.now()) {
  const run = state.run;
  if (!run.statuses?.dysentery?.active) return { run, events: [] };

  const lastAt = run.lastDiseaseTickAt || now;
  const elapsedMs = Math.min(now - lastAt, 30 * 60 * 1000); // cap catch-up
  if (elapsedMs < 1000) {
    return { run: { ...run, lastDiseaseTickAt: now }, events: [] };
  }
  const elapsedMin = elapsedMs / 60000;

  const events = [];
  let stats = run.stats || {};
  // Apply per-minute drain.
  stats = {
    ...stats,
    hp: clamp((stats.hp ?? 100) + DYSENTERY_TICK_DRAIN.hp * elapsedMin, 0, 100),
    sanity: clamp(
      (stats.sanity ?? 50) + DYSENTERY_TICK_DRAIN.sanity * elapsedMin,
      0,
      100
    ),
    spirit: clamp(
      (stats.spirit ?? 50) + DYSENTERY_TICK_DRAIN.spirit * elapsedMin,
      0,
      100
    ),
    happiness: clamp(
      (stats.happiness ?? 50) + DYSENTERY_TICK_DRAIN.happiness * elapsedMin,
      0,
      100
    ),
  };

  let statuses = run.statuses;
  // Expiry check.
  if (run.statuses.dysentery.expiresAt && now >= run.statuses.dysentery.expiresAt) {
    statuses = { ...statuses };
    delete statuses.dysentery;
    events.push({
      kind: "event_good",
      message: "🪶 The cramps fade. The body settles. The sickness is gone.",
    });
  }

  return {
    run: { ...run, stats, statuses, lastDiseaseTickAt: now },
    events,
  };
}
