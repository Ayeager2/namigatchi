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

const rollDie = (rng) => 1 + Math.floor(rng() * 6);

export const highLow = {
  id: "high_low",
  name: "High / Low Dice",
  tier: "C",
  description:
    "Pay to play. Guess if the next roll is higher or lower. Win: get your entry back + extra (streak bonuses later).",
  costCoins: 5, // entry fee

  canPlay(state) {
    return !!state?.alive && !state?.sleeping && (state.coins ?? 0) >= 5;
  },

  play(data = {}, ctx = {}) {
    const guess = String(data.guess || "").toLowerCase(); // "higher" | "lower"
    if (guess !== "higher" && guess !== "lower") {
      return {
        win: false,
        message: "Pick Higher or Lower.",
        rewards: { coins: 0, fun: 0, energy: 0 },
        meta: { invalid: true },
      };
    }

    const rng = mulberry32(ctx.seed ?? Date.now());

    const first = rollDie(rng);
    let second = rollDie(rng);

    // Avoid ties to keep it simple + fair
    let safety = 0;
    while (second === first && safety < 10) {
      second = rollDie(rng);
      safety++;
    }

    const outcome = second > first ? "higher" : "lower";
    const win = guess === outcome;

    const entry = 5;
    const bonus = 2; // extra on win (net profit = +2)
    const coins = win ? entry + bonus : 0; // reducer will subtract entry separately

    const fun = win ? 12 : 6;
    const energy = win ? -6 : -5;

    return {
      win,
      message: win
        ? `✅ You won! ${first} → ${second} (${outcome}). +${entry}+${bonus} coins`
        : `❌ You lost. ${first} → ${second} (${outcome}).`,
      rewards: { coins: clamp(coins), fun: clamp(fun), energy: clamp(energy) },
      meta: { first, second, outcome, guess, entry, bonus },
    };
  },
};
