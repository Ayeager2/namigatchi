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

export const luckyDice = {
  id: "lucky_dice",
  name: "Lucky Dice",
  tier: "C",
  description: "Pay to play. Guess HIGH (4–6) or LOW (1–3). Win back your entry + extra.",
  costCoins: 5,

  canPlay(state) {
    if (!state?.alive || state?.sleeping) return false;
    return (state.coins ?? 0) >= (this.costCoins ?? 0);
  },

  play(data = {}, ctx = {}) {
    const guess = String(data.guess || "").toLowerCase();
    if (guess !== "high" && guess !== "low") {
      return {
        win: false,
        message: "Pick HIGH or LOW.",
        rewards: { coins: 0, fun: 0, energy: 0 },
        meta: { invalid: true },
      };
    }

    const seed = ctx.seed ?? Date.now();
    const rng = mulberry32(seed);
    const roll = 1 + Math.floor(rng() * 6);

    const isHigh = roll >= 4;
    const win = (guess === "high" && isHigh) || (guess === "low" && !isHigh);

    // Tier C rule:
    // reducer subtracts costCoins automatically
    // so rewards.coins should include "win back entry + extra"
    const entry = this.costCoins ?? 0;
    const extra = 2; // tweak this to tune profitability
    const coinReward = win ? (entry + extra) : 0;

    const fun = win ? 12 : 5;
    const energy = win ? -6 : -4;

    return {
      win,
      message: win
        ? `🎲 Rolled ${roll}! You won (+${extra} net).`
        : `🎲 Rolled ${roll}. You lost.`,
      rewards: { coins: coinReward, fun, energy },
      meta: { roll, guess, entry, extra },
    };
  },
};
