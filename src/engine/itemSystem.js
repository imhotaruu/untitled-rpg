import { items } from "../data/items";

function getItemById(itemId) {
  return items.find((item) => item.id === itemId) || null;
}

function createLogEntry(type, message) {
  return {
    type,
    message,
  };
}

function addLog(logList, entry) {
  return [entry, ...logList].slice(0, 50);
}

function addLogsInDisplayOrder(logList, entries) {
  return [...entries, ...logList].slice(0, 50);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatUnlockLabel(unlockId) {
  return unlockId
    .split("_")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function formatStatName(stat) {
  const statNames = {
    hp: "Health",
    mp: "Mana",
    stamina: "Stamina",
  };

  return statNames[stat] || stat;
}

function formatAmount(value) {
  const rounded = Math.round(value * 10) / 10;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function getMaxStatName(stat) {
  return `max${stat.charAt(0).toUpperCase()}${stat.slice(1)}`;
}

function ensureInventory(state) {
  if (!state.inventory) {
    state.inventory = {
      items: [],
    };
  }

  if (!Array.isArray(state.inventory.items)) {
    state.inventory.items = [];
  }
}

function ensureUnlockGroups(state) {
  if (!state.unlocks) {
    state.unlocks = {};
  }

  if (!state.unlocks.areas) {
    state.unlocks.areas = {};
  }

  if (!state.unlocks.actions) {
    state.unlocks.actions = {};
  }

  if (!state.unlocks.systems) {
    state.unlocks.systems = {};
  }

  if (!Array.isArray(state.unlocks.completedRules)) {
    state.unlocks.completedRules = [];
  }
}

function isStackableItem(item) {
  if (typeof item.stackable === "boolean") {
    return item.stackable;
  }

  return item.type !== "equipment" && item.type !== "key_item";
}

function findInventoryEntryIndex(state, itemId) {
  ensureInventory(state);

  return state.inventory.items.findIndex((entry) => {
    return (entry.itemId || entry.id) === itemId;
  });
}

function getInventoryEntry(state, itemId) {
  const entryIndex = findInventoryEntryIndex(state, itemId);

  if (entryIndex < 0) {
    return null;
  }

  return state.inventory.items[entryIndex];
}

function addItemToInventory(state, item, quantity = 1) {
  ensureInventory(state);

  const existingEntry = state.inventory.items.find((entry) => {
    return (entry.itemId || entry.id) === item.id;
  });

  const stackable = isStackableItem(item);

  if (existingEntry) {
    if (stackable) {
      existingEntry.quantity = (existingEntry.quantity || 1) + quantity;

      return {
        added: true,
        alreadyOwned: false,
      };
    }

    return {
      added: false,
      alreadyOwned: true,
    };
  }

  state.inventory.items.push({
    itemId: item.id,
    quantity,
  });

  return {
    added: true,
    alreadyOwned: false,
  };
}

function removeItemFromInventory(state, itemId, quantity = 1) {
  const entryIndex = findInventoryEntryIndex(state, itemId);

  if (entryIndex < 0) {
    return false;
  }

  const entry = state.inventory.items[entryIndex];
  const currentQuantity = entry.quantity ?? 1;
  const nextQuantity = currentQuantity - quantity;

  if (nextQuantity > 0) {
    entry.quantity = nextQuantity;
  } else {
    state.inventory.items.splice(entryIndex, 1);
  }

  return true;
}

function applyItemProgression(state, item) {
  const messages = [];
  const progression = item.progression || {};

  if (!state.flags) {
    state.flags = {};
  }

  ensureUnlockGroups(state);

  const flags = progression.flags || [];

  flags.forEach((flag) => {
    state.flags[flag] = true;
  });

  const unlocks = progression.unlocks || {};

  if (Array.isArray(unlocks.systems)) {
    unlocks.systems.forEach((systemId) => {
      if (!state.unlocks.systems[systemId]) {
        state.unlocks.systems[systemId] = true;

        messages.push(
          createLogEntry(
            "unlock",
            `Unlocked: ${formatUnlockLabel(systemId)}`
          )
        );
      }
    });
  }

  if (Array.isArray(unlocks.actions)) {
    unlocks.actions.forEach((actionId) => {
      state.unlocks.actions[actionId] = true;
    });
  }

  if (Array.isArray(unlocks.areas)) {
    unlocks.areas.forEach((areaId) => {
      state.unlocks.areas[areaId] = true;
    });
  }

  return messages;
}

function canRestoreAnyStat(player, restore = {}) {
  return Object.entries(restore).some(([stat]) => {
    const maxStat = getMaxStatName(stat);

    if (typeof player[stat] !== "number") {
      return false;
    }

    if (typeof player[maxStat] !== "number") {
      return false;
    }

    return player[stat] < player[maxStat] - 0.001;
  });
}

function canApplyUseEffects(state, useEffects = {}) {
  const restore = useEffects.restore || {};

  if (Object.keys(restore).length > 0) {
    return canRestoreAnyStat(state.player, restore);
  }

  return false;
}

function applyRestoreEffects(player, restore = {}) {
  const messages = [];

  Object.entries(restore).forEach(([stat, amount]) => {
    const maxStat = getMaxStatName(stat);

    if (typeof player[stat] !== "number") {
      return;
    }

    if (typeof player[maxStat] !== "number") {
      return;
    }

    const before = player[stat];
    const after = Math.min(player[maxStat], before + amount);
    const restoredAmount = after - before;

    player[stat] = after;

    if (restoredAmount > 0) {
      messages.push(
        createLogEntry(
          "item_info",
          `Restored ${formatStatName(stat)}: +${formatAmount(restoredAmount)}.`
        )
      );
    }
  });

  return messages;
}

function applyUseEffects(state, useEffects = {}) {
  const messages = [];

  if (useEffects.restore) {
    messages.push(...applyRestoreEffects(state.player, useEffects.restore));
  }

  return messages;
}

export function grantItemRewards(state, itemRewards = []) {
  if (!Array.isArray(itemRewards) || itemRewards.length === 0) {
    return [];
  }

  const messages = [];

  itemRewards.forEach((reward) => {
    const itemId = reward.itemId || reward.id;
    const quantity = reward.quantity ?? 1;
    const item = getItemById(itemId);

    if (!item) {
      messages.push(
        createLogEntry("warning", `Unknown item reward: ${itemId}.`)
      );
      return;
    }

    const result = addItemToInventory(state, item, quantity);

    if (result.added) {
      messages.push(
        createLogEntry(
          "item_gain",
          `+${quantity} Obtained item: ${item.label}`
        )
      );
    }

    if (result.alreadyOwned) {
      messages.push(
        createLogEntry("item_info", `Already obtained: ${item.label}.`)
      );
    }

    const progressionMessages = applyItemProgression(state, item);
    messages.push(...progressionMessages);
  });

  return messages;
}

export function consumeInventoryItem(currentState, itemId) {
  if (currentState.combat || currentState.conversation) return currentState;
  const nextState = clone(currentState);
  const item = getItemById(itemId);

  ensureInventory(nextState);

  if (!item) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("warning", `Unknown item: ${itemId}.`)
    );

    return nextState;
  }

  if (item.type !== "consumable") {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("warning", `${item.label} cannot be used.`)
    );

    return nextState;
  }

  const inventoryEntry = getInventoryEntry(nextState, item.id);

  if (!inventoryEntry || (inventoryEntry.quantity ?? 1) <= 0) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("warning", `You do not have ${item.label}.`)
    );

    return nextState;
  }

  const useEffects = item.useEffects || {};

  if (!canApplyUseEffects(nextState, useEffects)) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("system", `${item.label} has no effect right now.`)
    );

    return nextState;
  }

  const effectMessages = applyUseEffects(nextState, useEffects);
  removeItemFromInventory(nextState, item.id, 1);

  const logEntries = [
    createLogEntry("item_info", `Used item: ${item.label}`),
    ...effectMessages,
    createLogEntry("item_loss", `-1 Consumed item: ${item.label}`),
  ];

  nextState.actionLog = addLogsInDisplayOrder(
    nextState.actionLog,
    logEntries
  );

  return nextState;
}
