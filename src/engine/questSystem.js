import { quests } from "../data/quests";

export function getQuestStatus(state, questId) {
  const quest = quests.find((entry) => entry.id === questId);
  if (!quest) return "locked";
  const completed = state.unlocks?.completedActions || {};
  if (completed[quest.completionActionId]) return "completed";
  if (completed[quest.startActionId]) return state.crafting?.crafted?.[quest.recipeId] > 0 ? "ready" : "active";
  return completed[quest.prerequisiteActionId] ? "available" : "locked";
}

export function isCraftingUnlocked(state) {
  return Boolean(state.unlocks?.completedActions?.begin_rowan_crafting);
}
