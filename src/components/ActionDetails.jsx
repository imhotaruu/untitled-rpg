import { items } from "../data/items";
import { formatStatLabel } from "../utils/formatters";
import { getActionResourceRewards, getGatheringBonus, getGatheringResourceIds, getGatheringProgress } from "../engine/gatheringSystem";
import { gatheringMasteries } from "../data/gatheringMasteries";

function ActionDetails({ action, resources, id, gatheringMastery }) {
  if (!action) {
    return (
      <div className="action-details" id={id}>
        <p>No action selected.</p>
      </div>
    );
  }

  const { statCost, resourceCost } = getActionCostDetails(action);
  const rewards = getActionResourceRewards({ gatheringMastery }, action);
  const gatheringIds = getGatheringResourceIds(action);
  const restore = action.restore || {};
  const itemRewards = action.itemRewards || [];
  const progressRewards = action.progressRewards || {};

  const hasStatCost = Object.keys(statCost).length > 0;
  const hasResourceCost = Object.keys(resourceCost).length > 0;
  const hasRewards = Object.keys(rewards).length > 0;
  const hasRestore = Object.keys(restore).length > 0;
  const hasItemRewards = itemRewards.length > 0;
  const hasProgressRewards = Object.keys(progressRewards).length > 0;

  return (
    <div className="action-details" id={id}>
      {(action.description || action.log) && (
        <p>{action.description || action.log}</p>
      )}

      {action.startsResting && (
        <p>Effect: Recover health and stamina over time.</p>
      )}

      {hasStatCost && (
        <p>
          Cost:{" "}
          {Object.entries(statCost)
            .map(([stat, amount]) => `${amount} ${formatStatLabel(stat)}`)
            .join(", ")}
        </p>
      )}

      {hasResourceCost && (
        <p>
          Requires:{" "}
          {Object.entries(resourceCost)
            .map(([resourceId, amount]) => {
              const label = resources[resourceId]?.label || resourceId;
              return `${amount} ${label}`;
            })
            .join(", ")}
        </p>
      )}

      {hasRewards && (
        <p>
          Rewards:{" "}
          {Object.entries(rewards)
            .map(([resourceId, amount]) => {
              const label = resources[resourceId]?.label || resourceId;
              const bonus = gatheringIds.includes(resourceId) ? getGatheringBonus({ gatheringMastery }, resourceId) : 0;
              return `+${amount} ${label}${bonus ? ` (includes +${bonus} mastery)` : ""}`;
            })
            .join(", ")}
        </p>
      )}

      {gatheringIds.map((resourceId) => {
        const mastery = gatheringMasteries.find((entry) => entry.resourceId === resourceId);
        const { maxed } = getGatheringProgress({ gatheringMastery }, resourceId);
        return <p key={resourceId}>{mastery.label}: {maxed ? "Max level" : `+${mastery.xpPerGather} XP`} · {mastery.criticalChance * 100}% chance for ×{mastery.criticalMultiplier} yield.</p>;
      })}

      {hasItemRewards && (
        <p>
          Items:{" "}
          {itemRewards
            .map((reward) => {
              const itemId = reward.itemId || reward.id;
              const item = items.find((entry) => entry.id === itemId);
              const label = item?.label || itemId;
              const quantity = reward.quantity ?? 1;

              return `+${quantity} ${label}`;
            })
            .join(", ")}
        </p>
      )}

      {hasProgressRewards && (
        <p>
          Progress:{" "}
          {Object.entries(progressRewards)
            .map(([progressKey, amount]) => {
              const sign = amount >= 0 ? "+" : "";
              return `${sign}${amount} ${formatProgressLabel(progressKey)}`;
            })
            .join(", ")}
        </p>
      )}

      {hasRestore && (
        <p>
          Restores:{" "}
          {Object.entries(restore)
            .map(([stat, amount]) => `+${amount} ${formatStatLabel(stat)}`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}

function getActionCostDetails(action) {
  const cost = action.cost || {};

  if (cost.stats || cost.resources) {
    return {
      statCost: cost.stats || {},
      resourceCost: cost.resources || {},
    };
  }

  return {
    statCost: cost,
    resourceCost: {},
  };
}

function formatProgressLabel(progressKey) {
  const progressLabels = {
    combatTraining: "Combat Training",
  };

  if (progressLabels[progressKey]) {
    return progressLabels[progressKey];
  }

  return progressKey
    .split("_")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default ActionDetails;
