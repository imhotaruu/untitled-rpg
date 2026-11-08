import { storyTimeline } from "../data/storyTimeline";

function isRevealed(state, moment) {
  if (moment.id === "prologue" || moment.id === "chapter_one_opening") return true;
  // Rewards and flags settle before dialogue. Never show its recap early,
  // including after loading a save made partway through that conversation.
  if (state.conversation?.passageIds?.includes(moment.passageId)) return false;
  if (moment.noteId && state.journal?.entries?.some((entry) => entry.id === `note:${moment.noteId}`)) return true;
  if (moment.actionId) return state.unlocks?.completedActions?.[moment.actionId] === true
    || state.progress?.actionCounts?.[moment.actionId] > 0;
  if (moment.ruleId) return Boolean(state.unlocks?.completedRules?.includes(moment.ruleId));
  if (moment.discoveredAreaId) return state.unlocks?.areas?.[moment.discoveredAreaId] === true;
  if (moment.storyEventId) return Boolean(state.completedStoryEvents?.includes(moment.storyEventId))
    || state.progress?.areaVisits?.[moment.visitedAreaId] > 0;
  return false;
}

// Pure projection of existing durable records. No rewards, log reads, writes,
// timestamps, new save fields, or achievement completion totals.
export function getStoryTimeline(state) {
  if (!state || state.narrative?.phase === "prologue") return [];
  return storyTimeline.filter((moment) => isRevealed(state, moment));
}
