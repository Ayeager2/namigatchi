import { coinFlip } from "./coinflip";
import { luckyDice } from "./luckyDice";
import { highLow } from "./highLow";
import { treasureChest } from "./treasureChest";

export const MINIGAMES = {
  [coinFlip.id]: coinFlip,
  [luckyDice.id]: luckyDice,
  [highLow.id]: highLow,
  [treasureChest.id]: treasureChest,
};

export function getMinigame(id) {
  return MINIGAMES[id] || null;
}

export function getAllMinigames() {
  return Object.values(MINIGAMES);
}
