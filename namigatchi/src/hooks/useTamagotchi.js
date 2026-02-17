import { useEffect, useMemo, useReducer, useRef } from "react";
import { getItemById } from "../tama/items";

/**
 * Full-ish Tamagotchi sim
 * Stats are 0..100 unless otherwise noted.
 * You can tweak the knobs in CONFIG.
 */

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const r01 = () => Math.random();
const now = () => Date.now();
// const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function mulberry32(seed) {
  // deterministic-ish RNG for minigames if you want stable outcomes
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let __fxId = 1;

function withFx(s, fxItems) {
  if (!fxItems || fxItems.length === 0) return s;
  const stamped = fxItems.map((f) => ({
    id: __fxId++,
    text: f.text,
    type: f.type ?? "neutral", // good | bad | neutral
  }));
  return { ...s, fxQueue: [...(s.fxQueue || []), ...stamped] };
}

// Hunger/thirst are “bad when high”, so show reductions as GOOD.
const FX_KEYS = [
  { key: "health", label: "HEALTH", goodWhenUp: true },
  { key: "energy", label: "ENERGY", goodWhenUp: true },
  { key: "fun", label: "FUN", goodWhenUp: true },
  { key: "hygiene", label: "HYGIENE", goodWhenUp: true },

  { key: "hunger", label: "HUNGER", goodWhenUp: false }, // lower is better
  { key: "thirst", label: "THIRST", goodWhenUp: false }, // lower is better

  { key: "affection", label: "AFFECTION", goodWhenUp: true },
  { key: "discipline", label: "DISCIPLINE", goodWhenUp: true },
  { key: "neglect", label: "NEGLECT", goodWhenUp: false }, // lower is better
];

function diffFx(before, after, opts = {}) {
  const fx = [];

  // stats
  for (const k of FX_KEYS) {
    const b = before[k.key];
    const a = after[k.key];
    if (typeof b !== "number" || typeof a !== "number") continue;
    const d = a - b;
    if (Math.abs(d) < 0.01) continue;

    const magnitude = Math.round(Math.abs(d));
    const sign = d > 0 ? "+" : "-";

    // determine good/bad based on direction
    const isGood = k.goodWhenUp ? d > 0 : d < 0;
    fx.push({
      text: `${sign}${magnitude} ${k.label}`,
      type: isGood ? "good" : "bad",
    });
  }

  // coins
  if (typeof before.coins === "number" && typeof after.coins === "number") {
    const dc = after.coins - before.coins;
    if (dc !== 0) {
      fx.push({
        text: `${dc > 0 ? "+" : ""}${dc} 💰`,
        type: dc > 0 ? "good" : "bad",
      });
    }
  }

  // poop count changes
  if (typeof before.poops === "number" && typeof after.poops === "number") {
    const dp = after.poops - before.poops;
    if (dp > 0) fx.push({ text: `+${dp} 💩`, type: "bad" });
    if (dp < 0) fx.push({ text: `💩 CLEARED`, type: "good" });
  }

  // status toggles
  if (!!before.sick !== !!after.sick) {
    fx.push({ text: after.sick ? "SICK 🤒" : "CURED ✅", type: after.sick ? "bad" : "good" });
  }
  if (!!before.injured !== !!after.injured) {
    fx.push({ text: after.injured ? "INJURED 🤕" : "HEALED ✅", type: after.injured ? "bad" : "good" });
  }
  if (!!before.tantrum !== !!after.tantrum) {
    fx.push({ text: after.tantrum ? "TANTRUM 😡" : "CALM ✅", type: after.tantrum ? "bad" : "good" });
  }
  if (!!before.sleeping !== !!after.sleeping) {
    fx.push({ text: after.sleeping ? "SLEEP 😴" : "WAKE ☀️", type: "neutral" });
  }

  // keep it readable: cap number of bubbles per action
  const cap = opts.cap ?? 4;
  return fx.slice(0, cap);
}



