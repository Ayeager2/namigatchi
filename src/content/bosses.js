// Boss definitions — DATA, not code.
//
// Bosses are special threats with their own (future) turn-based modal UI
// (#40). For Phase 1 (#41 — this file), bosses just live as data with
// the same combat schema as combat-class threats in threats.js plus a
// few extra fields:
//
//   boss: true              — identifies as a boss (router can sniff)
//   tier: "mini" | "main"   — content tier within an era
//   era: 1 | 2 | 3          — era gate (computeEra >= boss.era)
//   requires: { ... }       — additional gates (research, study, alignment)
//   elementalGate?: string  — Era 3+ specific. Which study path qualifies.
//                             (Any one node from this path unlocks the boss.)
//   defeatReward?: { ... }  — what the player gets on victory. #40 modal
//                             reads this to apply on first-defeat AND repeat.
//   firstDefeatLog?: string — one-shot narrative beat the first time only
//                             (stamped into persistent.bossesDefeated).
//   etching?: string        — stamped into persistent.altarEtchings on
//                             first defeat (matches Arcane Studies pattern).
//
// Bosses share threat.combat shape (hp, acc, eva, damage, damageType) and
// threat.combatFlavor (opener, attack, miss, victory, defeat).
//
// encounterChance: 0 — bosses NEVER fire from random rolls. They're
// challenged explicitly via the boss UI (#40, not yet shipped). The 0
// also keeps them off the routeThreat() path in threats.js, so authoring
// here is safe to ship before the modal lands.
//
// Roster shape: 1 mini + 1 main per era. Six total in Phase 1. Add more
// as new entries; schema is flat and additive.

