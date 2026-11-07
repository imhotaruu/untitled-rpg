import { formatDerivedCombatStatValue } from "../../engine/derivedStats";
import { formatDerivedCombatStatLabel } from "../../utils/formatters";

export default function EquipmentBonusText({ item }) {
  const bonuses = Object.entries(item.equipmentBonuses || {}).map(([statId, amount]) => (
    `${amount >= 0 ? "+" : ""}${formatDerivedCombatStatValue(statId, amount)} ${formatDerivedCombatStatLabel(statId)}`
  ));

  return bonuses.length > 0
    ? <p className="empty-note">Bonuses: {bonuses.join(", ")}</p>
    : null;
}