/* =========================
   CONFIG (tweak me)
========================= */
const CONFIG = {
  TICK_MS: 1000, // sim loop
  MAX_CATCHUP_TICKS: 180, // how many ticks to simulate after tab sleep

  // time mapping
  MINUTES_PER_TICK: 0.15, // age progression per tick (sim minutes)

  // baseline per tick changes (awake)
  RATES: {
    hungerUp: 0.85, // hunger increases (bad)
    thirstUp: 1.05,
    funDown: 0.7,
    hygieneDown: 0.45,
    energyDown: 0.85,

    // sleeping modifiers
    sleep: {
      hungerUpMul: 0.6,
      thirstUpMul: 0.75,
      funDownMul: 0.2,
      hygieneDownMul: 0.5,
      energyGain: 1.6,
    },
  },

  // if needs are bad, health decays
  HEALTH_DECAY: {
    base: 0.02,
    perSeverity: 1 / 120, // severity/120
    sickExtra: 0.25,
    injuredExtra: 0.2,
    poopNearbyExtra: 0.12, // if poop exists
  },

  // attention + discipline
  ATTENTION: {
    callThreshold: 70, // if need severity above this => calls for attention
    neglectDecay: 0.35, // how fast "neglect" rises when calling and ignored
    neglectHeal: 0.5, // when you respond to calls
    disciplineEffect: 20, // reduces "tantrum" / misbehavior
  },

  // poop system
  POOP: {
    poopChanceBase: 0.015, // per tick chance
    poopChanceFromHunger: 0.0005, // add hunger*mult
    poopChanceFromThirst: 0.0003,
    maxPoops: 6,
    hygieneHitPerPoopPerTick: 0.12,
  },

  // sickness system
  SICKNESS: {
    sickChanceBase: 0.002,
    sickChanceFromLowHygiene: 0.0015, // (100-hygiene)/100 * mult
    sickChanceFromNeglect: 0.001, // neglect/100 * mult
    medicineCureChance: 0.85,
  },

  // injury system (rare random when playing while tired etc.)
  INJURY: {
    baseChance: 0.001,
    tiredMultiplier: 3.0, // if energy < 25
    sickMultiplier: 1.8,
    playExtraChance: 0.002,
    bandageHeal: 22,
  },

  // weight changes (0..30-ish)
  WEIGHT: {
    gainOnFeed: 0.35,
    losePerTick: 0.002,
    loseWhenPlaying: 0.18,
    overweightThreshold: 18,
    overweightHealthPenalty: 0.12, // extra severity if overweight
  },

  // affection + evolution
  AFFECTION: {
    gainOnCare: 1.8, // when you address a call / care action
    gainOnPlay: 2.5,
    gainOnTreat: 1.2,
    loseOnNeglectTick: 0.08,
    loseOnDisciplineOveruse: 0.8, // if you spam discipline
  },

  // evolution checkpoints (ageMinutes)
  EVOLUTION: [
    { stage: "egg", at: 0 },
    { stage: "baby", at: 2 },
    { stage: "child", at: 12 },
    { stage: "teen", at: 40 },
    { stage: "adult", at: 120 },
  ],

  // outcomes for adult forms (simple example)
  ADULT_FORMS: [
    {
      id: "hero",
      name: "HeroBean",
      req: (s) => s.affection >= 70 && s.neglect <= 25 && s.discipline >= 40,
    },
    {
      id: "goof",
      name: "GoofSprout",
      req: (s) => s.fun >= 65 && s.affection >= 45,
    },
    {
      id: "grump",
      name: "GrumblePod",
      req: (s) => s.neglect >= 55 || s.discipline < 15,
    },
    {
      id: "default",
      name: "Plainling",
      req: () => true,
    },
  ],

  // save key
  storageKey: "tama-save-v2",
};

/* =========================
   State
========================= */

const DEFAULTS = {
  name: "Niblet",
  alive: true,

  // time
  ageMinutes: 0,
  lastTickAt: now(),

  // core stats (0..100)
  hunger: 25, // higher = worse
  thirst: 20,
  energy: 80,
  fun: 70,
  hygiene: 75,
  health: 100,

  // systems
  sleeping: false,
  sick: false,
  injured: false,

  poops: 0, // integer count of poop piles
  weight: 6, // 0..30-ish

  affection: 50, // 0..100
  discipline: 30, // 0..100
  neglect: 0, // 0..100 (rises if calling + ignored)

  // attention call flags
  calling: false, // pet is asking for attention
  tantrum: false, // misbehavior state triggered by neglect
  lastActionAt: now(),
  lastDisciplineAt: 0,

  // evolution
  stage: "egg",
  formId: "egg",
  formName: "Egg",

  // economy / items (lightweight)
  coins: 0,
  inventory:{},
  cooldowns: {},

  // UI reads + clears
  fxQueue: [],

  // logs (for fun UI)
  log: [],
};