export const BOSSES = {
  // ═══════════════════════════════════════════════════════════════════
  // Era 1 — The Wasteland's First Real Foes
  // ═══════════════════════════════════════════════════════════════════

  era1_mini_dustCrownedScavenger: {
    id: "era1_mini_dustCrownedScavenger",
    name: "The Dust-Crowned Scavenger",
    icon: "👤",
    boss: true,
    tier: "mini",
    era: 1,
    kind: "human",
    description:
      "The leader of the dust band that's been picking at your edges. Older than the rest. Crowned with bone the rest of his kind can't afford. He has watched you build, and decided what he's owed.",
    encounterChance: 0,
    requires: { hutBuilt: true },
    minGathersAfterGate: 0,
    combat: {
      hp: 30,
      acc: 0.72,
      eva: 0.05,
      damage: { min: 3, max: 5 },
      damageType: "hp",
    },
    defeatReward: {
      inventory: { wood: 10, stone: 10, food: 5, fragments: 1 },
    },
    firstDefeatLog:
      "🥇 The Dust-Crowned Scavenger falls. The band scatters with him. You stand a long time looking at the bone-crown before you set it down.",
    etching: "first_boss_era1",
    combatFlavor: {
      opener: [
        "👤 The Dust-Crowned Scavenger steps from the ash and shows you his teeth. His band stays at the edge of the firelight.",
        "👤 He walks in slow. The crown of bones catches what little light there is. He doesn't bother with words.",
        "👤 You hear him before you see him — the dragging step, the dry breathing. He's been waiting for the right night.",
      ],
      attack: [
        "👤 He swings a notched knife. {dmg} ❤️.",
        "👤 He gets inside your reach faster than you expected. {dmg} ❤️.",
        "👤 The bone-crown ducks; the blade comes up under it. {dmg} ❤️.",
      ],
      miss: [
        "👤 He overcommits. The knife passes harmless.",
        "👤 You step inside the swing. He resets, breathing hard.",
      ],
      victory: [
        "👑 He drops. The crown clatters off into the dust. His band is already gone.",
        "👑 You stand over him. The bones in his crown were cracked already. He had been bleeding inside this whole time.",
      ],
      defeat: [
        "👑 He stands over you. The crown of bones is the last thing you see clearly.",
      ],
    },
  },

  era1_main_longToothedOne: {
    id: "era1_main_longToothedOne",
    name: "The Long-Toothed One",
    icon: "🐺",
    boss: true,
    tier: "main",
    era: 1,
    kind: "beast",
    description:
      "A wasteland predator three winters too clever. It has watched you for weeks. It has watched the dust band, too. It is waiting for the right moment to take what is left of either of you.",
    encounterChance: 0,
    requires: { hutBuilt: true },
    minGathersAfterGate: 0,
    combat: {
      hp: 50,
      acc: 0.78,
      eva: 0.12,
      damage: { min: 4, max: 7 },
      damageType: "hp",
      defenseHalf: false,
    },
    defeatReward: {
      inventory: { food: 15, feathers: 10, fragments: 2 },
    },
    firstDefeatLog:
      "🥇 The Long-Toothed One falls. You drag it back to the fire and learn what its teeth were really for. Some of them go into the wall above the door.",
    etching: "first_boss_era1_main",
    combatFlavor: {
      opener: [
        "🐺 The Long-Toothed One pads out of the dust. It is bigger than you remembered. It does not run.",
        "🐺 Yellow eyes, low to the ground. The shoulders bunch. It has been hungry a long time, and patient.",
        "🐺 You see the teeth first. The rest of it is the same color as the ground.",
      ],
      attack: [
        "🐺 It lunges. Teeth find purchase. {dmg} ❤️.",
        "🐺 It rakes you with a forepaw before you can pull back. {dmg} ❤️.",
        "🐺 You feel it bite, then bite deeper. {dmg} ❤️.",
      ],
      miss: [
        "🐺 It snaps and finds only the haft of your weapon.",
        "🐺 It twists past your strike, low to the ground.",
      ],
      victory: [
        "🦴 It drops at last. You sit beside it a long time, listening to the wind.",
        "🦴 The Long-Toothed One stills. You take the teeth. You take the meat. You take what it would have taken from you.",
      ],
      defeat: [
        "🦴 You feel it close around your throat. The dust takes you, and the long teeth.",
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Era 2 — Settler Threats: Other People with Plans
  // ═══════════════════════════════════════════════════════════════════

  era2_mini_raiderCaptain: {
    id: "era2_mini_raiderCaptain",
    name: "The Raider Captain",
    icon: "🗡️",
    boss: true,
    tier: "mini",
    era: 2,
    kind: "human",
    description:
      "She rides in alone. The rest of her band watches from the ridge. She is here to count what you have and decide whether her people will take it tonight or wait until the next moon.",
    encounterChance: 0,
    requires: { hutBuilt: true, hasBuilding: "home" },
    minGathersAfterGate: 0,
    combat: {
      hp: 65,
      acc: 0.82,
      eva: 0.15,
      damage: { min: 5, max: 9 },
      damageType: "hp",
    },
    defeatReward: {
      inventory: { wood: 20, stone: 20, fragments: 3, feathers: 5 },
    },
    firstDefeatLog:
      "🥇 The Raider Captain falls. The ridge empties. The band will not come for you tonight. The band will think long before coming at all.",
    etching: "first_boss_era2",
    combatFlavor: {
      opener: [
        "🗡️ She rides in slow, dismounts slower. The band stays back. Whatever she came to do, she came to do it herself.",
        "🗡️ The Raider Captain. Older than she should be, given what she has done.",
        "🗡️ She tests the edge of her sword on her own thumb before she looks at you. The blood is the only color in the camp.",
      ],
      attack: [
        "🗡️ Her blade is faster than your eye. {dmg} ❤️.",
        "🗡️ She steps in clean and cuts deep. {dmg} ❤️.",
        "🗡️ Her sword finds a gap in everything you have. {dmg} ❤️.",
      ],
      miss: [
        "🗡️ She lets you commit, then is somewhere else.",
        "🗡️ A wide swing of yours. She is already past it.",
      ],
      victory: [
        "👑 She drops to one knee, then sideways. The band on the ridge is already moving away.",
        "👑 She dies surprised. You take her sword. You leave the rest.",
      ],
      defeat: [
        "👑 You feel the sword find your ribs. She is quiet about it. So are you.",
      ],
    },
  },

  era2_main_ironHand: {
    id: "era2_main_ironHand",
    name: "The Iron-Hand",
    icon: "⚒️",
    boss: true,
    tier: "main",
    era: 2,
    kind: "corrupted_human",
    description:
      "He was a smith, once. Then he made one piece too many, and the work made him back. His right hand is forge-iron grown into bone. His eyes are coal. He has come to see what kind of smith you became.",
    encounterChance: 0,
    requires: { hutBuilt: true, hasBuilding: "forge" },
    minGathersAfterGate: 0,
    combat: {
      hp: 110,
      acc: 0.75,
      eva: 0.05,
      damage: { min: 7, max: 12 },
      damageType: "hp",
      defenseHalf: true,
    },
    defeatReward: {
      inventory: { stone: 30, wood: 15, fragments: 5, feathers: 10 },
    },
    firstDefeatLog:
      "🥇 The Iron-Hand kneels and does not get up. The iron in his arm is still warm when you pry it free. You will carry the warmth a long time after.",
    etching: "first_boss_era2_main",
    combatFlavor: {
      opener: [
        "⚒️ The Iron-Hand comes down the road. The arm at his side is glowing softly, the way embers glow under ash.",
        "⚒️ He smells like the forge before the forge was yours. You know without asking he can name every weapon you've made.",
        "⚒️ His iron hand makes a sound as it opens. It is the sound of a forge breathing.",
      ],
      attack: [
        "⚒️ The iron fist swings. The world goes white. {dmg} ❤️.",
        "⚒️ He hits you with the back of his hand, almost gently. {dmg} ❤️.",
        "⚒️ The heat finds you before the iron does. {dmg} ❤️.",
      ],
      miss: [
        "⚒️ The iron arm whistles past your ear. You can feel the heat afterward.",
        "⚒️ He overcorrects. The arm is heavier than even he expects.",
      ],
      victory: [
        "🔥 He sits down hard against the wall. The iron in his arm is dimming. He looks almost grateful.",
        "🔥 The Iron-Hand falls. He smiles at you with old coal-eyes before they go out.",
      ],
      defeat: [
        "🔥 The iron arm closes once around your chest. The forge takes you. The forge has always been taking someone.",
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // Era 3 — Awakened World: Arcane Bosses, Elemental Gates
  // ═══════════════════════════════════════════════════════════════════

  era3_mini_stilledChoir: {
    id: "era3_mini_stilledChoir",
    name: "The Stilled Choir",
    icon: "🕯️",
    boss: true,
    tier: "mini",
    era: 3,
    kind: "demon",
    elementalGate: "memory",
    description:
      "A throng of voices that never finished a sentence. They want yours. They will trade their dust for your breath. The bargain is in the air before they are.",
    encounterChance: 0,
    requires: { hutBuilt: true, researched: "arcaneAwakening" },
    minGathersAfterGate: 0,
    combat: {
      hp: 80,
      acc: 0.88,
      eva: 0.20,
      damage: { min: 4, max: 8 },
      damageType: "sanity",
      defenseHalf: true,
    },
    defeatReward: {
      inventory: { fragments: 8 },
    },
    firstDefeatLog:
      "🥇 The Stilled Choir falls silent. The silence afterward is the same silence — but it is yours now, not theirs.",
    etching: "first_boss_era3",
    combatFlavor: {
      opener: [
        "🕯️ The air goes wrong. Voices that aren't voices try a chord. The Stilled Choir is here.",
        "🕯️ Candles you never lit are burning at the corners of the room. The Choir wants to finish a song.",
        "🕯️ A hum starts in the back of your skull and becomes a small congregation around you.",
      ],
      attack: [
        "🕯️ The Choir tries a note that does not exist. {dmg} ◐.",
        "🕯️ They sing through you. Your hands forget what they were doing. {dmg} ◐.",
        "🕯️ A word lands in your head that was never yours. {dmg} ◐.",
      ],
      miss: [
        "🕯️ The chord breaks. The Choir resets.",
        "🕯️ You hum your own song over theirs. The note collapses.",
      ],
      victory: [
        "🕯️ The candles go out one by one. The Choir is gone. The room is yours again.",
        "🕯️ The last voice finds its way out of you. You feel where it was. You do not miss it.",
      ],
      defeat: [
        "🕯️ The Choir finishes the song. You sing the last line with them. You do not remember it after.",
      ],
    },
  },

  era3_main_lastForager: {
    id: "era3_main_lastForager",
    name: "The Last Forager",
    icon: "🪦",
    boss: true,
    tier: "main",
    era: 3,
    kind: "demon",
    elementalGate: "voidcall",
    description:
      "A figure walking out of the dust on the same path you walked in on. Wearing a hut on her back like a shell. The stone in her hand is humming, and the hum is in your hand too.",
    encounterChance: 0,
    requires: { hutBuilt: true, researched: "arcaneAwakening" },
    minGathersAfterGate: 0,
    combat: {
      hp: 160,
      acc: 0.85,
      eva: 0.15,
      damage: { min: 6, max: 11 },
      damageType: "hp",
      defenseHalf: true,
    },
    defeatReward: {
      inventory: { fragments: 15, food: 20, water: 10, stone: 20 },
    },
    firstDefeatLog:
      "🥇 The Last Forager falls. The stone in her hand goes quiet. So does the stone in yours, for a moment, and then it starts again — but it is your stone now, and only yours. The Awakened World is yours to walk.",
    etching: "first_boss_era3_main",
    combatFlavor: {
      opener: [
        "🪦 She comes down the path you came up. She looks like you, but older — or younger, depending on how you have lived.",
        "🪦 The Last Forager. Carrying a hut on her back. Wearing your face the way someone wears a memory of a face.",
        "🪦 The dust parts around her. The stone in her hand hums. You can feel it against your own palm.",
      ],
      attack: [
        "🪦 She knows where your guard is weak. {dmg} ❤️.",
        "🪦 She fights the way you would. {dmg} ❤️.",
        "🪦 You feel the strike before you see it — because you would have made it, in her place. {dmg} ❤️.",
      ],
      miss: [
        "🪦 She misses, the same way you would have missed. You watch her catch herself.",
        "🪦 The stone in her hand pulses, then dims. The strike falls short.",
      ],
      victory: [
        "🪦 She kneels. She looks at you, and the look is not anger. It is recognition. Then she is gone, and the dust is just dust again.",
        "🪦 The Last Forager dies the way you would have wanted to. Quietly. With the stone in her hand.",
      ],
      defeat: [
        "🪦 She kneels over you and closes your eyes the way you would have closed them yourself.",
      ],
    },
  },
};

export const getBoss = (id) => BOSSES[id] || null;
export const getAllBosses = () => Object.values(BOSSES);
export const getBossesForEra = (era) =>
  getAllBosses().filter((b) => b.era === era);
export const getBossesAvailable = (state) => {
  // Helper: which bosses the player COULD challenge right now. Reads the
  // same gates the threats system uses (requires.researched / hasBuilding)
  // plus boss-specific elementalGate (any study completion in the given
  // path qualifies). The boss modal (#40) will filter via this.
  const era = state.run.era ?? 0;
  const studiesCompleted = state.run.studiesCompleted || {};
  return getAllBosses().filter((b) => {
    if (b.era > era) return false;
    if (b.requires?.researched && !state.run.researched?.[b.requires.researched]) return false;
    if (b.requires?.hasBuilding && !state.run.built?.[b.requires.hasBuilding]) return false;
    if (b.requires?.hutBuilt && !state.run.built?.hut) return false;
    if (b.elementalGate) {
      // Any completed study from the gated path counts. studiesCompleted
      // shape: { studyId: { completedAt } }. We need to cross-reference
      // with content/studies.js for path lookup — but to keep this file
      // free of system imports we just check that the path tag appears in
      // any completed study id. Studies are named like "<path>_<node>" in
      // existing content (e.g. "memory_firstEcho"), so prefix match works.
      const anyMatch = Object.keys(studiesCompleted).some((sid) =>
        sid.startsWith(`${b.elementalGate}_`)
      );
      if (!anyMatch) return false;
    }
    return true;
  });
};
