// Threat definitions — DATA, not code.
// Adding a threat = new entry here. The threats system reads these and
// rolls encounters per gather.
//
// Each threat has:
//   id, name, icon, description
//   encounterChance      — base probability per gather
//   requires             — gating predicates (hutBuilt, etc.)
//   minGathersAfterGate  — grace period after gating becomes true
//   effects.stealFood    — { min, max } range of food stolen (defense reduces)
//   effects.damage       — { min, max } range of HP damage (defense reduces)
//   flavorMessages       — array of message variants (random pick per encounter)
//                          {food} and {damage} are substituted

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
};

export const getThreat = (id) => THREATS[id] || null;
export const getAllThreats = () => Object.values(THREATS);