const ACTIONS = {
  LOAD: "LOAD",
  RESET: "RESET",
  TICK: "TICK",

  RENAME: "RENAME",
  FEED: "FEED",
  WATER: "WATER",
  PLAY: "PLAY",
  CLEAN: "CLEAN",
  SLEEP: "SLEEP",
  WAKE: "WAKE",
  MEDICINE: "MEDICINE",
  BANDAGE: "BANDAGE",
  DISCIPLINE: "DISCIPLINE",

  BUY_ITEM: "BUY_ITEM",
  USE_ITEM: "USE_ITEM",

  CLEAR_FX: "CLEAR_FX",

  MINI_GAME_RESULT: "MINI_GAME_RESULT",
};

function addLog(s, msg) {
  const entry = { t: now(), msg };
  const next = [entry, ...(s.log || [])].slice(0, 30);
  return { ...s, log: next };
}

function computeStage(ageMinutes) {
  // pick the latest checkpoint <= age
  let stage = CONFIG.EVOLUTION[0].stage;
  for (const e of CONFIG.EVOLUTION) if (ageMinutes >= e.at) stage = e.stage;
  return stage;
}

function computeNeedSeverity(s) {
  // higher = worse
  const hungerBad = s.hunger > 60 ? (s.hunger - 60) : 0;
  const thirstBad = s.thirst > 60 ? (s.thirst - 60) : 0;
  const energyBad = s.energy < 35 ? (35 - s.energy) : 0;
  const funBad = s.fun < 35 ? (35 - s.fun) : 0;
  const hygieneBad = s.hygiene < 40 ? (40 - s.hygiene) : 0;

  const poopBad = s.poops > 0 ? s.poops * 6 : 0;
  const overweightBad =
    s.weight > CONFIG.WEIGHT.overweightThreshold
      ? (s.weight - CONFIG.WEIGHT.overweightThreshold) * 2
      : 0;

  const sickBad = s.sick ? 18 : 0;
  const injuredBad = s.injured ? 10 : 0;

  return (
    hungerBad +
    thirstBad +
    energyBad +
    funBad +
    hygieneBad +
    poopBad +
    overweightBad +
    sickBad +
    injuredBad
  );
}

function computeMood(s) {
  if (!s.alive) return "dead";
  if (s.sleeping) return "sleeping";
  if (s.tantrum) return "tantrum";
  if (s.health < 25) return "critical";
  if (s.sick) return "sick";
  if (s.injured) return "injured";
  if (s.calling) return "calling";
  if (s.hunger > 75 || s.thirst > 75) return "needy";
  if (s.energy < 20) return "tired";
  if (s.fun < 25) return "bored";
  if (s.hygiene < 25 || s.poops > 0) return "stinky";
  return "happy";
}

