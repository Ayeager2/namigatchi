// Random event definitions — DATA, not code.
// Adding an event = new entry here. The events system rolls these on intervals
// and on gather actions.
//
// Each event has:
//   id, name, flavor                    — identity
//   trigger: "interval" | "gather" | "any"
//   weight                              — relative pick weight in roll
//   requires: { era, hutBuilt, ... }    — gating predicates
//   cooldownMs                          — minimum ms before this event can fire again
//   onFire.effects                      — fire-and-react effects (no choice)
//     stats        — partial stats delta to apply
//     inventory    — partial inventory delta
//     alignment    — { good: +N, evil: +N } HIDDEN tracking
//     log          — { kind, message } log entry
//   choices: [...]                       — optional; if present, modal asks player
//     id, label, cost, effect            — same shape as onFire.effects, plus optional cost
//
// Severity scales with era — see systems/events.js for the multiplier formula.

export const EVENTS = {
  // ============== Fire-and-react events ==============

  windFromEast: {
    id: "windFromEast",
    name: "Wind from the East",
    trigger: "any",
    weight: 8,
    requires: { era: 1 },
    cooldownMs: 5 * 60 * 1000,
    flavor: "A wind from the east. The dust thins for a breath.",
    onFire: {
      effects: {
        inventory: { wood: 5, stone: 5 },
        log: {
          kind: "event_good",
          message: "🌬️ A wind from the east. The dust thins. You find wood and stone in the clearing.",
        },
      },
    },
  },

  crackedEarth: {
    id: "crackedEarth",
    name: "Cracked Earth",
    trigger: "gather",
    weight: 5,
    requires: { era: 1 },
    cooldownMs: 8 * 60 * 1000,
    flavor: "The ground splits.",
    onFire: {
      effects: {
        inventory: { stone: 20 },
        log: {
          kind: "event_good",
          message: "💥 The ground splits beneath you. A vein of stone, exposed.",
        },
      },
    },
  },

  hiddenSpring: {
    id: "hiddenSpring",
    name: "Hidden Spring",
    trigger: "gather",
    weight: 4,
    requires: { era: 1 },
    cooldownMs: 10 * 60 * 1000,
    flavor: "Water you didn't know was there.",
    onFire: {
      effects: {
        inventory: { water: 4 },
        log: {
          kind: "event_good",
          message: "💧 You scrape moss from a stone and water beads. A small spring you hadn't seen.",
        },
      },
    },
  },

  strangeLights: {
    id: "strangeLights",
    name: "Strange Lights",
    trigger: "interval",
    weight: 3,
    requires: { era: 1 },
    cooldownMs: 12 * 60 * 1000,
    flavor: "Lights in the sky that should not be there.",
    onFire: {
      effects: {
        stats: { sanity: -1 },
        inventory: { fragments: 2 },
        log: {
          kind: "event_strange",
          message:
            "✨ Lights in the sky that should not be there. Your hand twitches around the stone. Two more fragments fall from the dark.",
        },
      },
    },
  },

  bloodMoon: {
    id: "bloodMoon",
    name: "Blood Moon",
    trigger: "interval",
    weight: 1,
    requires: { era: 1 },
    cooldownMs: 30 * 60 * 1000,
    flavor: "The moon has gone red. The world feels thin.",
    onFire: {
      effects: {
        stats: { sanity: -2, happiness: -3 },
        log: {
          kind: "event_strange",
          message:
            "🩸 A blood moon. The world feels thin, like a held breath. You see shapes in the dust that move when you do not look at them directly.",
        },
      },
    },
  },

  // ============== Choice events ==============

  wanderingChild: {
    id: "wanderingChild",
    name: "A Wandering Child",
    trigger: "interval",
    weight: 4,
    requires: { era: 1 },
    cooldownMs: 20 * 60 * 1000,
    flavor:
      "A child has wandered close to your hut. Hungry. Watching. They have no one with them.",
    choices: [
      {
        id: "share",
        label: "Share food",
        cost: { food: 2 },
        missingMessage: "You have no food to share.",
        effect: {
          stats: { happiness: +5, sanity: +3 },
          alignment: { good: +2 },
          log: {
            kind: "event_good",
            message:
              "🤝 You give what you can. The child eats and slips back into the dust. Your chest feels lighter.",
          },
        },
      },
      {
        id: "ignore",
        label: "Look away",
        effect: {
          stats: { happiness: -2 },
          alignment: { evil: +1 },
          log: {
            kind: "event_strange",
            message:
              "You look away. The child watches a moment longer, then is gone. The wind picks up.",
          },
        },
      },
    ],
  },

  hurtElder: {
    id: "hurtElder",
    name: "An Elder, Hurt",
    trigger: "interval",
    weight: 2,
    requires: { era: 1 },
    cooldownMs: 25 * 60 * 1000,
    flavor:
      "An elder lies by the path, bleeding from a wound. They look at you, their eyes clouded but knowing.",
    choices: [
      {
        id: "help",
        label: "Tend their wounds",
        cost: { water: 1, food: 1 },
        missingMessage: "You haven't enough to spare.",
        effect: {
          stats: { happiness: +5, sanity: +5 },
          alignment: { good: +3 },
          log: {
            kind: "event_good",
            message:
              "🩹 You tend their wounds. They tell you a story of the world before, then go quiet. You feel something steady inside you.",
          },
        },
      },
      {
        id: "leave",
        label: "Walk past",
        effect: {
          stats: { happiness: -5, sanity: -2 },
          alignment: { evil: +2 },
          log: {
            kind: "event_strange",
            message:
              "You walk past. Their breath rasps. You do not look back. Something inside you goes quiet.",
          },
        },
      },
    ],
  },
};

export const getEvent = (id) => EVENTS[id] || null;
export const getAllEvents = () => Object.values(EVENTS);
