// Threat definitions — DATA, not code.

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
    effects: {
      sanityDrain: { min: 3, max: 5 },
    },
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
};

export const getThreat = (id) => THREATS[id] || null;
export const getAllThreats = () => Object.values(THREATS);
