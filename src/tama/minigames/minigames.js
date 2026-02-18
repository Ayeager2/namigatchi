// src/tama/minigames.js

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COIN_FLIP = {
  id: "coin_flip",
  name: "Coin Flip",
  tier: "A",
  description: "Guess heads or tails. Free to play. Fun up, energy down.",
  costCoins: 0,

  canPlay(state) {
    return !!state?.alive && !state?.sleeping;
  },

  play(data = {}, ctx = {}) {
    const guess = (data.guess || "").toLowerCase();
    if (guess !== "heads" && guess !== "tails") {
      return {
        win: false,
        message: "Pick heads or tails.",
        rewards: { coins: 0, fun: 0, energy: 0 },
        meta: { invalid: true },
      };
    }

    const seed = ctx.seed ?? Date.now();
    const rng = mulberry32(seed);

    const outcome = rng() < 0.5 ? "heads" : "tails";
    const win = guess === outcome;

    // A) FREE: no coins, just fun + energy loss
    const fun = win ? 10 : 6;
    const energy = win ? -4 : -3;

    return {
      win,
      message: win ? `You won! It was ${outcome}.` : `Nope — it was ${outcome}.`,
      rewards: { coins: 0, fun, energy },
      meta: { outcome, guess },
    };
  },
};

const MINIGAMES = [COIN_FLIP];

export function getAllMinigames() {
  return MINIGAMES.slice();
}

export function getMinigame(id) {
  return MINIGAMES.find((g) => g.id === id) || null;
}
