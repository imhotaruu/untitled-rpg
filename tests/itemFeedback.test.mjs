import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState } = await import("../src/engine/createGameState.js");
const { consumeInventoryItem } = await import("../src/engine/itemSystem.js");
const { equipItem, unequipSlot } = await import("../src/engine/equipmentSystem.js");
const { createItemFeedback } = await import("../src/utils/itemFeedback.js");

function fullState() {
  const state = createGameState();
  state.player.hp = state.player.maxHp;
  state.player.stamina = state.player.maxStamina;
  return state;
}

function usePoultice(before) {
  const after = consumeInventoryItem(before, "simple_poultice");
  const feedback = createItemFeedback(before, after, {
    type: "use", itemId: "simple_poultice",
  });
  return { after, feedback };
}

for (const missing of [1, 2, 0.025]) {
  test(`reports actual ${missing} Stamina restored, without a Health gain`, () => {
    const before = fullState();
    before.player.stamina -= missing;
    const snapshot = structuredClone(before);
    const { after, feedback } = usePoultice(before);
    assert.equal(feedback.title, "Item Used");
    assert.deepEqual(feedback.messages, [
      `+${missing} Stamina restored`, "−1 Simple Poultice consumed",
    ]);
    assert.equal(after.player.stamina, before.player.maxStamina);
    assert.equal(after.inventory.items.find((item) => item.itemId === "simple_poultice").quantity, 1);
    assert.deepEqual(before, snapshot);
    assert.deepEqual(after.storyLog, before.storyLog);
    assert.equal(after.actionLog[2].type, "item_loss");
  });
}

test("reports both recovery amounts, clamped to item limits", () => {
  const before = fullState();
  before.player.hp -= 5;
  before.player.stamina -= 5;
  const { feedback } = usePoultice(before);
  assert.deepEqual(feedback.messages, [
    "+3 Health restored", "+2 Stamina restored", "−1 Simple Poultice consumed",
  ]);
});

test("full resources produce informational feedback and preserve quantity", () => {
  const before = fullState();
  const { after, feedback } = usePoultice(before);
  assert.equal(feedback.tone, "info");
  assert.deepEqual(feedback.messages, [
    "Simple Poultice has no effect right now.", "Item was not consumed.",
  ]);
  assert.deepEqual(after.inventory, before.inventory);
});

test("repeated uses remove the last poultice, then report the missing item", () => {
  const before = fullState();
  before.player.hp = 0;
  const first = usePoultice(before);
  const second = usePoultice(first.after);
  assert.equal(second.feedback.tone, "success");
  assert.equal(second.after.inventory.items.some((item) => item.itemId === "simple_poultice"), false);
  const third = usePoultice(second.after);
  assert.equal(third.feedback.tone, "info");
  assert.deepEqual(third.feedback.messages, [
    "You do not have Simple Poultice.", "Item was not consumed.",
  ]);
});

test("Training Sword equip and unequip report signed combat stat changes", () => {
  const before = fullState();
  before.inventory.items.push({ itemId: "training_stick", quantity: 1 });
  const equipped = equipItem(before, "training_stick");
  const feedback = createItemFeedback(before, equipped, { type: "equip", itemId: "training_stick" });
  assert.equal(feedback.title, "Equipped");
  assert.deepEqual(feedback.messages, ["+1 Attack Power", "+1 Guard Power"]);
  const removed = unequipSlot(equipped, "weapon");
  assert.deepEqual(createItemFeedback(equipped, removed, {
    type: "unequip", slotId: "weapon",
  }).messages, ["−1 Attack Power", "−1 Guard Power"]);
  assert.deepEqual(removed.inventory, before.inventory);
  assert.deepEqual(removed.storyLog, before.storyLog);
  assert.equal(removed.actionLog[0].message, "Unequipped: Training Sword.");
});

test("Charm removal and re-equipping preserve the item and report its bonuses", () => {
  const before = fullState();
  const removed = unequipSlot(before, "accessory1");
  assert.deepEqual(createItemFeedback(before, removed, {
    type: "unequip", slotId: "accessory1",
  }).messages, ["−1 Focus", "−1 Resolve"]);
  const equipped = equipItem(removed, "threadbare_charm");
  assert.deepEqual(createItemFeedback(removed, equipped, {
    type: "equip", itemId: "threadbare_charm",
  }).messages, ["+1 Focus", "+1 Resolve"]);
  assert.deepEqual(equipped.inventory, before.inventory);
});

test("moving equipment between slots does not claim an additional stat bonus", () => {
  const before = fullState();
  const after = equipItem(before, "threadbare_charm", "accessory2");
  const feedback = createItemFeedback(before, after, { type: "equip", itemId: "threadbare_charm" });
  assert.equal(feedback.title, "Equipped");
  assert.deepEqual(feedback.messages, ["Combat stats unchanged."]);
});

test("rejected equipment actions never report success", () => {
  const before = fullState();
  for (const [itemId, slotId] of [
    ["training_stick", "weapon"],
    ["threadbare_charm", "weapon"],
    ["threadbare_charm", "accessory1"],
    ["simple_poultice", "weapon"],
    ["missing_item", "weapon"],
  ]) {
    const after = equipItem(before, itemId, slotId);
    const feedback = createItemFeedback(before, after, { type: "equip", itemId, slotId });
    assert.equal(feedback.tone, "info");
    assert.deepEqual(after.equipment, before.equipment);
  }
  const after = unequipSlot(before, "weapon");
  assert.equal(createItemFeedback(before, after, { type: "unequip", slotId: "weapon" }).tone, "info");
});
