// Primitive tool definitions — DATA, not code.
// Adding a tool = new entry here. No code changes needed elsewhere.
//
// Tools are CRAFTED INVENTORY ITEMS in category "tool". They live alongside
// resources in run.inventory but render in the Tools section. While owned,
// each tool's effects apply passively. The Forge (Era 2) is NOT required for
// these — they're primitive enough to be made by hand. Era 2 tools (Stone
// Axe, Bone Knife, etc.) will require a Forge.
//
// Each tool has:
//   id, name, icon, description     — basic identity
//   category                         — UI grouping (currently always "primitive")
//   cost: { resourceId: qty }        — consumed when crafted
//   requires:                        — gating predicates
//     researched: "researchId"          require this research learned
//     skill: { skillId: minLevel, ... } require these minimum skill levels
//     toolOwned: "toolId"               require this tool already in inventory
//   effect:                          — declarative passive bonuses while owned
//     unlocksAction: "hunt"             gates a UI action button
//     gatherSpeedup: <ms>               reduce gather cooldown
//     gatherBonus: <int>                add to gather yield
//     waterBonus: <int>                 specifically boost water gathers
//     huntYieldBonus: <int>             add to hunt drop quantities
//     huntCooldownReduction: <ms>       trim hunt cooldown
//     huntBetterBirds: <num>            shift hunt weights toward birds
//   durability:                      — how the tool wears out
//     max: <int>                        starting / max durability charges
//     wearsOn: "hunt" | "gather" | "waterGather"
//                                       which action ticks down durability by 1
//   effectSummary                    — human-readable summary for UI
//   onCraftedMessage                 — log line on creation
//   onBrokenMessage                  — log line when durability hits 0
//   tier                             — column in the tools modal (1 = primitive, 2 = Era 2, ...)
//   col                              — vertical position within tier

export const TOOL_CATEGORIES = {
  primitive: { id: "primitive", name: "Primitive", order: 1 },
  bronze:    { id: "bronze",    name: "Bronze",    order: 2 },
  iron:      { id: "iron",      name: "Iron",      order: 3 },
  arcane:    { id: "arcane",    name: "Arcane",    order: 4 },
};

