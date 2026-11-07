import { items } from "../data/items";
import { equipmentSlots } from "../data/equipmentSlots";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function getItemById(itemId) {
  return items.find((item) => item.id === itemId) || null;
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

function ensureEquipment(state) {
  if (!state.equipment) {
    state.equipment = {};
  }

  equipmentSlots.forEach((slot) => {
    if (!Object.prototype.hasOwnProperty.call(state.equipment, slot.id)) {
      state.equipment[slot.id] = null;
    }
  });
}

function hasInventoryItem(state, itemId) {
  ensureInventory(state);

  return state.inventory.items.some((entry) => {
    return (entry.itemId || entry.id) === itemId && (entry.quantity ?? 1) > 0;
  });
}

function getDefaultSlotForItem(state, item) {
  ensureEquipment(state);

  const compatibleSlots = equipmentSlots.filter((slot) => slot.itemSlot === item.slot);
  return compatibleSlots.find((slot) => !state.equipment[slot.id])?.id
    || compatibleSlots[0]?.id
    || null;
}

function canItemUseSlot(item, slotId) {
  return equipmentSlots.some((slot) => slot.id === slotId && slot.itemSlot === item.slot);
}

function clearExistingEquipmentInstance(state, itemId) {
  ensureEquipment(state);

  Object.keys(state.equipment).forEach((slotId) => {
    if (state.equipment[slotId] === itemId) {
      state.equipment[slotId] = null;
    }
  });
}

export function equipItem(currentState, itemId, preferredSlotId = null) {
  if (currentState.combat || currentState.conversation) return currentState;
  const nextState = clone(currentState);
  const item = getItemById(itemId);

  ensureInventory(nextState);
  ensureEquipment(nextState);

  if (!item) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("warning", `Unknown item: ${itemId}.`)
    );

    return nextState;
  }

  if (item.type !== "equipment") {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("warning", `${item.label} cannot be equipped.`)
    );

    return nextState;
  }

  if (!hasInventoryItem(nextState, item.id)) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("warning", `You do not have ${item.label}.`)
    );

    return nextState;
  }

  const targetSlotId = preferredSlotId || getDefaultSlotForItem(nextState, item);

  if (!targetSlotId || !canItemUseSlot(item, targetSlotId)) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("warning", `${item.label} cannot be equipped there.`)
    );

    return nextState;
  }

  if (nextState.equipment[targetSlotId] === item.id) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("system", `${item.label} is already equipped.`)
    );

    return nextState;
  }

  clearExistingEquipmentInstance(nextState, item.id);

  nextState.equipment[targetSlotId] = item.id;

  nextState.actionLog = addLog(
    nextState.actionLog,
    createLogEntry("system", `Equipped: ${item.label}.`)
  );

  return nextState;
}

export function unequipSlot(currentState, slotId) {
  if (currentState.combat || currentState.conversation) return currentState;
  const nextState = clone(currentState);

  ensureEquipment(nextState);

  const equippedItemId = nextState.equipment[slotId];

  if (!equippedItemId) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("system", "Nothing is equipped there.")
    );

    return nextState;
  }

  const item = getItemById(equippedItemId);
  const itemLabel = item?.label || equippedItemId;

  nextState.equipment[slotId] = null;

  nextState.actionLog = addLog(
    nextState.actionLog,
    createLogEntry("system", `Unequipped: ${itemLabel}.`)
  );

  return nextState;
}
