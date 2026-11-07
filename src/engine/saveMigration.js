import { createGameState } from "./createGameState";
import { processUnlocks } from "./unlockSystem";
import { normalizeCombat } from "./combatSystem";
import { normalizeGatheringMastery } from "./gatheringSystem";
import { firstGatheringMasteryEvent } from "../data/storyEvents";
import { processStoryEvents } from "./storySystem";
import { normalizeExploration } from "./explorationSystem";
import { normalizeCrafting } from "./craftingSystem";
import { normalizeNarrative } from "./prologueSystem";
import { normalizeConversation } from "./conversationSystem";
import { normalizeJournal } from "./journalSystem";
import { normalizeLocationUnlocks } from "./locationSystem";

export const CURRENT_SAVE_VERSION = 18;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  if (value === undefined) return undefined;

  return JSON.parse(JSON.stringify(value));
}

function mergeWithDefaults(defaultValue, savedValue) {
  if (savedValue === undefined || savedValue === null) {
    return clone(defaultValue);
  }

  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue) ? clone(savedValue) : clone(defaultValue);
  }

  if (isPlainObject(defaultValue)) {
    const merged = {};
    const savedObject = isPlainObject(savedValue) ? savedValue : {};

    const keys = new Set([
      ...Object.keys(defaultValue),
      ...Object.keys(savedObject),
    ]);

    keys.forEach((key) => {
      merged[key] = mergeWithDefaults(defaultValue[key], savedObject[key]);
    });

    return merged;
  }

  return savedValue;
}

function normalizePlayer(player) {
  player.hp = Math.min(player.hp, player.maxHp);
  player.mp = Math.min(player.mp, player.maxMp);
  player.stamina = Math.min(player.stamina, player.maxStamina);

  player.hp = Math.max(0, player.hp);
  player.mp = Math.max(0, player.mp);
  player.stamina = Math.max(0, player.stamina);

  player.attributes = normalizeAttributes(player.attributes);

  return player;
}

function normalizeAttributes(attributes) {
  const defaultAttributes = createGameState().player.attributes;
  const normalizedAttributes = isPlainObject(attributes) ? attributes : {};

  return Object.keys(defaultAttributes).reduce((nextAttributes, attribute) => {
    const value = Number(normalizedAttributes[attribute]);

    nextAttributes[attribute] =
      Number.isFinite(value) && value >= 0
        ? Math.floor(value)
        : defaultAttributes[attribute];

    return nextAttributes;
  }, {});
}

export function migrateSaveState(savedState) {
  const defaultState = createGameState();

  if (!isPlainObject(savedState)) {
    return defaultState;
  }

  const migratedState = mergeWithDefaults(defaultState, savedState);

  migratedState.player = normalizePlayer(migratedState.player);
  migratedState.narrative = normalizeNarrative(savedState.narrative);
  // A real adventure/combat takes precedence over a malformed prologue marker.
  if (savedState.combat || savedState.exploration?.pending || savedState.progress?.totalActions > 0) {
    migratedState.narrative = normalizeNarrative(null);
  }
  migratedState.crafting = normalizeCrafting(migratedState.crafting);
  migratedState.gatheringMastery = normalizeGatheringMastery(migratedState.gatheringMastery);
  migratedState.combat = normalizeCombat(migratedState.combat, migratedState.player.area);
  migratedState.exploration = normalizeExploration(migratedState.exploration, migratedState.player.area, Boolean(migratedState.combat));
  migratedState.conversation = normalizeConversation(savedState.conversation, migratedState);
  migratedState.journal = normalizeJournal(savedState.journal, migratedState, savedState.journal == null);
  normalizeLocationUnlocks(migratedState);
  if (migratedState.conversation) migratedState.player.isResting = false;
  if (migratedState.exploration.pending) migratedState.player.isResting = false;
  if (migratedState.combat) migratedState.player.isResting = false;

  // New rewards become claimable in eligible older saves; no items are granted on load.
  processUnlocks(migratedState);
  // Catch up saves from before this story beat, using its normal once-only record.
  processStoryEvents(migratedState, [firstGatheringMasteryEvent]);

  return migratedState;
}

export function migrateSaveRecord(saveRecord) {
  if (!isPlainObject(saveRecord)) {
    return null;
  }

  const savedState = saveRecord.state || saveRecord;

  return migrateSaveState(savedState);
}
