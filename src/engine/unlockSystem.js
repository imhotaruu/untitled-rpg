import { hasTrainedWithGarron, villagePeople } from "../data/relationships";
import { getQuestStatus } from "./questSystem";
import { processLocationUnlocks } from "./locationSystem";

export const unlockRules = [
  {
    id: "unlock_rowan_crafting_lesson", type: "action", targetId: "begin_rowan_crafting",
    condition: (state) => getQuestStatus(state, "rowan_first_craft") === "available",
    log: { type: "unlock", message: "Rowan has a crafting lesson for you at Village Square." },
  },
  {
    id: "unlock_rowan_crafting_turn_in", type: "action", targetId: "complete_rowan_crafting",
    condition: (state) => getQuestStatus(state, "rowan_first_craft") === "ready",
    log: { type: "unlock", message: "Your first sword is ready. Show your work to Rowan at Village Square." },
  },
  {
    id: "unlock_carpenter_introduction",
    type: "action",
    targetId: "meet_rowan",
    condition: hasTrainedWithGarron,
    log: { type: "unlock", message: `Garron mentions ${villagePeople.rowan.name}, the carpenter who makes his practice swords. You can meet them at Village Square. Your connections are recorded in Relationships.` },
  },
  {
    id: "unlock_garron_spar",
    type: "action",
    targetId: "spar_with_garron",
    condition: (state) => Boolean(state.unlocks?.systems?.basic_guard),
    log: { type: "unlock", message: "Garron is ready to spar with you at Stonefield House." },
  },
  {
    id: "unlock_training_armor",
    type: "action",
    targetId: "collect_training_armor",
    condition: (state) => Boolean(state.unlocks?.systems?.basic_guard),
    log: { type: "unlock", message: "Garron has training armor for you. Collect it at Stonefield House." },
  },
  {
    id: "unlock_forage_carefully",
    type: "action",
    targetId: "forage_carefully",
    condition: (state) => state.resources.herbs.discovered,
    log: "New action unlocked: Forage Carefully.",
  },
];

function addLog(logList, message) {
  return [message, ...logList].slice(0, 50);
}

export function processUnlocks(state) {
  processLocationUnlocks(state);
  unlockRules.forEach((rule) => {
    if (state.unlocks.completedRules.includes(rule.id)) return;
    if (!rule.condition(state)) return;

    if (rule.type === "area") {
      state.unlocks.areas[rule.targetId] = true;
    }

    if (rule.type === "action") {
      state.unlocks.actions[rule.targetId] = true;
    }

    state.unlocks.completedRules.push(rule.id);

    if (rule.log) {
      state.actionLog = addLog(state.actionLog, rule.log);
    }
  });

  return state;
}
