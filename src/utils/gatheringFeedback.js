import { gatheringMasteries } from "../data/gatheringMasteries";
import { getGatheringProgress, getGatheringBonus, hasGatheringMastery, getGatheringResourceIds, getActionResourceRewards } from "../engine/gatheringSystem";

export const masteryDiscoveryMessage = "You feel as if you will do this a lot of times, you'll get better at this.";

export function createGatheringFeedback(before, after, action = {}) {
  const discovered = gatheringMasteries.filter(({ resourceId }) =>
    !getGatheringProgress(before, resourceId).started && getGatheringProgress(after, resourceId).started);
  const gained = gatheringMasteries.filter(({ resourceId }) =>
    getGatheringProgress(after, resourceId).level > getGatheringProgress(before, resourceId).level);
  const normalRewards = getActionResourceRewards(before, action);
  const critical = getGatheringResourceIds(action).filter((id) =>
    after.resources[id]?.amount - before.resources[id]?.amount > normalRewards[id]);
  if (!discovered.length && !gained.length && !critical.length) return null;
  const messages = [];
  if (!hasGatheringMastery(before) && hasGatheringMastery(after)) {
    messages.push(masteryDiscoveryMessage, "Unlocked Character → Mastery.");
  }
  for (const { resourceId, label } of discovered) {
    const progress = getGatheringProgress(after, resourceId);
    messages.push(`${label}: ${progress.xp} / ${progress.xpRequired} XP toward Level ${progress.level + 1}.`);
  }
  for (const { resourceId, label } of gained) {
    messages.push(`${label}: Level ${getGatheringProgress(after, resourceId).level} · +${getGatheringBonus(after, resourceId)} ${after.resources[resourceId].label} per gather.`);
  }
  if (gained.length) messages.push("The new bonus applies from your next gather.");
  for (const id of critical) {
    const amount = after.resources[id].amount - before.resources[id].amount;
    messages.push(`Critical gather! +${amount} ${after.resources[id].label} (×2 yield).`);
  }
  return {
    tone: "success", title: discovered.length ? "Mastery Discovered" : gained.length ? "Mastery Increased" : "Critical Gather",
    itemLabel: discovered.length + gained.length === 1 ? (discovered[0] || gained[0]).label : "Gathering",
    messages, duration: discovered.length ? 10000 : 7000,
  };
}
