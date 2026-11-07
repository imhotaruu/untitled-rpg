import { upgrades } from "../data/upgrades";
import { getUpgradeBlockReason, getUpgradeLevel, getUpgradePreview } from "../engine/upgradeSystem";
import { formatDerivedCombatStatValue } from "../engine/derivedStats";
import { formatDerivedCombatStatLabel, formatRegenValue, formatStatLabel } from "./formatters";

const playerStatLabels = {
  maxHp: "Max health", maxMp: "Max mana", maxStamina: "Max stamina",
  hpRegen: "Health regen", staminaRegen: "Stamina regen",
};

function formatValue(stat, value) {
  return playerStatLabels[stat]
    ? `${formatRegenValue(value)}${stat.endsWith("Regen") ? "/s" : ""}`
    : formatDerivedCombatStatValue(stat, value);
}

// Compare the states surrounding a single purchase, excluding recovery ticks.
export function createUpgradeFeedback(before, after, upgradeId) {
  const upgrade = upgrades.find((entry) => entry.id === upgradeId);
  const level = getUpgradeLevel(after, upgradeId);
  if (!upgrade || level <= getUpgradeLevel(before, upgradeId)) {
    return {
      tone: "info", title: "No Change", itemLabel: upgrade?.label || "Upgrade",
      messages: [upgrade ? getUpgradeBlockReason(before, upgrade) || "Upgrade unavailable." : "Upgrade unavailable.",
        "No resources were spent."],
      duration: 7000,
    };
  }

  const previousRows = getUpgradePreview(before, upgrade);
  const currentRows = getUpgradePreview(after, upgrade);
  const messages = previousRows.flatMap(({ stat, current }) => {
    const value = currentRows.find((row) => row.stat === stat)?.current;
    if (value === undefined || value === current) return [];
    const label = playerStatLabels[stat] || formatDerivedCombatStatLabel(stat);
    return [`${label}: ${formatValue(stat, current)} → ${formatValue(stat, value)}`];
  });
  for (const stat of ["hp", "mp", "stamina"]) {
    const restored = after.player[stat] - before.player[stat];
    if (restored > 0) messages.push(`+${formatRegenValue(restored)} ${formatStatLabel(stat)} restored`);
  }
  const spent = Object.entries(before.resources).flatMap(([id, resource]) => {
    const amount = resource.amount - (after.resources[id]?.amount ?? resource.amount);
    return amount > 0 ? [`${formatRegenValue(amount)} ${resource.label || id}`] : [];
  });
  if (spent.length) messages.push(`Spent: ${spent.join(", ")}`);
  return {
    tone: "success", title: "Upgrade Purchased", itemLabel: `${upgrade.label} · Level ${level}`,
    messages, duration: 7000,
  };
}
