// Threat definitions — DATA, not code.
//
// Two flavors of threat live here:
//
//   1. ONE-SHOT (existing) — resolved by systems/threats.js resolveThreat.
//      Fast, narrative-driven encounters (scavengers stealing, whisperers
//      passing). The threat's effects fire once and the player reads the
//      log line. These threats DO NOT have `combat: { hp, ... }`.
//
//   2. COMBAT-CLASS (new for Combat Phase 2 / #33) — resolved by
//      systems/combat.js resolveFight via a multi-round fight loop.
//      Player's equipped weapon, accuracy, crit, and personal armor
//      affect the outcome. These threats HAVE `combat: { hp, acc, eva,
//      damage, damageType }` and rich `combatFlavor` template pools.

export const THREATS = {
  scavenger: {
    id: "scavenger",
    name: "Scavenger",
    icon: "👤",
    description: "A starving thing from the ash. Hungry enough to risk you.",
    encounterChance: 0.07,
    requires: { hutBuilt: true },
    minGathersAfterGate: 5,
    effects: {
      stealFood: { min: 1, max: 3 },
      damage: { min: 0, max: 2 },
    },
    flavorMessages: [
      "A scavenger crawls from the ash. It takes {food} 🌿 and flees.",
      "Something stirs in the dust — gone before you turn. {food} 🌿 missing.",
      "A scrawny figure darts past. By the time you straighten, {food} 🌿 is gone.",
      "You hear a hiss. A creature snatches {food} 🌿 and is swallowed by the wind.",
    ],
    emptyMessages: [
      "Something came near. There was nothing to take, and it slunk back into the ash.",
      "A figure circled, found you with empty hands, and vanished.",
      "Hungry eyes watched from the dust. Nothing to take. They moved on.",
    ],
    damageMessages: [
      "You felt the strike before you saw it. {damage} ❤️.",
      "A scrabble of claws across your arm. {damage} ❤️.",
      "Pain blooms where the creature caught you. {damage} ❤️.",
    ],
  },

  whisperer: {
    id: "whisperer",
    name: "Whisperer",
    icon: "👁️",
    description: "Not a thing. A space the dust avoids. It watches you the way you watch the stone.",
    kind: "demon",
    encounterChance: 0.04,
    requires: { hutBuilt: true, era: 3 },
    minGathersAfterGate: 0,
    effects: { sanityDrain: { min: 3, max: 5 } },
    flavorMessages: [
      "Something is in the gathering ground that is not in the gathering ground. You feel it find you. {sanity} ◐.",
      "The wind stops. You hear your own breathing too loud. When the sound returns, something is gone — and it took {sanity} ◐ of you with it.",
      "A long shape in the corner of your eye. You turn. Nothing. The dust unsettles. {sanity} ◐.",
    ],
    emptyMessages: [
      "A pressure passes. The fragments hum. Then it is gone.",
      "Something looked at you from where there is no one. The looking ended. You went back to the work.",
    ],
    damageMessages: [],
  },

  hollowHound: {
    id: "hollowHound",
    name: "Hollow Hound",
    icon: "🐕‍🦺",
    description: "Four-legged, but not in the way dogs are. The shape is right. The shape is the only thing right.",
    kind: "demon",
    encounterChance: 0.03,
    requires: { hutBuilt: true, era: 3 },
    minGathersAfterGate: 0,
    effects: {
      damage: { min: 3, max: 6 },
      sanityDrain: { min: 2, max: 4 },
      defenseHalf: true,
    },
    flavorMessages: [
      "Something with four legs comes loping from the edge of vision. Wrong proportions. Wrong sound. {damage} ❤️, {sanity} ◐.",
      "A Hollow Hound finds you in the open. The teeth are the teeth of a dog. The eyes are not. {damage} ❤️, {sanity} ◐.",
      "It runs at you on legs that bend the wrong way and stops a meter short. You feel it taste you. {damage} ❤️, {sanity} ◐.",
    ],
    emptyMessages: [
      "You hear paws that don't quite touch the ground, far off. They don't come closer.",
      "Something moves at the treeline that has not been a tree since before the world ended.",
    ],
    damageMessages: [],
  },

  iconoclast: {
    id: "iconoclast",
    name: "Iconoclast",
    icon: "🩸",
    description: "A figure that walks slow and looks at the things you have built. The looking is not approval.",
    kind: "demon",
    encounterChance: 0.01,
    requires: { hutBuilt: true, era: 3 },
    minGathersAfterGate: 0,
    effects: {
      sanityDrain: { min: 4, max: 7 },
      happinessDrain: { min: 5, max: 8 },
    },
    flavorMessages: [
      "An Iconoclast walks past the camp. It looks at your home, your tools, your fire. It does not stop. But the looking takes {sanity} ◐ and {happiness} ✦ from you all the same.",
      "A long figure passes. It says nothing. It sees everything you have made and finds it small. {sanity} ◐, {happiness} ✦.",
      "The Iconoclast comes and stands at the edge of camp until you cannot meet its eye. When you look back it is gone — and so is {sanity} ◐, {happiness} ✦ of you.",
    ],
    emptyMessages: [
      "Something at the edge of vision regards you, decides the regard isn't worth completing, and is gone.",
      "A long shadow falls across the camp, longer than the figure casting it. Then nothing.",
    ],
    damageMessages: [],
  },

  // ─── COMBAT-CLASS THREATS (Phase 2 / #33) ──────────────────────────
  //
  // These engage the multi-round fight loop in systems/combat.js. The
  // `combat` block carries fight stats; `combatFlavor` carries template
  // pools the resolver picks from per round.
  //
  // damageType: "hp" (default — body), "sanity" (horror), "spirit"
  //   (arcane). For Phase 2 we ship hp-based threats; horror/arcane
  //   combat-class threats are easy to add as Era 3+ content lands.

  wildDog: {
    id: "wildDog",
    name: "Wild Dog",
    icon: "🐺",
    description: "A starved thing, ribs visible. The hunger is the dangerous part.",
    encounterChance: 0.05,
    requires: { hutBuilt: true },
    minGathersAfterGate: 10,
    combat: {
      hp: 12,
      acc: 0.7,
      eva: 0.05,
      damage: { min: 2, max: 4 },
      damageType: "hp",
    },
    combatFlavor: {
      opener: [
        "🐺 A wild dog comes loping from the dust. Ribs. Wrong angle. It has decided.",
        "🐺 Paws on dust. A dog the colour of nothing finds you in the open.",
        "🐺 You hear the breath first — wet, fast — and the dog is on you.",
      ],
      attack: [
        "It lunges. Teeth find your forearm. {dmg} ❤️.",
        "A snap at the hip. The fang draws line. {dmg} ❤️.",
        "Claws rake through hide and skin. {dmg} ❤️.",
      ],
      miss: [
        "It overshoots, scrabbles past.",
        "A snap closes on empty air.",
      ],
      victory: [
        "The dog drops. You stand over it, breathing hard. It will feed nothing else.",
        "It falls. You step back. The dust takes it slowly.",
      ],
      defeat: [
        "You go down under the dog. The world goes dark.",
      ],
    },
  },

  raider: {
    id: "raider",
    name: "Raider",
    icon: "🗡️",
    description: "A person with a blade and reasons. The wasteland has shaped them. They don't ask before swinging.",
    encounterChance: 0.04,
    requires: { hutBuilt: true, era: 2 },
    minGathersAfterGate: 5,
    combat: {
      hp: 22,
      acc: 0.78,
      eva: 0.1,
      damage: { min: 3, max: 7 },
      damageType: "hp",
    },
    combatFlavor: {
      opener: [
        "🗡️ A raider steps from cover. They look at what you have. They look at what they want.",
        "🗡️ Blade up. Stance ready. They've done this. So have you.",
        "🗡️ A figure with a stone-edged hatchet. No words. Just intent.",
      ],
      attack: [
        "The hatchet bites your shoulder. {dmg} ❤️.",
        "A jab catches your side. {dmg} ❤️.",
        "Blade across the forearm. Quick. Mean. {dmg} ❤️.",
      ],
      miss: [
        "You twist aside. The blade passes wide.",
        "Their swing falls short. They reset.",
      ],
      victory: [
        "The raider falls in the dust. You collect your breath. The wasteland does not mourn.",
        "They drop the blade and stop moving. You step back, then forward, then away.",
      ],
      defeat: [
        "Your knee buckles. The raider stands over you. The world greys at the edges.",
      ],
    },
  },

  corruptedWalker: {
    id: "corruptedWalker",
    name: "Corrupted Walker",
    icon: "🦴",
    description: "A thing that was a person. The walking is the same. Almost nothing else is.",
    kind: "demon",
    encounterChance: 0.03,
    requires: { hutBuilt: true, era: 3 },
    minGathersAfterGate: 0,
    combat: {
      hp: 35,
      acc: 0.72,
      eva: 0.05,
      damage: { min: 4, max: 8 },
      damageType: "hp",
    },
    combatFlavor: {
      opener: [
        "🦴 The walker comes. Its gait is wrong in a way the spine notices first.",
        "🦴 Something with a person's shape and a person's pace approaches. It is not a person anymore.",
        "🦴 A walker. The wind goes thin around it.",
      ],
      attack: [
        "It strikes faster than its shape should allow. {dmg} ❤️.",
        "The fingers find your collarbone — too long, too cold. {dmg} ❤️.",
        "It hits you with its arm and the arm bends wrong on the swing. {dmg} ❤️.",
      ],
      miss: [
        "Its swing passes through empty space — and through where you almost were.",
        "It overreaches. The gait stutters. You step aside.",
      ],
      victory: [
        "The walker drops without a sound. Then quietly continues to settle, even after.",
        "It falls in pieces that don't quite match each other. The dust accepts them.",
      ],
      defeat: [
        "Your legs give out. The walker bends over you. The cold of it presses through your skin.",
      ],
    },
  },
};

export const getThreat = (id) => THREATS[id] || null;
export const getAllThreats = () => Object.values(THREATS);
