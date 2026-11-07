import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState } = await import("../src/engine/createGameState.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { getAvailableActions } = await import("../src/engine/selectors.js");
const { equipItem, unequipSlot } = await import("../src/engine/equipmentSystem.js");
const { getDerivedCombatStats } = await import("../src/engine/derivedStats.js");
const { migrateSaveRecord, CURRENT_SAVE_VERSION } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { createItemFeedback } = await import("../src/utils/itemFeedback.js");
const { actions } = await import("../src/data/actions.js");
const { items } = await import("../src/data/items.js");
const { armorSlots } = await import("../src/data/equipmentSlots.js");

const train = actions.find((action) => action.id === "train_with_garron");
const practice = actions.find((action) => action.id === "practice_with_garron");
const collect = actions.find((action) => action.id === "collect_training_armor");
const armor = collect.itemRewards.map(({ itemId }) => items.find((item) => item.id === itemId));

function atHome() {
  const state = createGameState();
  state.player.area = "stonefield_house";
  return state;
}

function trainedState() {
  let state = performAction(atHome(), train);
  for (let i = 0; i < 5; i++) state = performAction(state, practice);
  return state;
}

function hasCollectAction(state) {
  return getAvailableActions(actions, state.player.area, state.unlocks).some((action) => action.id === collect.id);
}

function assertNoReward(before, after) {
  assert.deepEqual(after.inventory, before.inventory);
  assert.deepEqual(after.storyLog, before.storyLog);
  assert.deepEqual(after.progress, before.progress);
  assert.deepEqual(after.equipment, before.equipment);
  assert.equal(after.actionLog[0].type, "warning");
}

test("new games have empty armor slots and must earn the set", () => {
  const state = atHome();
  assert.equal(armorSlots.length, 4);
  for (const slot of armorSlots) assert.equal(state.equipment[slot.id], null);
  assert.equal(state.inventory.items.some((entry) => armor.some((item) => entry.itemId === item.id)), false);
  assert.equal(hasCollectAction(state), false);
  assertNoReward(state, performAction(state, collect));
});

test("initial training plus five practices unlock Basic Guard and the armor reward once", () => {
  let state = performAction(atHome(), train);
  for (let i = 0; i < 4; i++) state = performAction(state, practice);
  assert.equal(state.progress.combatTraining, 4);
  assert.equal(hasCollectAction(state), false);
  state = performAction(state, practice);
  assert.equal(state.progress.combatTraining, 5);
  assert.equal(state.unlocks.systems.basic_guard, true);
  assert.equal(hasCollectAction(state), true);
  state = performAction(state, practice);
  assert.equal(state.unlocks.completedRules.filter((id) => id === "unlock_training_armor").length, 1);
});

test("collecting grants exactly four pieces, one scene, and no automatic equipment", () => {
  const before = trainedState();
  const snapshot = structuredClone(before);
  const after = performAction(before, collect);
  for (const item of armor) {
    assert.equal(after.inventory.items.find((entry) => entry.itemId === item.id).quantity, 1);
  }
  assert.deepEqual(after.equipment, before.equipment);
  assert.equal(after.storyLog.filter((text) => text === collect.story).length, 1);
  assert.equal(after.actionLog.filter((log) => log.type === "item_gain").length, 5); // Includes the earlier Training Sword.
  assert.equal(after.progress.actionCounts.collect_training_armor, 1);
  assert.equal(hasCollectAction(after), false);
  assert.deepEqual(before, snapshot);
  assertNoReward(after, performAction(after, collect));
});

test("an unlocked reward cannot be collected outside Stonefield House", () => {
  const state = trainedState();
  state.player.area = "village_square";
  assert.equal(hasCollectAction(state), false);
  assertNoReward(state, performAction(state, collect));
});

for (const item of armor) {
  test(`${item.label} equips only to its matching slot and unequips without losing the item`, () => {
    const before = performAction(trainedState(), collect);
    const baseline = getDerivedCombatStats(before.player, before);
    const after = equipItem(before, item.id);
    assert.equal(after.equipment[item.slot], item.id);
    assert.deepEqual(after.inventory, before.inventory);
    assert.deepEqual(after.storyLog, before.storyLog);
    const feedback = createItemFeedback(before, after, { type: "equip", itemId: item.id });
    assert.equal(feedback.title, "Equipped");
    for (const [stat, bonus] of Object.entries(item.equipmentBonuses)) {
      assert.equal(getDerivedCombatStats(after.player, after)[stat] - baseline[stat], bonus);
    }
    const invalid = equipItem(before, item.id, item.slot === "head" ? "chest" : "head");
    assert.deepEqual(invalid.equipment, before.equipment);
    assert.equal(invalid.actionLog[0].type, "warning");
    const repeated = equipItem(after, item.id);
    assert.equal(createItemFeedback(after, repeated, { type: "equip", itemId: item.id }).tone, "info");
    const removed = unequipSlot(after, item.slot);
    assert.equal(removed.equipment[item.slot], null);
    assert.deepEqual(removed.inventory, before.inventory);
    assert.deepEqual(getDerivedCombatStats(removed.player, removed), baseline);
  });
}

test("a full set adds +4 Defense and +1 Guard Power while preserving other equipment", () => {
  let state = performAction(trainedState(), collect);
  state = equipItem(state, "training_stick");
  const baseline = getDerivedCombatStats(state.player, state);
  for (const item of armor) state = equipItem(state, item.id);
  const stats = getDerivedCombatStats(state.player, state);
  assert.equal(stats.defense - baseline.defense, 4);
  assert.equal(stats.guardPower - baseline.guardPower, 1);
  assert.equal(stats.attackPower, baseline.attackPower);
  assert.equal(state.equipment.weapon, "training_stick");
  assert.equal(state.equipment.accessory1, "threadbare_charm");
});

test("armor must be owned in positive quantity and cannot go into weapon/accessory slots", () => {
  const state = atHome();
  const item = armor[0];
  assert.equal(equipItem(state, item.id).equipment.head, null);
  state.inventory.items.push({ itemId: item.id, quantity: 0 });
  assert.equal(equipItem(state, item.id).equipment.head, null);
  state.inventory.items.at(-1).quantity = 1;
  for (const slot of ["weapon", "accessory1", "missing_slot"]) {
    assert.deepEqual(equipItem(state, item.id, slot).equipment, state.equipment);
  }
});

test("replacing armor keeps both items and reports the net bonus", (t) => {
  const replacement = { ...armor[0], id: "test_replacement_cap", label: "Test Cap", equipmentBonuses: { defense: 3 } };
  items.push(replacement);
  t.after(() => items.splice(items.indexOf(replacement), 1));
  let before = performAction(trainedState(), collect);
  before.inventory.items.push({ itemId: replacement.id, quantity: 1 });
  before = equipItem(before, armor[0].id);
  const after = equipItem(before, replacement.id);
  assert.equal(after.equipment.head, replacement.id);
  assert.deepEqual(after.inventory, before.inventory);
  assert.deepEqual(createItemFeedback(before, after, {
    type: "equip", itemId: replacement.id,
  }).messages, ["+2 Defense"]);
});

test("version 7 saves gain empty slots and an eligible claim action, but no free items", () => {
  const legacy = trainedState();
  for (const slot of armorSlots) delete legacy.equipment[slot.id];
  delete legacy.unlocks.actions.collect_training_armor;
  legacy.unlocks.completedRules = legacy.unlocks.completedRules.filter((id) => id !== "unlock_training_armor");
  legacy.inventory.items = legacy.inventory.items.filter((entry) => entry.itemId !== "simple_poultice");
  const snapshot = structuredClone(legacy);
  const migrated = migrateSaveRecord({ version: 7, state: legacy });
  assert.equal(CURRENT_SAVE_VERSION, 16);
  for (const slot of armorSlots) assert.equal(migrated.equipment[slot.id], null);
  assert.equal(hasCollectAction(migrated), true);
  assert.deepEqual(migrated.inventory, snapshot.inventory);
  assert.deepEqual(migrated.storyLog, snapshot.storyLog);
  assert.deepEqual(legacy, snapshot);
  assert.deepEqual(migrateSaveRecord({ version: 8, state: migrated }), migrated);
  const claimed = performAction(migrated, collect);
  assert.equal(claimed.inventory.items.length, migrated.inventory.items.length + 4);
});

test("older saves without Basic Guard do not unlock the armor reward", () => {
  const legacy = atHome();
  for (const slot of armorSlots) delete legacy.equipment[slot.id];
  const migrated = migrateSaveRecord({ version: 7, state: legacy });
  assert.equal(hasCollectAction(migrated), false);
  assert.deepEqual(migrated.inventory, legacy.inventory);
});

test("save/load retains equipment, bonuses, and one-time reward completion", (t) => {
  const storage = new Map();
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } });
  t.after(() => {
    if (originalDescriptor) Object.defineProperty(globalThis, "localStorage", originalDescriptor);
    else delete globalThis.localStorage;
  });
  let before = performAction(trainedState(), collect);
  for (const item of armor) before = equipItem(before, item.id);
  saveGameToSlot(1, before);
  const after = loadGameFromSlot(1);
  assert.deepEqual(after.equipment, before.equipment);
  assert.deepEqual(after.inventory, before.inventory);
  assert.deepEqual(after.storyLog, before.storyLog);
  assert.deepEqual(getDerivedCombatStats(after.player, after), getDerivedCombatStats(before.player, before));
  assert.equal(hasCollectAction(after), false);
  assertNoReward(after, performAction(after, collect));
  assert.equal(JSON.parse(storage.get("new-untitled-game-save-slot-1")).version, 16);
});

test("existing one-time training also rejects a repeated click", () => {
  const before = performAction(atHome(), train);
  const after = performAction(before, train);
  assertNoReward(before, after);
  assert.equal(after.player.stamina, before.player.stamina);
});