export const TOOLS = {
  // Net — the gateway to hunting. Crude but it works on slow birds.
  // Wears each hunt — primitive cordage frays fast.
  net: {
    id: "net",
    name: "Net",
    icon: "🕸️",
    category: "primitive",
    description:
      "A loose weave of cordage and lashings. Throw it; pray. The birds are slow at first.",
    cost: { wood: 6, stone: 2 },
    requires: { researched: "netWeaving" },
    effect: { unlocksAction: "hunt" },
    durability: { max: 12, wearsOn: "hunt" },
    effectSummary: "Unlocks the Hunt action. · 12 hunts before it frays.",
    onCraftedMessage:
      "🕸️ You finish the net. The lashings hold. You think you can throw it.",
    onBrokenMessage:
      "🕸️ The net comes apart in your hands. You'll need to weave another.",
    tier: 1,
    col: 0,
  },

  // Snare — the second-tier primitive tool. Adds reliability to hunts.
  // Gated behind Trapping research (which requires Tracking research) + a
  // Hunting skill threshold so the player has actually hunted with the Net first.
  // Lasts longer than the Net — set, leave, retrieve.
  snare: {
    id: "snare",
    name: "Snare",
    icon: "🪤",
    category: "primitive",
    description:
      "A loop of cordage hidden where birds land. Quieter than the net. More patient.",
    cost: { wood: 8, stone: 3, feathers: 2 },
    requires: {
      researched: "trapping",
      skill: { hunting: 2 },
    },
    effect: {
      huntYieldBonus: 1,
      huntCooldownReduction: 1500,
      huntBetterBirds: 4,
    },
    durability: { max: 20, wearsOn: "hunt" },
    effectSummary:
      "+1 hunt yield · –1500ms hunt cooldown · more birds, fewer empty hunts. · 20 hunts before the loop breaks.",
    onCraftedMessage:
      "🪤 The snare is set. You crouch and wait. The wasteland feels different from this side of patience.",
    onBrokenMessage:
      "🪤 The snare line snaps. The set is ruined. Make another.",
    tier: 1,
    col: 1,
  },

  // Digging Stick — primitive water/root tool. Improves gather a bit
  // generally and adds a little extra to water specifically. Wears with each
  // gather (any kind).
  diggingStick: {
    id: "diggingStick",
    name: "Digging Stick",
    icon: "🥢",
    category: "primitive",
    description:
      "A hardwood shaft, fire-tempered at the tip. Bites soil where fingers fail.",
    cost: { wood: 5, stone: 2 },
    requires: { researched: "diggingStickCraft" },
    effect: { gatherSpeedup: 100, waterBonus: 1 },
    durability: { max: 25, wearsOn: "gather" },
    effectSummary:
      "–100ms gather cooldown · +1 water on water gathers. · 25 gathers before the tip splinters.",
    onCraftedMessage:
      "🥢 You shape the stick and harden the tip in the embers. The earth will give up more, now.",
    onBrokenMessage:
      "🥢 The tip splinters and snaps off. Time to harden another.",
    tier: 1,
    col: 2,
  },

  // Water Skin — passive carry/storage. Wears down only on water gathers
  // (the seal weeps). Lasts longer than other tools because water gathers
  // are themselves rare.
  waterSkin: {
    id: "waterSkin",
    name: "Water Skin",
    icon: "🧴",
    category: "primitive",
    description:
      "A bladder of stretched hide, sealed with sap. Holds more than your hands ever could.",
    cost: { water: 3, feathers: 1, stone: 1 },
    requires: { researched: "waterCarrying" },
    effect: { waterBonus: 1 },
    durability: { max: 30, wearsOn: "waterGather" },
    effectSummary:
      "+1 water on water gathers. (Stacks with Digging Stick.) · 30 water-fills before the seal fails.",
    onCraftedMessage:
      "🧴 You stitch and seal. The skin holds. Water no longer slips through your fingers.",
    onBrokenMessage:
      "🧴 The seal gives way. Water seeps from a tear you cannot find. Make another.",
    tier: 1,
    col: 3,
  },
};

export const getTool = (id) => TOOLS[id] || null;
export const getAllTools = () => Object.values(TOOLS);

// Tools currently owned (qty > 0 in inventory under category "tool").
export function getOwnedTools(run) {
  const owned = [];
  for (const t of getAllTools()) {
    if ((run?.inventory?.[t.id] || 0) > 0) owned.push(t);
  }
  return owned;
}

// Aggregate effect across all owned tools. Multiple copies don't multiply
// (we treat tools as binary — owning two doesn't double a bonus). Caller
// can read whichever stat they care about.
export function getToolEffects(run) {
  const eff = {
    unlocksAction: {},     // { actionName: true }
    gatherSpeedup: 0,
    gatherBonus: 0,
    waterBonus: 0,
    huntYieldBonus: 0,
    huntCooldownReduction: 0,
    huntBetterBirds: 0,
  };
  for (const t of getOwnedTools(run)) {
    const e = t.effect || {};
    if (e.unlocksAction) eff.unlocksAction[e.unlocksAction] = true;
    if (e.gatherSpeedup) eff.gatherSpeedup += e.gatherSpeedup;
    if (e.gatherBonus) eff.gatherBonus += e.gatherBonus;
    if (e.waterBonus) eff.waterBonus += e.waterBonus;
    if (e.huntYieldBonus) eff.huntYieldBonus += e.huntYieldBonus;
    if (e.huntCooldownReduction) eff.huntCooldownReduction += e.huntCooldownReduction;
    if (e.huntBetterBirds) eff.huntBetterBirds += e.huntBetterBirds;
  }
  return eff;
}

