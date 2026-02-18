// src/tama/items.js

export const ITEM_TYPES = {
  SNACK: "snack",
  MEAL: "meal",
  TOY: "toy",
  VITAMINS: "vitamins",
  SOAP: "soap",
};

export const ITEMS = [
  {
    id: "snack_cookie",
    name: "Cookie",
    type: ITEM_TYPES.SNACK,
    cost: 2,
    cooldownMs: 8_000,
    effects: {
      hunger: -10,
      fun: +6,
      weight: +0.25,
      health: +0.2,
    },
  },
  {
    id: "meal_rice",
    name: "Rice Bowl",
    type: ITEM_TYPES.MEAL,
    cost: 5,
    cooldownMs: 12_000,
    effects: {
      hunger: -28,
      thirst: +3,
      weight: +0.4,
      health: +0.4,
    },
  },
  {
    id: "toy_ball",
    name: "Ball",
    type: ITEM_TYPES.TOY,
    cost: 4,
    cooldownMs: 10_000,
    effects: {
      fun: +18,
      energy: -6,
      thirst: +4,
      affection: +1.8,
    },
  },
  {
    id: "vitamins",
    name: "Vitamins",
    type: ITEM_TYPES.VITAMINS,
    cost: 6,
    cooldownMs: 20_000,
    effects: {
      health: +6,
      sickCureChance: 0.35, // extra cure chance if sick
      affection: +0.8,
    },
  },
  {
    id: "soap",
    name: "Soap",
    type: ITEM_TYPES.SOAP,
    cost: 3,
    cooldownMs: 14_000,
    effects: {
      hygiene: +22,
      poopClear: true,
      fun: -1,
    },
  },
];

export function getItemById(id) {
  return ITEMS.find((x) => x.id === id) || null;
}
