import { createGameState } from "./createGameState";
import {
  CURRENT_SAVE_VERSION,
  migrateSaveRecord,
} from "./saveMigration";

export const SAVE_SLOT_COUNT = 10;

const SAVE_KEY_PREFIX = "new-untitled-game-save-slot";
const LAST_USED_SLOT_KEY = "new-untitled-game-last-used-slot";

function getSlotKey(slotId) {
  return `${SAVE_KEY_PREFIX}-${slotId}`;
}

function createSaveRecord(state) {
  return {
    version: CURRENT_SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
}

function safelyParseSave(rawSave) {
  try {
    return JSON.parse(rawSave);
  } catch (error) {
    console.error("Could not parse save file:", error);
    return null;
  }
}

function mergeObjectDefaults(defaultValue, savedValue) {
  return {
    ...defaultValue,
    ...(savedValue || {}),
  };
}

function normalizeGameState(state) {
  if (!state) {
    return null;
  }

  const defaultState = createGameState();

  return {
    ...defaultState,
    ...state,

    player: mergeObjectDefaults(defaultState.player, state.player),
    resources: mergeObjectDefaults(defaultState.resources, state.resources),

    inventory: {
      ...defaultState.inventory,
      ...(state.inventory || {}),
      items: state.inventory?.items || defaultState.inventory.items,
    },

    equipment: mergeObjectDefaults(defaultState.equipment, state.equipment),

    flags: mergeObjectDefaults(defaultState.flags, state.flags),
    completedStoryEvents:
      state.completedStoryEvents || defaultState.completedStoryEvents,

    upgrades: {
      ...defaultState.upgrades,
      ...(state.upgrades || {}),
      levels: {
        ...defaultState.upgrades.levels,
        ...(state.upgrades?.levels || {}),
      },
    },

    progress: {
      ...defaultState.progress,
      ...(state.progress || {}),
      actionCounts: {
        ...defaultState.progress.actionCounts,
        ...(state.progress?.actionCounts || {}),
      },
      areaVisits: {
        ...defaultState.progress.areaVisits,
        ...(state.progress?.areaVisits || {}),
      },
    },

    unlocks: {
      ...defaultState.unlocks,
      ...(state.unlocks || {}),
      areas: {
        ...defaultState.unlocks.areas,
        ...(state.unlocks?.areas || {}),
      },
      actions: {
        ...defaultState.unlocks.actions,
        ...(state.unlocks?.actions || {}),
      },
      completedRules:
        state.unlocks?.completedRules || defaultState.unlocks.completedRules,
    },
  };
}

export function saveGameToSlot(slotId, state) {
  const saveRecord = createSaveRecord(state);

  localStorage.setItem(getSlotKey(slotId), JSON.stringify(saveRecord));
  localStorage.setItem(LAST_USED_SLOT_KEY, String(slotId));
}

export function loadGameFromSlot(slotId) {
  const rawSave = localStorage.getItem(getSlotKey(slotId));

  if (!rawSave) {
    return null;
  }

  const saveRecord = safelyParseSave(rawSave);

  if (!saveRecord) {
    return null;
  }

  const migratedState = migrateSaveRecord(saveRecord);
  const normalizedState = normalizeGameState(migratedState);

  if (!normalizedState) {
    return null;
  }

  localStorage.setItem(LAST_USED_SLOT_KEY, String(slotId));

  return normalizedState;
}

export function loadLastUsedSave() {
  const lastUsedSlot = localStorage.getItem(LAST_USED_SLOT_KEY);

  if (!lastUsedSlot) {
    return null;
  }

  return loadGameFromSlot(Number(lastUsedSlot));
}

export function clearSaveSlot(slotId) {
  localStorage.removeItem(getSlotKey(slotId));

  const lastUsedSlot = localStorage.getItem(LAST_USED_SLOT_KEY);

  if (String(slotId) === lastUsedSlot) {
    localStorage.removeItem(LAST_USED_SLOT_KEY);
  }
}

export function clearAllSaveSlots() {
  for (let slotId = 1; slotId <= SAVE_SLOT_COUNT; slotId += 1) {
    localStorage.removeItem(getSlotKey(slotId));
  }

  localStorage.removeItem(LAST_USED_SLOT_KEY);
}

export function getSaveSlotSummaries() {
  const summaries = [];

  for (let slotId = 1; slotId <= SAVE_SLOT_COUNT; slotId += 1) {
    const rawSave = localStorage.getItem(getSlotKey(slotId));
    const saveRecord = rawSave ? safelyParseSave(rawSave) : null;
    const migratedState = saveRecord ? migrateSaveRecord(saveRecord) : null;
    const savedState = normalizeGameState(migratedState);
    const isPrologue = savedState?.narrative?.phase === "prologue";

    summaries.push({
      slotId,
      hasSave: Boolean(savedState),
      savedAt: saveRecord?.savedAt || null,
      version: saveRecord?.version || 0,
      playerName: isPrologue ? "Astraea" : savedState?.player?.name || null,
      level: isPrologue ? "???" : savedState?.player?.level || null,
      areaId: savedState?.player?.area || null,
      areaLabel: isPrologue ? "The Veil" : null,
      day: isPrologue ? "Day ???" : savedState?.player?.day || null,
      path: savedState?.player?.path || null,
      storyStage: isPrologue ? "Prologue" : savedState ? `Chapter 1 · Act 1${savedState.conversation ? " · Conversation" : ""}` : null,
    });
  }

  return summaries;
}
