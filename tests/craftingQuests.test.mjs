import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState } = await import("../src/engine/createGameState.js");
const { actions } = await import("../src/data/actions.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { craftItem, getCraftingBlockReason, normalizeCrafting } = await import("../src/engine/craftingSystem.js");
const { getQuestStatus, isCraftingUnlocked } = await import("../src/engine/questSystem.js");
const { migrateSaveRecord, migrateSaveState } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { getCompletedMilestones } = await import("../src/engine/selectors.js");
const { equipItem } = await import("../src/engine/equipmentSystem.js");
const { getDerivedCombatStats } = await import("../src/engine/derivedStats.js");
const { startCombat } = await import("../src/engine/combatSystem.js");

const recipeId = "handmade_training_sword";
const questId = "rowan_first_craft";
const action = (id) => actions.find((entry) => entry.id === id);
function available() {
  let state = createGameState();
  state.player.area = "stonefield_house";
  state = performAction(state, action("train_with_garron"));
  state.player.area = "village_square";
  state = performAction(state, action("meet_rowan"));
  state.resources.wood.amount = 10;
  return performAction(state, action("bring_rowan_wood"));
}
const accepted = () => performAction(available(), action("begin_rowan_crafting"));
const status = (state) => getQuestStatus(state, questId);

test("quest and recipe unlock only through Rowan's lesson after the wood favor", () => {
  const fresh = createGameState();
  assert.equal(status(fresh), "locked");
  assert.equal(isCraftingUnlocked(fresh), false);
  assert.equal(craftItem(fresh, recipeId), fresh);
  assert.equal(status(performAction(fresh, action("begin_rowan_crafting"))), "locked");
  const state = available();
  assert.equal(status(state), "available");
  assert.equal(isCraftingUnlocked(state), false);
  assert.equal(state.unlocks.actions.begin_rowan_crafting, true);
});

test("accepting supplies cloth exactly once and starts persistent quest progress", () => {
  const before = available();
  const state = performAction(before, action("begin_rowan_crafting"));
  assert.equal(state.resources.cloth.amount, before.resources.cloth.amount + 1);
  assert.equal(state.resources.cloth.discovered, true);
  assert.equal(status(state), "active");
  assert.equal(isCraftingUnlocked(state), true);
  const repeated = performAction(state, action("begin_rowan_crafting"));
  assert.deepEqual(repeated.resources, state.resources);
  assert.deepEqual(repeated.storyLog, state.storyLog);
});

test("crafting spends all materials atomically, adds one sword, and marks the objective ready", () => {
  const state = accepted();
  const before = structuredClone(state);
  const next = craftItem(state, recipeId);
  assert.deepEqual(state, before);
  assert.equal(next.resources.wood.amount, 0);
  assert.equal(next.resources.cloth.amount, 0);
  assert.deepEqual(next.inventory.items.find((entry) => entry.itemId === recipeId), { itemId: recipeId, quantity: 1 });
  assert.equal(next.crafting.crafted[recipeId], 1);
  assert.equal(status(next), "ready");
  assert.equal(next.unlocks.actions.complete_rowan_crafting, true);
  assert.equal(next.player.stamina, state.player.stamina);
  assert.deepEqual(next.gatheringMastery, state.gatheringMastery);
  assert.equal(craftItem(next, recipeId), next);
});

test("insufficient wood or cloth charges nothing and does not advance the quest", () => {
  for (const id of ["wood", "cloth"]) {
    const state = accepted();
    state.resources[id].amount = 0;
    assert.equal(craftItem(state, recipeId), state);
    assert.equal(status(state), "active");
    assert.match(getCraftingBlockReason(state, recipeId), /missing materials/);
  }
});

test("crafting rejects unknown recipes, wrong location, pending encounters, combat, and existing equipment", () => {
  const state = accepted();
  assert.equal(craftItem(state, "free_sword"), state);
  const away = structuredClone(state);
  away.player.area = "forest_trail";
  assert.equal(craftItem(away, recipeId), away);
  const pending = structuredClone(state);
  pending.exploration.pending = { id: "sheltered_herbs", token: 1, areaId: "forest_edge" };
  assert.equal(craftItem(pending, recipeId), pending);
  const home = structuredClone(state);
  home.player.area = "stonefield_house";
  home.unlocks.systems.basic_guard = true;
  const combat = startCombat(home, "garron_spar", 5);
  assert.ok(combat.combat);
  assert.equal(craftItem(combat, recipeId), combat);
  for (const kind of ["inventory", "equipped"]) {
    const owned = structuredClone(state);
    if (kind === "inventory") owned.inventory.items.push({ itemId: recipeId, quantity: 1 });
    else owned.equipment.weapon = recipeId;
    assert.equal(craftItem(owned, recipeId), owned);
  }
});

test("handmade sword equips through the existing inventory and improves starter attack by one", () => {
  const crafted = craftItem(accepted(), recipeId);
  const starter = equipItem(crafted, "training_stick");
  const equipped = equipItem(starter, recipeId);
  const before = getDerivedCombatStats(starter.player, starter);
  const after = getDerivedCombatStats(equipped.player, equipped);
  assert.equal(equipped.equipment.weapon, recipeId);
  assert.equal(after.attackPower, before.attackPower + 1);
  assert.equal(after.guardPower, before.guardPower);
  assert.equal(status(equipped), "ready");
});

test("turn-in checks live quest status and location, pays once, and keeps the crafted sword", () => {
  const early = accepted();
  early.unlocks.actions.complete_rowan_crafting = true;
  const attempted = performAction(early, action("complete_rowan_crafting"));
  assert.deepEqual(attempted.resources, early.resources);
  assert.equal(status(attempted), "active");
  let ready = craftItem(early, recipeId);
  ready = equipItem(ready, recipeId);
  const away = structuredClone(ready);
  away.player.area = "stonefield_house";
  assert.equal(status(performAction(away, action("complete_rowan_crafting"))), "ready");
  const completed = performAction(ready, action("complete_rowan_crafting"));
  assert.equal(status(completed), "completed");
  assert.equal(completed.resources.gold.amount, ready.resources.gold.amount + 5);
  assert.deepEqual(completed.inventory, ready.inventory);
  assert.deepEqual(completed.equipment, ready.equipment);
  assert.ok(getCompletedMilestones(completed).some((entry) => entry.id === questId));
  const repeated = performAction(completed, action("complete_rowan_crafting"));
  assert.deepEqual(repeated.resources, completed.resources);
  assert.deepEqual(repeated.storyLog, completed.storyLog);
});

test("forged start unlock cannot skip the prerequisite or grant free cloth", () => {
  const state = createGameState();
  state.player.area = "village_square";
  state.unlocks.actions.begin_rowan_crafting = true;
  const next = performAction(state, action("begin_rowan_crafting"));
  assert.deepEqual(next.resources, state.resources);
  assert.equal(status(next), "locked");
});

test("old saves unlock eligible lessons without granting materials, crafting, or quest rewards", () => {
  const old = available();
  delete old.crafting;
  delete old.unlocks.actions.begin_rowan_crafting;
  old.unlocks.completedRules = old.unlocks.completedRules.filter((id) => id !== "unlock_rowan_crafting_lesson");
  const loaded = migrateSaveRecord({ version: 12, state: old });
  assert.equal(status(loaded), "available");
  assert.equal(loaded.unlocks.actions.begin_rowan_crafting, true);
  assert.deepEqual(loaded.resources, old.resources);
  assert.deepEqual(loaded.inventory, old.inventory);
  assert.deepEqual(loaded.crafting, normalizeCrafting(null));
  assert.deepEqual(migrateSaveState(loaded), loaded);
  assert.deepEqual(normalizeCrafting({ crafted: { [recipeId]: -3, unknown: 9 } }), normalizeCrafting(null));
});

test("save/load preserves active, ready, and completed quests and prevents repeat payouts", () => {
  const storage = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } });
  try {
    const active = accepted();
    const ready = craftItem(active, recipeId);
    const complete = performAction(ready, action("complete_rowan_crafting"));
    for (const state of [active, ready, complete]) {
      saveGameToSlot(1, state);
      const loaded = loadGameFromSlot(1);
      assert.equal(status(loaded), status(state));
      assert.deepEqual(loaded.resources, state.resources);
      assert.deepEqual(loaded.crafting, state.crafting);
      assert.deepEqual(loaded.inventory, state.inventory);
      if (status(state) !== "active") assert.equal(craftItem(loaded, recipeId), loaded);
      if (status(state) === "completed") assert.deepEqual(performAction(loaded, action("complete_rowan_crafting")).resources, loaded.resources);
    }
  } finally { if (previous) Object.defineProperty(globalThis, "localStorage", previous); else delete globalThis.localStorage; }
});
