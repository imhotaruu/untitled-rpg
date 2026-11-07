import { useId } from "react";
import { getNextUpgradeCost, getUpgradeLevel, isUpgradeMaxed, getUpgradePreview, getUpgradeBlockReason } from "../engine/upgradeSystem";
import { formatRegenValue, formatDerivedCombatStatLabel } from "../utils/formatters";
import { formatDerivedCombatStatValue } from "../engine/derivedStats";
import InfoRow from "./ui/InfoRow";

const previewStats = {
  maxHp: "Max health", maxMp: "Max mana", maxStamina: "Max stamina",
  hpRegen: "Health regen", staminaRegen: "Stamina regen",
};

export default function UpgradeCard({ upgrade, gameState, onPurchaseUpgrade }) {
  const costId = useId();
  const level = getUpgradeLevel(gameState, upgrade.id);
  const maxed = isUpgradeMaxed(gameState, upgrade);
  const cost = getNextUpgradeCost(gameState, upgrade);
  const blocked = getUpgradeBlockReason(gameState, upgrade);
  const locked = upgrade.requiredSystem && !gameState.unlocks?.systems?.[upgrade.requiredSystem];
  const preview = getUpgradePreview(gameState, upgrade);
  const capped = !maxed && upgrade.combatBonuses && preview.every((row) => row.next <= row.current);

  return (
    <article className="upgrade-card">
      <div className="upgrade-card-header">
        <h4>{upgrade.label}</h4>
        <span>Level {level} / {upgrade.maxLevel}</span>
      </div>
      <div className="upgrade-copy">
        <p>{upgrade.description}</p>
        <p className="upgrade-usage">{upgrade.usage}</p>
        {upgrade.flavorText && <p className="upgrade-flavor">{upgrade.flavorText}</p>}
      </div>
      <div className="upgrade-preview">
        <span className="upgrade-cost-label">{maxed ? "Current total" : "Current → next rank"}</span>
        {preview.map(({ stat, current, next }) => {
          const format = (value) => previewStats[stat]
            ? `${formatRegenValue(value)}${stat.endsWith("Regen") ? "/s" : ""}`
            : formatDerivedCombatStatValue(stat, value);
          return <InfoRow key={stat} label={previewStats[stat] || formatDerivedCombatStatLabel(stat)}
            value={maxed ? format(current) : `${format(current)} → ${format(next)}`} />;
        })}
      </div>
      <div className="upgrade-costs" id={costId}>
        {!maxed && cost && (Object.keys(cost).length ? <>
          <span className="upgrade-cost-label">Cost · owned / required</span>
          {Object.entries(cost).map(([resourceId, amount]) => {
            const resource = gameState.resources[resourceId];
            const owned = resource?.amount ?? 0;
            return <div className="upgrade-cost-row" key={resourceId} data-missing={owned < amount}>
              <span>{resource?.label || resourceId}</span>
              <strong>{owned} / {amount}{owned < amount ? ` · need ${amount - owned} more` : ""}</strong>
            </div>;
          })}
        </> : <p>Free</p>)}
        <p className="upgrade-status">{blocked || "Ready to upgrade"}</p>
      </div>
      <button type="button" disabled={Boolean(blocked)} aria-describedby={costId}
        aria-label={`Upgrade ${upgrade.label}`} onClick={() => onPurchaseUpgrade(upgrade)}>
        {maxed ? "Max level" : locked ? "Locked" : capped ? "At stat cap" : "Upgrade"}
      </button>
    </article>
  );
}