function finalizeAdultForm(s) {
  if (s.stage !== "adult") return s;

  // only finalize once (if still default-ish)
  if (s.formId && s.formId !== "egg" && s.formId !== "baby" && s.formId !== "child" && s.formId !== "teen") {
    return s;
  }

  const chosen = CONFIG.ADULT_FORMS.find((f) => f.req(s)) || CONFIG.ADULT_FORMS[CONFIG.ADULT_FORMS.length - 1];
  let next = { ...s, formId: chosen.id, formName: chosen.name };
  next = addLog(next, `Evolved into ${chosen.name}!`);
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD: {
      const loaded = { ...DEFAULTS, ...action.payload };
      loaded.lastTickAt = now();
      loaded.lastActionAt = now();
      loaded.fxQueue = [];
      return loaded;
    }

    case ACTIONS.CLEAR_FX: {
      if (!state.fxQueue || state.fxQueue.length === 0) return state;
      return { ...state, fxQueue: [] };
    }

    case ACTIONS.RESET: {
      const before = state;

      let s = { ...DEFAULTS, lastTickAt: now(), lastActionAt: now(), log: [], fxQueue: [] };
      s = addLog(s, "Reset.");

      const fxItems = diffFx(before, s, { cap: 4 });
      return withFx(s, fxItems);
    }

    case ACTIONS.RENAME: {
      if (!state.alive) return state;

      const before = state;

      let s = {
        ...state,
        name: action.name ?? state.name,
        lastActionAt: now(),
      };

      s = addLog(s, `Renamed to ${s.name}.`);

      // diffFx won’t show name changes; add a small neutral bubble
      const fxItems = [{ text: "RENAME ✏️", type: "neutral" }, ...diffFx(before, s, { cap: 3 })];
      return withFx(s, fxItems);
    }

    case ACTIONS.SLEEP: {
      if (!state.alive) return state;

      const before = state;

      let s = { ...state, sleeping: true, lastActionAt: now() };
      s = addLog(s, "Went to sleep.");

      const fxItems = diffFx(before, s, { cap: 4 });
      return withFx(s, fxItems);
    }

    case ACTIONS.WAKE: {
      if (!state.alive) return state;

      const before = state;

      let s = { ...state, sleeping: false, tantrum: false, lastActionAt: now() };
      s = addLog(s, "Woke up.");

      const fxItems = diffFx(before, s, { cap: 4 });
      return withFx(s, fxItems);
    }

    case ACTIONS.DISCIPLINE: {
      if (!state.alive) return state;

      const before = state;

      const t = now();
      const spam = state.lastDisciplineAt && t - state.lastDisciplineAt < 7000;

      let s = { ...state };

      s.discipline = clamp(s.discipline + CONFIG.ATTENTION.disciplineEffect);
      s.tantrum = false;
      s.calling = false;
      s.neglect = clamp(s.neglect - 10);

      if (spam) {
        s.affection = clamp(s.affection - CONFIG.AFFECTION.loseOnDisciplineOveruse);
        s = addLog(s, "Discipline spam annoyed them.");
      } else {
        s = addLog(s, "Discipline applied.");
      }

      s.lastDisciplineAt = t;
      s.lastActionAt = t;

      // Optional: add a guaranteed label bubble so it always “feels” like something happened
      const fxItems = [{ text: "DISCIPLINE", type: "neutral" }, ...diffFx(before, s, { cap: 3 })];
      return withFx(s, fxItems);
    }

    case ACTIONS.FEED: {
      if (!state.alive) return state;

      const before = state;

      let s = { ...state };
      s.hunger = clamp(s.hunger - 28);
      s.thirst = clamp(s.thirst + 5);
      s.hygiene = clamp(s.hygiene - 3);
      s.fun = clamp(s.fun + 2);
      s.weight = Math.min(30, s.weight + CONFIG.WEIGHT.gainOnFeed);

      if (s.calling) {
        s.neglect = clamp(s.neglect - CONFIG.ATTENTION.neglectHeal);
        s.affection = clamp(s.affection + CONFIG.AFFECTION.gainOnCare);
        s.calling = false;
      }

      s.lastActionAt = now();
      s = addLog(s, "Fed.");

      const fx = diffFx(before, s, { cap: 4 });
      return withFx(s, fx);
    }

    case ACTIONS.WATER: {
      if (!state.alive) return state;

      const before = state;

      let s = { ...state };
      s.thirst = clamp(s.thirst - 30);
      s.hunger = clamp(s.hunger + 2);
      if (s.calling) {
        s.neglect = clamp(s.neglect - CONFIG.ATTENTION.neglectHeal);
        s.affection = clamp(s.affection + CONFIG.AFFECTION.gainOnCare);
        s.calling = false;
      }
      s.lastActionAt = now();
      
      s = addLog(s, "Drank water.");

      const fx = diffFx(before, s, { cap: 4 });

      return withFx(s, fx);
    }

    case ACTIONS.PLAY: {
      if (!state.alive || state.sleeping) return state;

      const before = state;

      let s = { ...state };
      // if tantrum, play might fail unless disciplined
      const fail = s.tantrum && r01() < 0.6;

      if (fail) {
        s.fun = clamp(s.fun - 1);
        s.energy = clamp(s.energy - 6);
        s = addLog(s, "Refused to play (tantrum).");
      } else {
        s.fun = clamp(s.fun + 24);
        s.energy = clamp(s.energy - 14);
        s.thirst = clamp(s.thirst + 8);
        s.hygiene = clamp(s.hygiene - 2);
        s.weight = Math.max(0, s.weight - CONFIG.WEIGHT.loseWhenPlaying);
        s.coins += 1;

        // affection boost
        s.affection = clamp(s.affection + CONFIG.AFFECTION.gainOnPlay);

        // calm tantrum sometimes
        if (s.tantrum && r01() < 0.35) s.tantrum = false;

        s = addLog(s, "Played (+1 coin).");
      }

      if (s.calling) {
        s.neglect = clamp(s.neglect - CONFIG.ATTENTION.neglectHeal);
        s.calling = false;
      }

      s.lastActionAt = now();

      const fx = diffFx(before, s, { cap: 4 });

      return withFx(s, fx);
    }

    case ACTIONS.CLEAN: {
      if (!state.alive) return state;
      const before = state;
      let s = { ...state };

      // remove all poop, restore hygiene
      const hadPoop = s.poops > 0;
      s.poops = 0;
      s.hygiene = clamp(s.hygiene + (hadPoop ? 45 : 30));
      s.fun = clamp(s.fun - 1);

      if (s.calling) {
        s.neglect = clamp(s.neglect - CONFIG.ATTENTION.neglectHeal);
        s.affection = clamp(s.affection + CONFIG.AFFECTION.gainOnCare);
        s.calling = false;
      }

      s.lastActionAt = now();
      s = addLog(s, hadPoop ? "Cleaned up poop." : "Took a bath.");

      const fx = diffFx(before, s, { cap: 4 });

      return withFx(s, fx);
    }

    case ACTIONS.MEDICINE: {
      if (!state.alive) return state;
      const before = state;

      let s = { ...state };
      if (!s.sick) return addLog({ ...s, lastActionAt: now() }, "No medicine needed.");

      const cured = r01() < CONFIG.SICKNESS.medicineCureChance;
      if (cured) {
        s.sick = false;
        s.health = clamp(s.health + 12);
        s.affection = clamp(s.affection + CONFIG.AFFECTION.gainOnTreat);
        s = addLog(s, "Medicine worked! (Cured)");
      } else {
        s.health = clamp(s.health + 4);
        s = addLog(s, "Medicine helped a bit.");
      }

      if (s.calling) {
        s.neglect = clamp(s.neglect - CONFIG.ATTENTION.neglectHeal);
        s.calling = false;
      }

      s.lastActionAt = now();

      const fx = diffFx(before, s, { cap: 4 });

      return withFx(s, fx);
    }

    case ACTIONS.BANDAGE: {
      if (!state.alive) return state;
      const before = state;

      let s = { ...state };
      if (!s.injured) return addLog({ ...s, lastActionAt: now() }, "No bandage needed.");

      s.injured = false;
      s.health = clamp(s.health + CONFIG.INJURY.bandageHeal);
      s.affection = clamp(s.affection + CONFIG.AFFECTION.gainOnTreat);

      if (s.calling) {
        s.neglect = clamp(s.neglect - CONFIG.ATTENTION.neglectHeal);
        s.calling = false;
      }

      s.lastActionAt = now();
      s = addLog(s, "Bandaged up.");
     
      const fx = diffFx(before, s, { cap: 4 });

      return withFx(s, fx);
    }

    case ACTIONS.MINI_GAME_RESULT: {
      if (!state.alive) return state;
      const before = state;

      // mini-game can award coins + fun
      let s = { ...state };
      const { coins = 0, fun = 0, energy = 0 } = action.payload || {};
      s.coins += coins;
      s.fun = clamp(s.fun + fun);
      s.energy = clamp(s.energy + energy);
      s.lastActionAt = now();

      s = addLog(s, `Mini-game: +${coins} coin(s).`);
      
      const fx = diffFx(before, s, { cap: 4 });

      return withFx(s, fx);
    }

    case ACTIONS.BUY_ITEM: {
      if (!state.alive) return state;
      const before = state;

      const item = getItemById(action.itemId);
      if (!item) return state;

      if (state.coins < item.cost) {
        return addLog(state, `Not enough coins for ${item.name}.`);
      }

      const inv = { ...(state.inventory || {}) };
      inv[item.id] = (inv[item.id] || 0) + 1;

      let s = {
        ...state,
        coins: state.coins - item.cost,
        inventory: inv,
        lastActionAt: now(),
      };

      s = addLog(s, `Bought ${item.name}.`);

      const fxItems = diffFx(before, s, { cap: 4 });
      return withFx(s, fxItems);
    }

    case ACTIONS.USE_ITEM: {
      if (!state.alive) return state;
      const before = state;

      const item = getItemById(action.itemId);
      if (!item) return state;

      const inv = { ...(state.inventory || {}) };
      const qty = inv[item.id] || 0;
      if (qty <= 0) return addLog(state, `No ${item.name} in inventory.`);

      const cd = { ...(state.cooldowns || {}) };
      const lastUsed = cd[item.id] || 0;
      const t = now();
      if (item.cooldownMs && t - lastUsed < item.cooldownMs) {
        const left = Math.ceil((item.cooldownMs - (t - lastUsed)) / 1000);
        return addLog(state, `${item.name} is cooling down (${left}s).`);
      }

      // decrement inventory
      inv[item.id] = qty - 1;
      if (inv[item.id] <= 0) delete inv[item.id];

      let s = { ...state, inventory: inv, cooldowns: cd, lastActionAt: t };

      // apply effects
      const effects = item.effects || {};

      // numeric stat deltas
      const apply = (key, delta, min = 0, max = 100) => {
        if (typeof delta !== "number") return;
        s[key] = clamp((s[key] ?? 0) + delta, min, max);
      };

      apply("hunger", effects.hunger);
      apply("thirst", effects.thirst);
      apply("energy", effects.energy);
      apply("fun", effects.fun);
      apply("hygiene", effects.hygiene);
      apply("health", effects.health);
      apply("affection", effects.affection);
      apply("discipline", effects.discipline);
      apply("neglect", effects.neglect);

      // weight
      if (typeof effects.weight === "number") {
        s.weight = Math.max(0, Math.min(30, (s.weight ?? 0) + effects.weight));
      }

      // soap special
      if (effects.poopClear) {
        if ((s.poops ?? 0) > 0) s.poops = 0;
      }

      // vitamins special
      if (effects.sickCureChance && s.sick) {
        if (Math.random() < effects.sickCureChance) {
          s.sick = false;
          s = addLog(s, "Vitamins kicked in and cured sickness!");
        }
      }

      // responding to a call counts as care
      if (s.calling) {
        s.neglect = clamp((s.neglect ?? 0) - 0.5);
        s.affection = clamp((s.affection ?? 0) + 1.0);
        s.calling = false;
      }

      // set cooldown after success
      cd[item.id] = t;
      s.cooldowns = cd;

      s = addLog(s, `Used ${item.name}.`);

      const fxItems = diffFx(before, s, { cap: 4 });
      return withFx(s, fxItems);
    }

    case ACTIONS.TICK: {
      if (!state.alive) return state;

      const t = action.now ?? now();
      const dtMs = Math.max(0, t - (state.lastTickAt ?? t));
      const ticks = clamp(Math.round(dtMs / CONFIG.TICK_MS), 0, CONFIG.MAX_CATCHUP_TICKS);

      let s = { ...state, lastTickAt: t };

      for (let i = 0; i < ticks; i++) {
        // age + evolution stage
        s.ageMinutes += CONFIG.MINUTES_PER_TICK;
        const newStage = computeStage(s.ageMinutes);
        if (newStage !== s.stage) {
          s.stage = newStage;

          // set default form names for early stages
          if (newStage === "egg") { s.formId = "egg"; s.formName = "Egg"; }
          if (newStage === "baby") { s.formId = "baby"; s.formName = "Baby"; }
          if (newStage === "child") { s.formId = "child"; s.formName = "Child"; }
          if (newStage === "teen") { s.formId = "teen"; s.formName = "Teen"; }
          if (newStage === "adult") { s.formId = "adult"; s.formName = "Adult"; }

          s = addLog(s, `Evolved to ${newStage}.`);
        }

        // base metabolism / needs
        if (s.sleeping) {
          s.energy = clamp(s.energy + CONFIG.RATES.sleep.energyGain);
          s.hunger = clamp(s.hunger + CONFIG.RATES.hungerUp * CONFIG.RATES.sleep.hungerUpMul);
          s.thirst = clamp(s.thirst + CONFIG.RATES.thirstUp * CONFIG.RATES.sleep.thirstUpMul);
          s.fun = clamp(s.fun - CONFIG.RATES.funDown * CONFIG.RATES.sleep.funDownMul);
          s.hygiene = clamp(s.hygiene - CONFIG.RATES.hygieneDown * CONFIG.RATES.sleep.hygieneDownMul);
        } else {
          s.energy = clamp(s.energy - CONFIG.RATES.energyDown);
          s.hunger = clamp(s.hunger + CONFIG.RATES.hungerUp);
          s.thirst = clamp(s.thirst + CONFIG.RATES.thirstUp);
          s.fun = clamp(s.fun - CONFIG.RATES.funDown);
          s.hygiene = clamp(s.hygiene - CONFIG.RATES.hygieneDown);
        }

        // weight drift down over time
        s.weight = Math.max(0, s.weight - CONFIG.WEIGHT.losePerTick);

        // poop generation
        const poopChance =
          CONFIG.POOP.poopChanceBase +
          s.hunger * CONFIG.POOP.poopChanceFromHunger +
          s.thirst * CONFIG.POOP.poopChanceFromThirst;

        if (s.poops < CONFIG.POOP.maxPoops && r01() < poopChance) {
          s.poops += 1;
          s.hygiene = clamp(s.hygiene - 6);
          s = addLog(s, "Pooped.");
        }

        // hygiene penalty from existing poop
        if (s.poops > 0) {
          s.hygiene = clamp(s.hygiene - CONFIG.POOP.hygieneHitPerPoopPerTick * s.poops);
        }

        // attention call logic
        const severity = computeNeedSeverity(s);
        if (!s.calling && !s.sleeping && severity >= CONFIG.ATTENTION.callThreshold) {
          s.calling = true;
          s = addLog(s, "Calling for attention!");
        }

        // neglect rises if calling and you ignore it
        if (s.calling) {
          s.neglect = clamp(s.neglect + CONFIG.ATTENTION.neglectDecay);
          s.affection = clamp(s.affection - CONFIG.AFFECTION.loseOnNeglectTick);
        }

        // tantrum triggers after enough neglect
        if (!s.tantrum && s.neglect >= 65 && !s.sleeping) {
          s.tantrum = true;
          s = addLog(s, "Tantrum started! (Try discipline)");
        }

        // sickness chance
        if (!s.sick) {
          const lowHyg = (100 - s.hygiene) / 100;
          const neg = s.neglect / 100;
          const sickChance = CONFIG.SICKNESS.sickChanceBase + lowHyg * CONFIG.SICKNESS.sickChanceFromLowHygiene + neg * CONFIG.SICKNESS.sickChanceFromNeglect;
          if (r01() < clamp(sickChance, 0, 0.08)) {
            s.sick = true;
            s = addLog(s, "Got sick.");
          }
        }

        // injury chance (mostly while awake; extra if low energy)
        if (!s.injured && !s.sleeping) {
          let inj = CONFIG.INJURY.baseChance;
          if (s.energy < 25) inj *= CONFIG.INJURY.tiredMultiplier;
          if (s.sick) inj *= CONFIG.INJURY.sickMultiplier;
          if (s.tantrum) inj *= 1.3;

          // tiny chance just from being awake
          if (r01() < clamp(inj, 0, 0.03)) {
            s.injured = true;
            s.health = clamp(s.health - 8);
            s = addLog(s, "Got injured.");
          }
        }

        // if playing recently, raise injury slightly (handled in UI action? keep it here simple)
        // (Optional: you can track lastPlayAt and apply extra risk)

        // auto-sleep if energy bottoms out
        if (!s.sleeping && s.energy <= 0) {
          s.sleeping = true;
          s = addLog(s, "Collapsed and fell asleep.");
        }

        // health decay from neglect + bad stats
        const sev = computeNeedSeverity(s);

        const poopExtra = s.poops > 0 ? CONFIG.HEALTH_DECAY.poopNearbyExtra : 0;
        const overweightExtra =
          s.weight > CONFIG.WEIGHT.overweightThreshold ? CONFIG.WEIGHT.overweightHealthPenalty : 0;

        const healthDecay =
          CONFIG.HEALTH_DECAY.base +
          sev * CONFIG.HEALTH_DECAY.perSeverity +
          (s.sick ? CONFIG.HEALTH_DECAY.sickExtra : 0) +
          (s.injured ? CONFIG.HEALTH_DECAY.injuredExtra : 0) +
          poopExtra +
          overweightExtra;

        s.health = clamp(s.health - healthDecay);

        // small health recovery when well cared for
        if (
          !s.sick &&
          !s.injured &&
          s.poops === 0 &&
          s.hunger < 40 &&
          s.thirst < 40 &&
          s.energy > 55 &&
          s.fun > 55 &&
          s.hygiene > 65 &&
          s.neglect < 20
        ) {
          s.health = clamp(s.health + 0.12);
        }

        // death
        if (s.health <= 0) {
          s.alive = false;
          s.sleeping = false;
          s.calling = false;
          s.tantrum = false;
          s = addLog(s, "Died.");
          break;
        }
      }

      // finalize adult form once adult
      s = finalizeAdultForm(s);
      return s;
    }

    default:
      return state;
  }
}

