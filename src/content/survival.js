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
  // Bench work — making tools by hand. Easier than Build, harder than Research.
  perCraft: {
    hunger: +1.5,
    thirst: +1.5,
    energy: -5.0,
  },
  // Hunting is the most punishing physical action in early game. Long stalks,
  // tense muscles, dry throat. Especially brutal when you don't know what
  // you're doing yet (low Hunting skill). The numbers here are the BASE;
  // the hunting system also adds a thirst spike on top per the user's call.
  perHunt: {
    hunger: +2.0,
    thirst: +3.0,  // hunting makes you thirsty (per user direction)
    energy: -10.0, // big energy drain — you don't know what you're doing
  },

  // Action effects — what each survival action costs and gives.
  // Eat consumes any food-category resource (lowest-quality first by default).
  // The hunger reduction comes from the FOOD's `nutrition` value — different
  // foods give different amounts. Cooking research adds a flat bonus to that.
  // Other restorative effects (HP, resolve, sanity) are constant per eat.
  actions: {
    eat: {
      consumesCategory: "food",
      // baseEffect — applied on top of the food's nutrition (which goes to hunger).
      baseEffect: { hp: +5, happiness: +2, sanity: +1 },
      logKind: "consume",
      // Message has placeholders {icon} and {name} substituted with the chosen food.
      message: "{icon} You eat {name}. The hunger eases.",
      missingMessage: "Nothing to eat.",
    },
    drink: {
      cost: { water: 1 },
      effect: { thirst: -25, happiness: +1 },
      logKind: "consume",
      message: "💧 You drink. The thirst recedes.",
      missingMessage: "No water to drink.",
    },
    rest: {
      cost: {},
      effect: { energy: +30, hp: +10, happiness: +3, sanity: +2 },
      bonusFromBuilding: {
        firepit: { energy: +20, hp: +5, happiness: +2, sanity: +1 },
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
  // The opening is intentionally hard-core: the player wakes up hurt, hungry,
  // thirsty, tired, and shaken. Climbing back to comfortable is a journey of
  // acts (eating, building, learning), not a passive timer.
  startValues: {
    hunger: 60,    // hungry
    thirst: 60,    // thirsty
    energy: 50,    // tired
    hp: 40,        // hurt
    happiness: 15, // miserable — look around
    sanity: 25,    // shaken — the eyeball watched you wake up
  },

  // Extra Happiness drain per gather when needs are in the red.
  happinessPenalties: {
    perRedHunger: -0.5,
    perRedThirst: -0.5,
    perLowEnergy: -0.5,
  },

  // Sanity changes from threat events (per threat encounter, plus per HP damage).
  sanityFromThreat: {
    perEncounter: -2,    // every threat is unsettling
    perDamagePoint: -1,  // taking damage compounds
  },

  // Gather pacing — anti-spam cooldown that progression slowly chips away at.
  // Manual click → faster manual click (via tools/research) → eventual
  // automation is the entire incremental progression curve.
  gather: {
    baseCooldownMs: 1500, // pre-anything; barren wasteland, slow work
    minCooldownMs: 250,   // floor — there's always SOME pause
  },
};
