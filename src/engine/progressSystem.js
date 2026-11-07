export function recordActionProgress(progress, action) {
  progress.totalActions += 1;

  progress.actionCounts[action.id] =
    (progress.actionCounts[action.id] || 0) + 1;
}

export function recordAreaVisit(progress, area) {
  progress.areaVisits[area.id] =
    (progress.areaVisits[area.id] || 0) + 1;
}

export function getActionCount(progress, actionId) {
  return progress.actionCounts[actionId] || 0;
}

export function getAreaVisitCount(progress, areaId) {
  return progress.areaVisits[areaId] || 0;
}