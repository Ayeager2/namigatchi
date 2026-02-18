const clamp = (n, min = -9999, max = 9999) => Math.max(min, Math.min(max, n));

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

export const treasureChest = {
  id: "treasure_chest",
  name: "Treasure Chest",
  tier: "D",
  description:
    "High cost, high reward. Pick a chest. Win: get entry back + profit. Lose: you lose the entry.",
  costCoins: 25, // high cost

  canPlay(state) {
    return !!state?.alive && !state?.sleeping && (state.coins ?? 0) >= 25;
  },

  play(data = {}, ctx = {}) {
    const pick = Number(data.pick); // 1,2,3
    if (![1, 2, 3].includes(pick)) {
      return {
        win: false,
        message: "Pick chest 1, 2, or 3.",
        rewards: { coins: 0, fun: 0, energy: 0 },
        meta: { invalid: true },
      };
    }

    const rng = mulberry32(ctx.seed ?? Date.now());

    // 0 = loss, 1 = small win, 2 = jackpot
    const outcomes = [0, 1, 2];

    // shuffle
    for (let i = outcomes.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [outcomes[i], outcomes[j]] = [outcomes[j], outcomes[i]];
    }

    const chosen = outcomes[pick - 1];

    const entry = 25;
    const smallProfit = 8;  // net +8
    const bigProfit = 25;   // net +25

    let win = false;
    let coins = 0;
    let message = "";

    if (chosen === 2) {
      win = true;
      coins = entry + bigProfit;
      message = `💎 JACKPOT! Chest ${pick} had treasure.`;
    } else if (chosen === 1) {
      win = true;
      coins = entry + smallProfit;
      message = `✨ Win! Chest ${pick} had some loot.`;
    } else {
      win = false;
      coins = 0;
      message = `💀 Bust… Chest ${pick} was cursed.`;
    }

    const fun = win ? 18 : 10;
    const energy = win ? -10 : -9;

    return {
      win,
      message,
      rewards: { coins: clamp(coins), fun: clamp(fun), energy: clamp(energy) },
      meta: {
        pick,
        entry,
        chests: {
          1: outcomes[0] === 2 ? "jackpot" : outcomes[0] === 1 ? "small" : "loss",
          2: outcomes[1] === 2 ? "jackpot" : outcomes[1] === 1 ? "small" : "loss",
          3: outcomes[2] === 2 ? "jackpot" : outcomes[2] === 1 ? "small" : "loss",
        },
      },
    };
  },
};
