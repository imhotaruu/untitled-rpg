import { items } from "../data/items";
import {
  formatDerivedCombatStatValue,
  getDerivedCombatStats,
} from "../engine/derivedStats";
import { formatDerivedCombatStatLabel, formatStatLabel } from "./formatters";

function getQuantity(state, itemId) {
  const entry = state.inventory?.items?.find(
    (entry) => (entry.itemId || entry.id) === itemId
  );
  return entry ? (entry.quantity ?? 1) : 0;
}

function formatAmount(amount) {
  return String(Math.round(amount * 1000) / 1000);
}

// Compare only the states immediately around one engine operation, excluding ticks.
export function createItemFeedback(before, after, { type, itemId, slotId }) {
  const resolvedItemId = type === "unequip"
    ? before.equipment?.[slotId]
    : itemId;
  const item = items.find((item) => item.id === resolvedItemId);
  const itemLabel = item?.label || resolvedItemId || "Equipment";
  const consumed = getQuantity(before, resolvedItemId) - getQuantity(after, resolvedItemId);
  const equipped = type === "equip" && Object.entries(after.equipment || {}).some(
    ([slot, id]) => id === resolvedItemId && before.equipment?.[slot] !== id
  );
  const unequipped = type === "unequip" && resolvedItemId && !after.equipment?.[slotId];

  if (type === "use" && consumed > 0) {
    const messages = Object.keys(item?.useEffects?.restore || {}).flatMap((stat) => {
      const restored = after.player[stat] - before.player[stat];
      return restored > 0
        ? [`+${formatAmount(restored)} ${formatStatLabel(stat)} restored`]
        : [];
    });
    return {
      tone: "success",
      title: "Item Used",
      itemLabel,
      messages: [...messages, `−${consumed} ${itemLabel} consumed`],
    };
  }

  if (equipped || unequipped) {
    const previousStats = getDerivedCombatStats(before.player, before);
    const nextStats = getDerivedCombatStats(after.player, after);
    const messages = Object.entries(nextStats).flatMap(([stat, value]) => {
      const difference = value - previousStats[stat];
      if (!difference) return [];
      const amount = formatDerivedCombatStatValue(stat, formatAmount(Math.abs(difference)));
      return [`${difference > 0 ? "+" : "−"}${amount} ${formatDerivedCombatStatLabel(stat)}`];
    });
    return {
      tone: "success",
      title: equipped ? "Equipped" : "Unequipped",
      itemLabel,
      messages: messages.length ? messages : ["Combat stats unchanged."],
    };
  }

  const log = after.actionLog[0];
  return {
    tone: "info",
    title: "No Change",
    itemLabel,
    messages: [
      typeof log === "string" ? log : log?.message || "No change was made.",
      ...(type === "use" ? ["Item was not consumed."] : []),
    ],
  };
}
