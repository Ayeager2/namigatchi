// Survival mechanics — DATA, not code.
// Tunable knobs for hunger, thirst, and energy. Adjust freely without
// touching system code.
//
// Design philosophy: survival is GATING, not punishment. Stats degrade, gather
// performance drops, but the player cannot die. The floor is "stuck and must
// learn how to recover" — and research provides every answer.

export const SURVIVAL = {
  // Decay rates per action — applied each time the player acts.
  // Hunger and thirst go UP (worse). Energy goes DOWN.
  perGather: {
    hunger: +1.0,
    thirst: +1.5, // thirst rises faster than hunger (water is precious)
    energy: -3.0,
  },
  perBuild: {
    hunger: +2.0,
    thirst: +2.0,
    energy: -8.0,
  },
  perResearch: {
    hunger: +0.5,
    thirst: +0.5,
    energy: -2.0,
  },

  // Action effects — what each survival action costs and gives.
  actions: {
    eat: {
      cost: { food: 1 },
      effect: { hunger: -25 },
      logKind: "consume",
      message: "🌿 You eat. The hunger eases.",
      missingMessage: "No food to eat.",
    },
    drink: {
      cost: { water: 1 },
      effect: { thirst: -25 },
      logKind: "consume",
      message: "💧 You drink. The thirst recedes.",
      missingMessage: "No water to drink.",
    },
    rest: {
      cost: {},
      effect: { energy: +30 },
      // Rest at a fire pit is more restorative — first concrete use of the pit.
      bonusFromBuilding: {
        firepit: { energy: +20 },
      },
      logKind: "consume",
      message: "🛌 You rest. The weariness fades.",
      messageWithFirepit:
        "🔥 You rest beside the fire. The weariness fades, and warmth seeps in.",
    },
  },

  // Thresholds at which performance penalties kick in.
  penalties: {
    hungerHigh: 70, // when hunger >= this, yield penalty
    thirstHigh: 70,
    energyLow: 20, // when energy <= this, yield penalty
    energyZero: 0, // when energy <= this, gathering blocked
  },

  // Yield multipliers from each penalty (multiplicative, can stack).
  yieldMultipliers: {
    hungerHigh: 0.5,
    thirstHigh: 0.5,
    energyLow: 0.5,
  },

  // Initial values when survival activates (hut built).
  startValues: {
    hunger: 30,
    thirst: 30,
    energy: 80,
  },
};
