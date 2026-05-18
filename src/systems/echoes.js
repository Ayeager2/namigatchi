// Echo upgrades system. Pure functions for buy + apply.
//
// State shape:
//   persistent.echoes        — current Echo balance
//   persistent.echoUpgrades  — { upgradeId: level }   (level = times bought)
//
// Buying: subtract cost, increment level. Returns { persistent, msg }.
// Applying: at the start of a fresh run, seed inventory + stats + skills
// based on owned upgrade levels. Called from reducer's RESET_RUN and PRESTIGE.

import { getEchoUpgrade, getAllEchoUpgrades, getNextLevelCost } from "../content/echoes.js";

// Same XP-for-level curve the dev panel uses. Kept here so the system file
// doesn't depend on dev.js.
function xpForLevel(level) {
  if (level <= 0) return 0;
  return Math.floor((5 * (Math.pow(1.8, level) - 1)) / 0.8);
}

const STAT_CLAMP = (n) => Math.max(0, Math.min(100, n));

export function getUpgradeLevel(persistent, upgradeId) {
  return persistent?.echoUpgrades?.[upgradeId] || 0;
}

// Returns { ok, reason }.
export function canBuyEchoUpgrade(persistent, upgradeId) {
  const upgrade = getEchoUpgrade(upgradeId);
  if (!upgrade) return { ok: false, reason: "Unknown upgrade." };
  const currentLevel = getUpgradeLevel(persistent, upgradeId);
  if (currentLevel >= (upgrade.maxLevel ?? 1)) {
    return { ok: false, reason: "Already at max." };
  }
  const cost = getNextLevelCost(upgrade, currentLevel);
  if ((persistent.echoes || 0) < cost) {
    return { ok: false, reason: `Need ${cost} Echoes.` };
  }
  return { ok: true };
}

// Buy the next level. Returns { persistent, events, msg } shaped for the
// reducer to log alongside the change.
export function performBuyEchoUpgrade(persistent, upgradeId) {
  const upgrade = getEchoUpgrade(upgradeId);
  if (!upgrade) {
    return { persistent, events: [{ kind: "buyFail", message: "Unknown upgrade." }] };
  }
  const check = canBuyEchoUpgrade(persistent, upgradeId);
  if (!check.ok) {
    return { persistent, events: [{ kind: "buyFail", message: check.reason }] };
  }
  const currentLevel = getUpgradeLevel(persistent, upgradeId);
  const cost = getNextLevelCost(upgrade, currentLevel);
  const echoUpgrades = {
    ...(persistent.echoUpgrades || {}),
    [upgradeId]: currentLevel + 1,
  };
  const next = {
    ...persistent,
    echoes: (persistent.echoes || 0) - cost,
    echoUpgrades,
  };
  const newLevel = currentLevel + 1;
  return {
    persistent: next,
    events: [
      {
        kind: "echo_buy",
        message: `🌀 Channeled an Echo into ${upgrade.name} (lvl ${newLevel}). -${cost} Echo${cost !== 1 ? "es" : ""}.`,
      },
    ],
  };
}

// Apply every owned upgrade to a fresh run. Reads persistent.echoUpgrades
// and mutates the run's inventory / stats / skills accordingly.
// Returns a NEW run object — never mutates.
export function applyEchoUpgrades(run, persistent) {
  const upgrades = persistent?.echoUpgrades || {};
  if (Object.keys(upgrades).length === 0) return run;

  let inventory = { ...(run.inventory || {}) };
  let stats = { ...(run.stats || {}) };
  let skills = { ...(run.skills || {}) };

  for (const [id, level] of Object.entries(upgrades)) {
    const def = getEchoUpgrade(id);
    if (!def || !level) continue;
    const eff = def.effect || {};

    if (eff.startInventory) {
      for (const [resId, qtyPerLevel] of Object.entries(eff.startInventory)) {
        inventory[resId] = (inventory[resId] || 0) + qtyPerLevel * level;
      }
    }

    if (eff.startStatDelta) {
      for (const [statKey, deltaPerLevel] of Object.entries(eff.startStatDelta)) {
        const current = stats[statKey] ?? 50;
        stats[statKey] = STAT_CLAMP(current + deltaPerLevel * level);
      }
    }

    if (eff.startSkillLevel) {
      for (const [skillId, levelsPerTier] of Object.entries(eff.startSkillLevel)) {
        const targetLevel = levelsPerTier * level;
        const existing = skills[skillId] || { xp: 0, level: 0 };
        // Take the higher of existing and the upgrade-granted level so
        // multiple upgrades stack sensibly (and re-application is idempotent).
        if (targetLevel > existing.level) {
          skills[skillId] = { xp: xpForLevel(targetLevel), level: targetLevel };
        }
      }
    }
  }

  return { ...run, inventory, stats, skills };
}

// UI helper: list of all upgrades with current level + cost + status.
export function getShopRows(persistent) {
  return getAllEchoUpgrades().map((u) => {
    const level = getUpgradeLevel(persistent, u.id);
    const maxLevel = u.maxLevel ?? 1;
    const maxed = level >= maxLevel;
    const cost = maxed ? null : getNextLevelCost(u, level);
    const affordable = !maxed && (persistent.echoes || 0) >= cost;
    return { upgrade: u, level, maxLevel, maxed, cost, affordable };
  });
}
