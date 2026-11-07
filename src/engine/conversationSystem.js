import { actions } from "../data/actions";
import { conversations } from "../data/conversations";
import { villagePeople } from "../data/relationships";
import { performAction } from "./actionSystem";
import { getPrependedStoryCount } from "../utils/storyHistory";
import { recordConversationNotes } from "./journalSystem";

function selectPassages(before, after, actionId) {
  const firstUse = !before.progress.actionCounts[actionId];
  switch (actionId) {
    case "train_with_garron": return ["garron_training"];
    case "practice_with_garron": return [
      ...(firstUse ? ["garron_practice"] : []),
      ...(!before.unlocks.systems.basic_guard && after.unlocks.systems.basic_guard ? ["garron_guard"] : []),
    ];
    case "collect_training_armor": return ["garron_armor"];
    case "visit_healer": return [...(firstUse ? ["elira_visit"] : []), after.player.hp > before.player.hp ? "elira_care" : "elira_well"];
    case "meet_rowan": return ["rowan_meeting"];
    case "bring_rowan_wood": return ["rowan_wood"];
    case "begin_rowan_crafting": return ["rowan_lesson"];
    case "complete_rowan_crafting": return ["rowan_finished"];
    default: return [];
  }
}

// Apply the existing action exactly once. Only its presentation is deferred:
// costs/rewards/progression are already settled when the conversation opens.
export function performConversationAction(state, requestedAction, options = {}) {
  if (state.conversation) return state;
  const action = actions.find((entry) => entry.id === requestedAction?.id);
  if (!action) return state;
  const after = performAction(state, action, options);
  if ((after.progress.actionCounts[action.id] || 0) !== (state.progress.actionCounts[action.id] || 0) + 1) return after;
  const passageIds = selectPassages(state, after, action.id);
  if (!passageIds.length) return after;
  const added = getPrependedStoryCount(state.storyLog, after.storyLog);
  return { ...after, storyLog: state.storyLog, conversation: {
    actionId: action.id, areaId: state.player.area, token: after.progress.totalActions,
    passageIds, storyEntries: after.storyLog.slice(0, added ?? after.storyLog.length),
  } };
}

export function normalizeConversation(value, state) {
  if (!value || state.narrative?.phase === "prologue" || state.combat || state.exploration?.pending) return null;
  const action = actions.find((entry) => entry.id === value.actionId);
  if (!action || value.areaId !== action.area || value.areaId !== state.player.area
    || !Number.isSafeInteger(value.token) || value.token < 1 || value.token !== state.progress.totalActions
    || !(state.progress.actionCounts[action.id] > 0)
    || (action.oneTime && !state.unlocks.completedActions[action.completionId || action.id])) return null;
  if (!Array.isArray(value.passageIds) || !value.passageIds.length || value.passageIds.length > 2
    || new Set(value.passageIds).size !== value.passageIds.length
    || !value.passageIds.every((id) => Object.hasOwn(conversations, id) && conversations[id].actionId === action.id)) return null;
  if (!Array.isArray(value.storyEntries) || value.storyEntries.length > 50
    || !value.storyEntries.every((text) => typeof text === "string")) return null;
  return { actionId: action.id, areaId: value.areaId, token: value.token,
    passageIds: [...value.passageIds], storyEntries: [...value.storyEntries] };
}

export function getPendingConversation(state) {
  const pending = normalizeConversation(state.conversation, state);
  if (!pending) return null;
  const person = villagePeople[conversations[pending.passageIds[0]].personId];
  const beats = pending.passageIds.flatMap((id) => conversations[id].beats).map((beat) => ({
    ...beat, speaker: beat.speaker === "player" ? state.player.name : beat.speaker,
  }));
  const action = actions.find((entry) => entry.id === pending.actionId);
  const storySummaries = [action.story, action.storyOnFirstUse, ...(action.progressMilestones || []).map((entry) => entry.story)].filter(Boolean);
  return { ...pending, person, beats, storySummaries };
}

export function finishConversation(state, token) {
  const pending = normalizeConversation(state.conversation, state);
  if (!pending || pending.token !== token) return state;
  const next = { ...state, journal: structuredClone(state.journal || { entries: [] }),
    conversation: null, storyLog: [...pending.storyEntries, ...state.storyLog].slice(0, 50) };
  recordConversationNotes(next, pending.passageIds);
  return next;
}