export function useTamagotchi(options = {}) {
  const storageKey = options.storageKey ?? CONFIG.storageKey;
  const [state, dispatch] = useReducer(reducer, DEFAULTS);

  // load
  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) dispatch({ type: ACTIONS.LOAD, payload: JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, [storageKey]);

  // save
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, storageKey]);

  // tick loop
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: ACTIONS.TICK, now: now() }), CONFIG.TICK_MS);
    return () => clearInterval(id);
  }, []);

  const mood = useMemo(() => computeMood(state), [state]);
  const severity = useMemo(() => computeNeedSeverity(state), [state]);

  // mini-game: coin flip guess (simple, extendable)
  function playMiniGameGuess(seed = Date.now()) {
    if (!state.alive || state.sleeping) return;
    const rng = mulberry32(seed);
    const outcome = rng() < 0.5 ? "heads" : "tails";
    // return outcome and let UI decide reward, or just reward here
    // we'll reward small amount by default
    const win = rng() < 0.55;
    dispatch({
      type: ACTIONS.MINI_GAME_RESULT,
      payload: { coins: win ? 3 : 1, fun: win ? 10 : 5, energy: win ? -3 : -2 },
    });
    return { outcome, win };
  }

  const actions = useMemo(
    () => ({
      rename: (name) => dispatch({ type: ACTIONS.RENAME, name }),
      reset: () => dispatch({ type: ACTIONS.RESET }),

      feed: () => dispatch({ type: ACTIONS.FEED }),
      water: () => dispatch({ type: ACTIONS.WATER }),
      play: () => dispatch({ type: ACTIONS.PLAY }),
      clean: () => dispatch({ type: ACTIONS.CLEAN }),

      sleep: () => dispatch({ type: ACTIONS.SLEEP }),
      wake: () => dispatch({ type: ACTIONS.WAKE }),

      medicine: () => dispatch({ type: ACTIONS.MEDICINE }),
      bandage: () => dispatch({ type: ACTIONS.BANDAGE }),
      discipline: () => dispatch({ type: ACTIONS.DISCIPLINE }),

      buyItem: (itemId) => dispatch({ type: ACTIONS.BUY_ITEM, itemId }),
      useItem: (itemId) => dispatch({ type: ACTIONS.USE_ITEM, itemId }),

      miniGameGuess: playMiniGameGuess,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.alive, state.sleeping]
  );

  return { state, mood, severity, actions };
}
