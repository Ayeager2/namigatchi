// Random event definitions — DATA, not code.

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
          message: "✨ Lights in the sky that should not be there. Your hand twitches around the stone. Two more fragments fall from the dark.",
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
          message: "🩸 A blood moon. The world feels thin. You see shapes in the dust that move when you do not look at them directly.",
        },
      },
    },
  },

  // ============== Pest events ==============

  carrionFlock: {
    id: "carrionFlock",
    name: "Carrion Flock",
    trigger: "any",
    weight: 5,
    requires: { era: 1, hasBuilding: "garden" },
    cooldownMs: 12 * 60 * 1000,
    flavor: "A flock of carrion birds settles on the garden.",
    onFire: {
      effects: {
        setsPest: { pestId: "birdFlock", durationMs: 5 * 60 * 1000 },
        log: {
          kind: "event_strange",
          message: "🦅 A flock of carrion birds settles over the garden. They strut, they pluck, they eat. Hunt them off — or wait them out.",
        },
      },
    },
  },

  // ============== Atmospheric Era 1 events ==============

  blackRain: {
    id: "blackRain",
    name: "Black Rain",
    trigger: "interval",
    weight: 3,
    requires: { era: 1 },
    cooldownMs: 15 * 60 * 1000,
    flavor: "Black rain. Old soot in the clouds. But it is water, still.",
    onFire: {
      effects: {
        stats: { sanity: -1, happiness: -1 },
        inventory: { water: 6 },
        log: {
          kind: "event_strange",
          message: "🌧️ The rain comes black with old soot. You catch what you can in cupped hands. Water is water. +6 water.",
        },
      },
    },
  },

  burrowingThing: {
    id: "burrowingThing",
    name: "A Burrowing Thing",
    trigger: "interval",
    weight: 3,
    requires: { era: 1 },
    cooldownMs: 18 * 60 * 1000,
    flavor: "Something pale and many-legged is in your stores. It chitters when you approach.",
    choices: [
      {
        id: "kill",
        label: "Kill it",
        effect: {
          stats: { hp: -3, happiness: -1 },
          inventory: { food: 4 },
          alignment: { evil: 1 },
          log: { kind: "event_strange", message: "🪲 You crush it. There is more meat on it than you thought. +4 grubs." },
        },
      },
      {
        id: "let",
        label: "Let it pass",
        effect: {
          stats: { sanity: 2, happiness: 1 },
          inventory: { food: -2 },
          alignment: { good: 1 },
          log: { kind: "event_good", message: "🪲 You step back. It eats what it came for and is gone. (-2 grubs taken.)" },
        },
      },
    ],
  },

  howlInTheDark: {
    id: "howlInTheDark",
    name: "Howl in the Dark",
    trigger: "interval",
    weight: 2,
    requires: { era: 1 },
    cooldownMs: 22 * 60 * 1000,
    flavor: "A long howl, far off. Something with too many lungs. It calls again, closer.",
    choices: [
      {
        id: "investigate",
        label: "Walk toward it",
        effect: {
          stats: { sanity: -3, hp: -2 },
          inventory: { fragments: 2, stone: 6 },
          alignment: { evil: 1 },
          log: { kind: "event_strange", message: "👁️ You follow the sound. A depression in the dust where something curled. +2 fragments, +6 stone — and your hand will not stop shaking." },
        },
      },
      {
        id: "hide",
        label: "Hide and wait",
        effect: {
          stats: { sanity: 3, happiness: 2 },
          alignment: { good: 1 },
          log: { kind: "event_good", message: "🛖 You sit still inside the hut. The howl passes. You keep breathing. There are smaller victories than glory." },
        },
      },
    ],
  },

  // ============== Choice events ==============

  wanderingChild: {
    id: "wanderingChild",
    name: "A Wandering Child",
    trigger: "interval",
    weight: 4,
    requires: { era: 1 },
    cooldownMs: 20 * 60 * 1000,
    flavor: "A child has wandered close to your hut. Hungry. Watching. They have no one with them.",
    choices: [
      {
        id: "share",
        label: "Share food",
        cost: { food: 2 },
        missingMessage: "You have no food to share.",
        effect: {
          stats: { happiness: 5, sanity: 3 },
          alignment: { good: 2 },
          log: { kind: "event_good", message: "🤝 You give what you can. The child eats and slips back into the dust. Your chest feels lighter." },
        },
      },
      {
        id: "ignore",
        label: "Look away",
        effect: {
          stats: { happiness: -2 },
          alignment: { evil: 1 },
          log: { kind: "event_strange", message: "You look away. The child watches a moment longer, then is gone. The wind picks up." },
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
    flavor: "An elder lies by the path, bleeding from a wound. They look at you, their eyes clouded but knowing.",
    choices: [
      {
        id: "help",
        label: "Tend their wounds",
        cost: { water: 1, food: 1 },
        missingMessage: "You haven't enough to spare.",
        effect: {
          stats: { happiness: 5, sanity: 5 },
          alignment: { good: 3 },
          log: { kind: "event_good", message: "🩹 You tend their wounds. They tell you a story of the world before, then go quiet. You feel something steady inside you." },
        },
      },
      {
        id: "leave",
        label: "Walk past",
        effect: {
          stats: { happiness: -5, sanity: -2 },
          alignment: { evil: 2 },
          log: { kind: "event_strange", message: "You walk past. Their breath rasps. You do not look back. Something inside you goes quiet." },
        },
      },
    ],
  },

  // ============== Era 2 NPC-hint events ==============
  // These fire when the player has the prerequisite but hasn't built the
  // target yet. Each is a flavor nudge toward the next building in the
  // settler chain. notHasBuilding gates them out once the suggestion lands.

  wandererHintHome: {
    id: "wandererHintHome",
    name: "A Wanderer at the Fire",
    trigger: "interval",
    weight: 4,
    requires: { era: 2, hasBuilding: "hut", notHasBuilding: "home" },
    cooldownMs: 8 * 60 * 1000,
    flavor: "A wanderer settles by your fire. She does not stay long.",
    onFire: {
      effects: {
        stats: { happiness: 2 },
        log: {
          kind: "event_good",
          message: "👤 A wanderer settles by your fire. She warms her hands, glances at the hut, and asks if you have a home of your own. She is gone before you answer.",
        },
      },
    },
  },

  soldierHintWalls: {
    id: "soldierHintWalls",
    name: "An Old Soldier",
    trigger: "interval",
    weight: 4,
    requires: { era: 2, hasBuilding: "home", notHasBuilding: "walls" },
    cooldownMs: 8 * 60 * 1000,
    flavor: "An old soldier squints at the open ground.",
    onFire: {
      effects: {
        stats: { sanity: -1 },
        log: {
          kind: "event_strange",
          message: "🪖 An old soldier passes through. He glances at the open ground and says — quiet, not making a thing of it — 'A wall would help. Even a low one.' Then he is gone, and the wasteland feels wider than before.",
        },
      },
    },
  },

  childHintSilo: {
    id: "childHintSilo",
    name: "A Child Asks About Stores",
    trigger: "interval",
    weight: 3,
    requires: { era: 2, hasBuilding: "home", notHasBuilding: "silo" },
    cooldownMs: 8 * 60 * 1000,
    flavor: "A child asks where you keep your stores.",
    onFire: {
      effects: {
        stats: { happiness: -1 },
        log: {
          kind: "event_strange",
          message: "🧒 A child asks where you keep your stores. You point at the dust. She doesn't laugh. Her face says enough.",
        },
      },
    },
  },

  farmerHintFarmhouse: {
    id: "farmerHintFarmhouse",
    name: "A Farmer Passes",
    trigger: "interval",
    weight: 3,
    requires: { era: 2, hasBuilding: "garden", notHasBuilding: "farmhouse" },
    cooldownMs: 10 * 60 * 1000,
    flavor: "A farmer wanders by and looks at your garden.",
    onFire: {
      effects: {
        inventory: { food: 3 },
        stats: { happiness: 2, sanity: 1 },
        log: {
          kind: "event_good",
          message: "🧑‍🌾 A farmer wanders by, says nothing, but plants something with a calloused hand before going. The earth shifts. +3 grubs.",
        },
      },
    },
  },
};

export const getEvent = (id) => EVENTS[id] || null;
export const getAllEvents = () => Object.values(EVENTS);
