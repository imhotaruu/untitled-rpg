import { hasTrainedWithGarron, hasMetRowan } from "../data/relationships";
import { quests } from "../data/quests";
import { getQuestStatus, isCraftingUnlocked } from "./questSystem";

const pages = [
  { id: "main", label: "Main" },
  { id: "character", label: "Character" },
  { id: "story", label: "Story" },
  { id: "relationships", label: "Relationships" },
  { id: "quests", label: "Quests" },
  { id: "crafting", label: "Crafting" },
];

// Derive access from existing progress, so old saves need no new unlock flags.
export function getAvailablePages(state) {
  const crafting = isCraftingUnlocked(state);
  const knownQuest = quests.some((quest) => getQuestStatus(state, quest.id) !== "locked");
  const familyInteraction = hasTrainedWithGarron(state)
    || (state.progress?.actionCounts?.train_with_garron || 0) > 0
    || (state.progress?.actionCounts?.visit_healer || 0) > 0;
  const unlocked = new Set(["main", "character", "story"]);
  if (familyInteraction || hasMetRowan(state) || knownQuest || crafting) unlocked.add("relationships");
  if (knownQuest) unlocked.add("quests");
  if (crafting) unlocked.add("crafting");
  return pages.filter((page) => unlocked.has(page.id));
}
