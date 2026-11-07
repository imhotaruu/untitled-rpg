import { upgrades } from "../data/upgrades";

export function getUpgradeLevel(state, upgradeId) {
  const upgrade = upgrades.find((entry) => entry.id === upgradeId);
  const level = state.upgrades?.levels?.[upgradeId];
  return upgrade && Number.isFinite(level)
    ? Math.max(0, Math.min(upgrade.maxLevel, Math.floor(level))) : 0;
}

// Combat bonuses are derived from purchased ranks, never written into player stats.
// Legacy health/stamina upgrades already persist their effects in the player record.
export function getUpgradeBonusTotals(state) {
  const bonuses = {};
  for (const upgrade of upgrades) {
    const level = getUpgradeLevel(state, upgrade.id);
    for (const [stat, amount] of Object.entries(upgrade.combatBonuses || {})) {
      if (level > 0) bonuses[stat] = (bonuses[stat] || 0) + amount * level;
    }
  }
  return bonuses;
}
