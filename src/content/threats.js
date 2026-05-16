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
    encounterChance: 0.04,
    requires: { hutBuilt: true, era: 3 },
    minGathersAfterGate: 0,
    effects: {
      // Sanity-only damage. Defense does nothing — armor isn't the answer
      // to being looked at by something old.
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
};

export const getThreat = (id) => THREATS[id] || null;
export const getAllThreats = () => Object.values(THREATS);
