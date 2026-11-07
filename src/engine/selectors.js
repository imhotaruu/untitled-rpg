import { milestones } from "../data/milestones";

export function getCompletedMilestones(state) {
  return milestones.filter((milestone) =>
    (milestone.completedActionId && state.unlocks?.completedActions?.[milestone.completedActionId])
    || (milestone.completedStoryEventId && state.completedStoryEvents?.includes(milestone.completedStoryEventId))
    || (milestone.completedRuleId && state.unlocks?.completedRules?.includes(milestone.completedRuleId))
  );
}

export function getDiscoveredResources(resources) {
  return Object.entries(resources).filter(
    ([resourceId, resource]) => resourceId !== "gold" && resource.discovered
  );
}

export function getDiscoveredAreas(areas, unlocks) {
  return areas.filter((area) => {
    if (area.discovered !== false) return true;

    return Boolean(unlocks?.areas?.[area.id]);
  });
}

export function getDiscoveredAreaGroups(areas, unlocks) {
  const discoveredAreas = getDiscoveredAreas(areas, unlocks);
  const groups = {};

  discoveredAreas.forEach((area) => {
    const category = area.category || "Other";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(area);
  });

  return Object.entries(groups).map(([category, areas]) => ({
    category,
    areas,
  }));
}

function isActionUnlocked(action, unlocks) {
  return action.unlocked !== false || Boolean(unlocks?.actions?.[action.id]);
}

function isOneTimeActionCompleted(action, unlocks) {
  if (!action.oneTime) {
    return false;
  }

  const completionId = action.completionId || action.id;

  return Boolean(unlocks?.completedActions?.[completionId]);
}

export function getAvailableActions(actions, currentAreaId, unlocks) {
  return actions.filter((action) => !getActionUnavailableReason(action, currentAreaId, unlocks));
}

export function getActionUnavailableReason(action, currentAreaId, unlocks) {
  if (action.area !== currentAreaId) return "This action is not available in this area.";
  if (!isActionUnlocked(action, unlocks)) return "This action is not unlocked yet.";
  if (isOneTimeActionCompleted(action, unlocks)) return "This action has already been completed.";
  return null;
}

export function getAreaById(areas, areaId) {
  return areas.find((area) => area.id === areaId) || null;
}

export function getAreaLabel(areas, areaId) {
  const area = getAreaById(areas, areaId);

  return area ? area.label : "Unknown Area";
}
