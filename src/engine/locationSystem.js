import { areas } from "../data/areas";
import { getQuestStatus } from "./questSystem";

// Knowledge and access have separate requirements. Unknown requirements fail
// closed; a location without an access requirement is open once discovered.
export function meetsLocationRequirement(state, requirement) {
  if (!requirement || typeof requirement !== "object") return false;
  switch (requirement.type) {
    case "all": return Array.isArray(requirement.conditions) && requirement.conditions.length > 0
      && requirement.conditions.every((condition) => meetsLocationRequirement(state, condition));
    case "any": return Array.isArray(requirement.conditions)
      && requirement.conditions.some((condition) => meetsLocationRequirement(state, condition));
    case "action": return Number.isSafeInteger(requirement.count) && requirement.count > 0
      && Number.isSafeInteger(state.progress?.actionCounts?.[requirement.id])
      && state.progress.actionCounts[requirement.id] >= requirement.count;
    case "conversation": return Boolean(state.journal?.entries?.some((entry) => entry.id === `note:${requirement.noteId}`));
    case "story": return Boolean(state.completedStoryEvents?.includes(requirement.id));
    case "quest": return ["available", "active", "ready", "completed"].includes(requirement.status)
      && getQuestStatus(state, requirement.id) === requirement.status;
    default: return false;
  }
}

function travelBlock(state) {
  if (state.narrative?.phase === "prologue") return "Travel begins in Chapter 1.";
  if (state.combat) return "Finish the battle before traveling.";
  if (state.conversation) return "Finish the conversation before traveling.";
  if (state.exploration?.pending) return "Choose an encounter response before traveling.";
  return null;
}

export function getLocationState(state, areaId) {
  const area = areas.find((entry) => entry.id === areaId);
  if (!area) return { knowledge: "unknown", canTravel: false, reason: "Unknown location." };
  const discovered = area.discovered !== false || state.unlocks?.areas?.[area.id] === true;
  const heard = state.unlocks?.heardAreas?.[area.id] === true;
  const knowledge = discovered ? "discovered" : heard ? "heard" : "unknown";
  const routeReason = discovered ? null : heard
    ? area.progression?.heardHint || "You have heard of this place, but haven't found the way yet."
    : "You haven't discovered this location.";
  const accessReason = discovered && area.progression?.accessWhen
    && !meetsLocationRequirement(state, area.progression.accessWhen)
    ? area.progression.accessHint || "The way is not open yet." : null;
  const reason = routeReason || accessReason || travelBlock(state);
  return { knowledge, canTravel: !reason, reason };
}

export function getKnownLocationGroups(state) {
  if (state.narrative?.phase === "prologue") return [];
  const groups = new Map();
  for (const area of areas) {
    const location = getLocationState(state, area.id);
    if (location.knowledge === "unknown") continue;
    if (!groups.has(area.category)) groups.set(area.category, []);
    groups.get(area.category).push({ ...area, ...location });
  }
  return [...groups].map(([category, entries]) => ({ category, areas: entries }));
}

// Mutates an owned next-state. Discoveries persist after their requirements
// change, while travel availability is always checked against current state.
export function processLocationUnlocks(state, { silent = false } = {}) {
  if (state.narrative?.phase === "prologue") return state;
  state.unlocks.heardAreas ||= {};
  for (const area of areas) {
    const progression = area.progression;
    if (!progression) continue;
    if (meetsLocationRequirement(state, progression.heardWhen)) state.unlocks.heardAreas[area.id] = true;
    if (!meetsLocationRequirement(state, progression.discoverWhen)) continue;
    const wasDiscovered = state.unlocks.areas[area.id] === true;
    state.unlocks.areas[area.id] = true;
    if (progression.discoveryRuleId && !state.unlocks.completedRules.includes(progression.discoveryRuleId)) {
      state.unlocks.completedRules.push(progression.discoveryRuleId);
    }
    if (!wasDiscovered && !silent) {
      state.actionLog = [`Route discovered: ${area.label}.`, ...state.actionLog].slice(0, 50);
    }
  }
  return state;
}

// Preserve established routes in older saves, including visits recorded before
// route flags existed. Unknown IDs and non-boolean flags are discarded.
export function normalizeLocationUnlocks(state) {
  const adventure = state.narrative?.phase !== "prologue";
  const discovered = {};
  const heard = {};
  for (const area of areas) {
    const visits = state.progress?.areaVisits?.[area.id];
    if (area.discovered !== false || (adventure && (
      state.unlocks.areas?.[area.id] === true || state.player.area === area.id
      || (Number.isSafeInteger(visits) && visits > 0)
      || (area.progression?.discoveryRuleId && state.unlocks.completedRules.includes(area.progression.discoveryRuleId))
    ))) discovered[area.id] = true;
    if (adventure && state.unlocks.heardAreas?.[area.id] === true) heard[area.id] = true;
  }
  state.unlocks.areas = discovered;
  state.unlocks.heardAreas = heard;
  if (!areas.some((area) => area.id === state.player.area)) state.player.area = "stonefield_house";
  return processLocationUnlocks(state, { silent: true });
}
