import { actions } from "../data/actions";
import { areas } from "../data/areas";
import { defaultPlayer } from "../data/defaultPlayer";
import { defaultResources } from "../data/defaultResources";
import { starterEquipment, starterInventory } from "../data/items";
import { normalizeGatheringMastery } from "./gatheringSystem";
import { normalizeCrafting } from "./craftingSystem";
import { chapterNarrative, initialNarrative } from "./prologueSystem";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialUnlockMap(items, defaultKey = "discovered") {
  return items.reduce((unlocks, item) => {
    if (item[defaultKey] !== false) {
      unlocks[item.id] = true;
    }

    return unlocks;
  }, {});
}

export function createGameState() {
  return {
    narrative: chapterNarrative(),
    player: clone(defaultPlayer),
    resources: clone(defaultResources),

    inventory: clone(starterInventory),
    equipment: clone(starterEquipment),
    combat: null,
    conversation: null,
    crafting: normalizeCrafting(null),
    exploration: { pending: null, sequence: 0, resolved: 0, cooldown: 0, discovered: [] },
    gatheringMastery: normalizeGatheringMastery(null),

    actionLog: ["Prototype initialized."],
    storyLog: ["Story shell loaded."],

    flags: {},
    completedStoryEvents: [],

    upgrades: {
      levels: {},
    },

    progress: {
      totalActions: 0,
      combatTraining: 0,
      actionCounts: {},
      areaVisits: {
        [defaultPlayer.area]: 1,
      },
    },

    unlocks: {
      areas: createInitialUnlockMap(areas, "discovered"),
      actions: createInitialUnlockMap(actions, "unlocked"),
      systems: {},
      completedActions: {},
      completedRules: [],
    },
  };
}

export function createNewJourney() {
  const state = createGameState();
  return { ...state, narrative: initialNarrative(),
    player: { ...state.player, area: "stonefield_house" },
    progress: { ...state.progress, areaVisits: {} }, actionLog: [], storyLog: [] };
}
