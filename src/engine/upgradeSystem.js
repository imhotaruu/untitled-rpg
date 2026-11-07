import { storyEvents } from "../data/storyEvents";
import { upgrades } from "../data/upgrades";
import { getDerivedCombatStats } from "./derivedStats";
import { getUpgradeLevel } from "./upgradeBonuses";
export { getUpgradeLevel } from "./upgradeBonuses";
import {
  canPayResourceCost,
  payResourceCost,
} from "./resourceSystem";
import { processStoryEvents } from "./storySystem";
import { processUnlocks } from "./unlockSystem";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function addLog(logList, message) {
  return [message, ...logList].slice(0, 50);
}

function ensureUpgradeState(state) {
  if (!state.upgrades) {
    state.upgrades = {
      levels: {},
    };
  }

  if (!state.upgrades.levels) {
    state.upgrades.levels = {};
  }
}

export function isUpgradeMaxed(state, upgrade) {
  return getUpgradeLevel(state, upgrade.id) >= upgrade.maxLevel;
}

export function getNextUpgradeCost(state, upgrade) {
  const currentLevel = getUpgradeLevel(state, upgrade.id);

  return upgrade.costs[currentLevel] || null;
}

export function getUpgradePreview(state, upgrade) {
  const maxed = isUpgradeMaxed(state, upgrade);
  const rows = (upgrade.effects || [])
    .filter(({ stat }) => stat.startsWith("max") || stat.endsWith("Regen"))
    .map(({ stat, amount }) => ({ stat, current: state.player[stat], next: state.player[stat] + (maxed ? 0 : amount) }));
  if (upgrade.combatBonuses) {
    const current = getDerivedCombatStats(state.player, state);
    const nextState = { ...state, upgrades: { ...state.upgrades, levels: {
      ...state.upgrades?.levels,
      [upgrade.id]: getUpgradeLevel(state, upgrade.id) + (maxed ? 0 : 1),
    } } };
    const next = getDerivedCombatStats(state.player, nextState);
    for (const stat of Object.keys(upgrade.combatBonuses)) {
      rows.push({ stat, current: current[stat], next: next[stat] });
    }
  }
  return rows;
}

export function getUpgradeBlockReason(state, upgrade) {
  if (state.combat) return "Finish the battle before upgrading.";
  if (isUpgradeMaxed(state, upgrade)) return "Maximum level reached.";
  if (upgrade.requiredSystem && !state.unlocks?.systems?.[upgrade.requiredSystem]) {
    return upgrade.requirementText;
  }
  if (upgrade.combatBonuses && getUpgradePreview(state, upgrade).every((row) => row.next <= row.current)) {
    return "At the current stat cap. This rank would not improve your stats.";
  }
  const cost = getNextUpgradeCost(state, upgrade);
  if (!cost) return "Upgrade unavailable.";
  if (!canPayResourceCost(state.resources, cost)) return getMissingResourceMessage(state.resources, cost);
  return null;
}

function applyUpgradeEffects(player, effects = []) {
  effects.forEach((effect) => {
    const currentValue = player[effect.stat];

    if (typeof currentValue !== "number") return;

    player[effect.stat] = currentValue + effect.amount;
  });

  player.hp = Math.min(player.hp, player.maxHp);
  player.mp = Math.min(player.mp, player.maxMp);
  player.stamina = Math.min(player.stamina, player.maxStamina);
}

function formatResourceName(resources, resourceId) {
  return resources[resourceId]?.label || resourceId;
}

export function formatResourceCost(cost = {}, resources = {}) {
  const entries = Object.entries(cost);

  if (entries.length === 0) {
    return "Free";
  }

  return entries
    .map(([resourceId, amount]) => {
      return `${amount} ${formatResourceName(resources, resourceId)}`;
    })
    .join(", ");
}

function getMissingResourceMessage(resources, cost = {}) {
  const missingResources = Object.entries(cost)
    .filter(([resourceId, amount]) => {
      return (resources[resourceId]?.amount || 0) < amount;
    })
    .map(([resourceId]) => formatResourceName(resources, resourceId));

  if (missingResources.length === 0) {
    return "Not enough resources.";
  }

  if (missingResources.length === 1) {
    return `Not enough ${missingResources[0]}.`;
  }

  const lastResource = missingResources[missingResources.length - 1];
  const otherResources = missingResources.slice(0, -1).join(", ");

  return `Not enough ${otherResources} and ${lastResource}.`;
}

export function purchaseUpgrade(currentState, requestedUpgrade) {
  if (currentState.combat || currentState.conversation) return currentState;
  // Resolve the definition here so callers cannot bypass costs or requirements.
  const upgrade = upgrades.find((entry) => entry.id === requestedUpgrade?.id);
  if (!upgrade) return currentState;
  const nextState = clone(currentState);

  ensureUpgradeState(nextState);

  const currentLevel = getUpgradeLevel(nextState, upgrade.id);
  const blocked = getUpgradeBlockReason(nextState, upgrade);
  if (blocked) {
    nextState.actionLog = addLog(nextState.actionLog, blocked);
    return nextState;
  }

  const cost = getNextUpgradeCost(nextState, upgrade);
  payResourceCost(nextState.resources, cost);
  applyUpgradeEffects(nextState.player, upgrade.effects);

  nextState.upgrades.levels[upgrade.id] = currentLevel + 1;

  nextState.actionLog = addLog(
    nextState.actionLog,
    `Upgrade purchased: ${upgrade.label} Lv. ${currentLevel + 1}. Spent: ${formatResourceCost(cost, nextState.resources)}.`
  );

  processStoryEvents(nextState, storyEvents);
  processUnlocks(nextState);

  return nextState;
}
