// Survival mechanics — DATA, not code.

export const SURVIVAL = {
  perGather: { hunger: 1.0, thirst: 1.5, energy: -3.0 },
  perBuild: { hunger: 2.0, thirst: 2.0, energy: -8.0 },
  perResearch: { hunger: 0.5, thirst: 0.5, energy: -2.0 },
  perCraft: { hunger: 1.5, thirst: 1.5, energy: -5.0 },
  perHunt: { hunger: 2.0, thirst: 3.0, energy: -10.0 },

  actions: {
    eat: {
      consumesCategory: "food",
      baseEffect: { hp: 5, happiness: 2, sanity: 1 },
      logKind: "consume",
      message: "{icon} You eat {name}. The hunger eases.",
      missingMessage: "Nothing to eat.",
    },
    // The drink action's cost/effect are resolved DYNAMICALLY from the
    // chosen water resource — see performDrink in systems/survival.js.
    // We keep a no-cost stub here so canPerformSurvivalAction can find the
    // action def and so existing call paths (settings, keybinds) still
    // resolve. The actual water consumption + thirst effect + dysentery
    // roll all happen in performDrink based on the waterType param.
    drink: {
      cost: {},
      effect: {},
      logKind: "consume",
      message: "💧 You drink. The thirst recedes.",
      missingMessage: "No water to drink.",
    },
    // Boil action — convert 1 wood + 1 muddy water into 1 boiled water.
    // Requires Boiling research + Fire Pit built (gating handled in
    // performBoilWater since it's stricter than research alone).
    boilWater: {
      cost: { wood: 1, water_muddy: 1 },
      effect: {},
      requires: { researched: "boiling" },
      logKind: "consume",
      message: "🫖 You set water over the fire. It bubbles, then quiets. +1 boiled.",
      missingMessage: "You need wood and muddy water to boil.",
    },
    rest: {
      cost: {},
      effect: { energy: 30, hp: 10, happiness: 3, sanity: 2, spirit: 8 },
      bonusFromBuilding: {
        firepit: { energy: 20, hp: 5, happiness: 2, sanity: 1 },
      },
      logKind: "consume",
      message: "🛌 You rest. The weariness fades.",
      messageWithFirepit:
        "🔥 You rest beside the fire. The weariness fades, and warmth seeps in.",
      messageWithHome:
        "🏡 You rest inside your home. The walls hold the world out. Sleep finds you the way it found you when you were small.",
    },
    ritual: {
      cost: { fragments: 1, water: 2 },
      effect: { spirit: 30, sanity: 3 },
      requires: { researched: "arcaneAwakening" },
      logKind: "spell_good",
      message: "🕯️ You sit with the shards in your palm. The Spirit pours back into you, the way water finds a riverbed.",
      missingMessage: "Not enough offerings.",
    },
  },

  penalties: {
    hungerHigh: 70,
    thirstHigh: 70,
    energyLow: 20,
    energyZero: 0,
  },

  yieldMultipliers: {
    hungerHigh: 0.5,
    thirstHigh: 0.5,
    energyLow: 0.5,
  },

  startValues: {
    hunger: 60,
    thirst: 60,
    energy: 50,
    hp: 40,
    happiness: 15,
    sanity: 25,
    spirit: 50,
  },

  happinessPenalties: {
    perRedHunger: -0.5,
    perRedThirst: -0.5,
    perLowEnergy: -0.5,
  },

  sanityFromThreat: {
    perEncounter: -2,
    perDamagePoint: -1,
  },

  gather: {
    baseCooldownMs: 1500,
    minCooldownMs: 250,
  },
};
