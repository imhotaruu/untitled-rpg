import { items } from "../data/items";
import { getUpgradeBonusTotals } from "./upgradeBonuses";

function getAttribute(attributes, attributeId) {
  const value = Number(attributes?.[attributeId]);

  return Number.isFinite(value) ? value : 1;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getItemById(itemId) {
  return items.find((item) => item.id === itemId) || null;
}

function addBonus(totalBonuses, statId, amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return;
  }

  totalBonuses[statId] = (totalBonuses[statId] || 0) + amount;
}

export function getEquipmentBonusTotals(gameState) {
  const totalBonuses = {};
  const equipment = gameState.equipment || {};

  Object.values(equipment).forEach((itemId) => {
    if (!itemId) {
      return;
    }

    const item = getItemById(itemId);
    const bonuses = item?.equipmentBonuses || {};

    Object.entries(bonuses).forEach(([statId, amount]) => {
      addBonus(totalBonuses, statId, amount);
    });
  });

  return totalBonuses;
}

export function getDerivedCombatStats(player, gameState) {
  const attributes = player.attributes || {};
  const combatTraining = gameState.progress?.combatTraining ?? 0;
  const hasBasicGuard = Boolean(gameState.unlocks?.systems?.basic_guard);
  const equipmentBonuses = getEquipmentBonusTotals(gameState);
  const upgradeBonuses = getUpgradeBonusTotals(gameState);

  const strength = getAttribute(attributes, "strength");
  const dexterity = getAttribute(attributes, "dexterity");
  const constitution = getAttribute(attributes, "constitution");
  const intelligence = getAttribute(attributes, "intelligence");
  const wisdom = getAttribute(attributes, "wisdom");
  const charisma = getAttribute(attributes, "charisma");
  const luck = getAttribute(attributes, "luck");

  return {
    attackPower:
      1 +
      strength * 2 +
      Math.floor(combatTraining / 2) +
      (upgradeBonuses.attackPower || 0) +
      (equipmentBonuses.attackPower || 0),

    defense:
      1 +
      constitution +
      (hasBasicGuard ? 2 : 0) +
      (equipmentBonuses.defense || 0),

    guardPower:
      1 +
      constitution +
      Math.floor(strength / 2) +
      (hasBasicGuard ? 2 : 0) +
      (upgradeBonuses.guardPower || 0) +
      (equipmentBonuses.guardPower || 0),

    accuracy: clamp(
      70 +
        dexterity * 3 +
        Math.floor(combatTraining / 2) +
        (upgradeBonuses.accuracy || 0) +
        (equipmentBonuses.accuracy || 0),
      0,
      95
    ),

    evasion: clamp(
      5 + dexterity * 2 + Math.floor(wisdom / 2) + (equipmentBonuses.evasion || 0),
      0,
      60
    ),

    criticalChance: clamp(3 + luck + (equipmentBonuses.criticalChance || 0), 0, 50),

    initiative:
      dexterity + Math.floor(luck / 2) + (equipmentBonuses.initiative || 0),

    focus: intelligence + wisdom + (equipmentBonuses.focus || 0),

    resolve: wisdom + charisma + (equipmentBonuses.resolve || 0),
  };
}

export function formatDerivedCombatStatValue(statId, value) {
  const percentStats = ["accuracy", "evasion", "criticalChance"];

  if (percentStats.includes(statId)) {
    return `${value}%`;
  }

  return value;
}
