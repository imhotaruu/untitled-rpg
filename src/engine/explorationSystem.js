import { explorationActionIds, explorationEncounters, explorationEncounterRates } from "../data/explorationEncounters";
import { addResources } from "./resourceSystem";

const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const definitionFor = (id) => explorationEncounters.find((entry) => entry.id === id);

export function normalizeExploration(value, areaId, inCombat = false) {
  const sequence = count(value?.sequence);
  const candidate = value?.pending;
  const definition = definitionFor(candidate?.id);
  const valid = !inCombat && definition?.areas.includes(areaId) && candidate.areaId === areaId
    && Number.isSafeInteger(candidate.token) && candidate.token > 0 && candidate.token === sequence;
  return {
    sequence,
    cooldown: Math.min(count(value?.cooldown), explorationEncounterRates.quietExplorations),
    resolved: count(value?.resolved),
    discovered: explorationEncounters.filter((entry) => Array.isArray(value?.discovered) && value.discovered.includes(entry.id)).map((entry) => entry.id),
    pending: valid ? { id: definition.id, areaId, token: candidate.token } : null,
  };
}

export function getPendingExploration(state) {
  const pending = state.exploration?.pending;
  const definition = definitionFor(pending?.id);
  return definition && pending.areaId === state.player.area && !state.combat ? { ...definition, token: pending.token } : null;
}

// Called only after a successful action. Randomness is supplied by the event handler, not the engine.
export function beginExplorationEncounter(state, action, roll) {
  if (!explorationActionIds.includes(action.id) || !Number.isFinite(roll) || roll < 0 || roll >= 1) return;
  const progress = normalizeExploration(state.exploration, state.player.area, Boolean(state.combat));
  state.exploration = progress;
  if (progress.pending || state.combat) return;
  if (progress.cooldown > 0) { progress.cooldown -= 1; return; }
  const rarity = progress.sequence === 0 ? "common" : roll < explorationEncounterRates.rare ? "rare"
    : roll < explorationEncounterRates.rare + explorationEncounterRates.common ? "common" : null;
  const definition = explorationEncounters.find((entry) => entry.rarity === rarity && entry.areas.includes(state.player.area));
  if (!definition) return;
  progress.sequence += 1;
  progress.pending = { id: definition.id, areaId: state.player.area, token: progress.sequence };
  if (!progress.discovered.includes(definition.id)) progress.discovered.push(definition.id);
  state.player.isResting = false;
  state.storyLog = [definition.text, ...state.storyLog].slice(0, 50);
  state.actionLog = [{ type: "story", message: `${rarity === "rare" ? "Rare encounter" : "Encounter"}: ${definition.title}.` }, ...state.actionLog].slice(0, 50);
}

export function resolveExplorationEncounter(state, token, choiceId) {
  const encounter = getPendingExploration(state);
  if (!encounter || token !== encounter.token) return state;
  const choice = encounter.choices.find((entry) => entry.id === choiceId);
  if (!choice) return state;
  const next = structuredClone(state);
  addResources(next.resources, choice.rewards);
  next.exploration.pending = null;
  next.exploration.resolved += 1;
  next.exploration.cooldown = explorationEncounterRates.quietExplorations;
  const milestone = "first_exploration_encounter";
  if (!next.completedStoryEvents.includes(milestone)) next.completedStoryEvents.push(milestone);
  if (encounter.rarity === "rare" && !next.completedStoryEvents.includes("first_rare_encounter")) next.completedStoryEvents.push("first_rare_encounter");
  next.storyLog = [choice.text, ...next.storyLog].slice(0, 50);
  const rewards = Object.entries(choice.rewards || {}).map(([id, amount]) => `+${amount} ${next.resources[id].label}`);
  next.actionLog = [{ type: "story", message: `${encounter.title}: ${choice.label}.${rewards.length ? ` ${rewards.join(", ")}.` : ""}` }, ...next.actionLog].slice(0, 50);
  return next;
}
