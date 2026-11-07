import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { upgrades } = await import("../src/data/upgrades.js");
const { actions } = await import("../src/data/actions.js");
const { createGameState } = await import("../src/engine/createGameState.js");
const { purchaseUpgrade, getUpgradePreview, getUpgradeBlockReason, getUpgradeLevel } = await import("../src/engine/upgradeSystem.js");
const { getUpgradeBonusTotals } = await import("../src/engine/upgradeBonuses.js");
const { getDerivedCombatStats } = await import("../src/engine/derivedStats.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { startCombat, performCombatMove, getHitChance } = await import("../src/engine/combatSystem.js");
const { equipItem } = await import("../src/engine/equipmentSystem.js");
const { migrateSaveRecord } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { processGameTick } = await import("../src/engine/tickSystem.js");
const { createUpgradeFeedback } = await import("../src/utils/upgradeFeedback.js");
const { getAvailableActions } = await import("../src/engine/selectors.js");
const { moveToArea } = await import("../src/engine/areaSystem.js");
const { areas } = await import("../src/data/areas.js");

const upgrade = (id) => upgrades.find((entry) => entry.id === id);
const action = (id) => actions.find((entry) => entry.id === id);
const stats = (state) => getDerivedCombatStats(state.player, state);
function prepared(practices = 5) {
  let state = createGameState();
  state.resources.herbs = { ...state.resources.herbs, amount: 1000, discovered: true };
  state.resources.wood = { ...state.resources.wood, amount: 1000, discovered: true };
  state.player.area = "stonefield_house";
  state = performAction(state, action("train_with_garron"));
  for (let i = 0; i < practices; i++) state = performAction(state, action("practice_with_garron"));
  return state;
}

test("legacy conditioning retains costs, rank caps, and once-only stat gains", () => {
  const expectedCosts = {
    stamina_training: [5, 10, 15, 20, 25],
    breathing_practice: [8, 14, 20, 28, 36],
    basic_conditioning: [10, 16, 24, 32, 40],
  };
  for (const [id, costs] of Object.entries(expectedCosts)) {
    let state = prepared();
    const before = structuredClone(state);
    const definition = upgrade(id);
    assert.deepEqual(definition.costs.map((cost) => cost.herbs), costs);
    for (let rank = 1; rank <= 5; rank++) {
      const preview = getUpgradePreview(state, definition);
      state = purchaseUpgrade(state, definition);
      assert.equal(getUpgradeLevel(state, id), rank);
      for (const row of preview) assert.equal(state.player[row.stat], row.next);
    }
    assert.equal(state.resources.herbs.amount, before.resources.herbs.amount - costs.reduce((sum, cost) => sum + cost, 0));
    for (const { stat, amount } of definition.effects) {
      assert.ok(Math.abs(state.player[stat] - before.player[stat] - amount * 5) < 1e-9);
    }
    const maxed = purchaseUpgrade(state, definition);
    assert.deepEqual(maxed.player, state.player);
    assert.deepEqual(maxed.resources, state.resources);
    assert.deepEqual(maxed.upgrades, state.upgrades);
  }
});

test("combat techniques require the matching training and reject forged definitions", () => {
  const fresh = createGameState();
  fresh.resources.herbs.amount = 1000;
  for (const definition of upgrades.filter((entry) => entry.combatBonuses)) {
    const after = purchaseUpgrade(fresh, { ...definition, requiredSystem: null, costs: [{}] });
    assert.deepEqual(after.upgrades, fresh.upgrades);
    assert.deepEqual(after.resources, fresh.resources);
    assert.match(after.actionLog[0], /Garron/);
  }
  const basics = prepared(0);
  assert.equal(getUpgradeBlockReason(basics, upgrade("striking_drills")), null);
  assert.equal(getUpgradeBlockReason(basics, upgrade("precision_drills")), null);
  assert.match(getUpgradeBlockReason(basics, upgrade("guard_drills")), /Basic Guard/);
  assert.equal(getUpgradeBlockReason(prepared(), upgrade("guard_drills")), null);
  assert.equal(purchaseUpgrade(fresh, { id: "unknown" }), fresh);
  assert.equal(purchaseUpgrade(fresh, null), fresh);
  const purchased = purchaseUpgrade(basics, { id: "striking_drills", costs: [{}], combatBonuses: { attackPower: 999 } });
  assert.equal(purchased.resources.herbs.amount, basics.resources.herbs.amount - 15);
  assert.equal(stats(purchased).attackPower, stats(basics).attackPower + 1);
});

test("every combat rank preview matches derived stats and stacks with training and equipment", () => {
  let state = equipItem(prepared(), "training_stick");
  const original = structuredClone(state);
  for (const definition of upgrades.filter((entry) => entry.combatBonuses)) {
    const [stat, amount] = Object.entries(definition.combatBonuses)[0];
    for (let rank = 1; rank <= 3; rank++) {
      const before = state;
      const snapshot = structuredClone(before);
      const preview = getUpgradePreview(before, definition)[0];
      state = purchaseUpgrade(before, definition);
      assert.deepEqual(before, snapshot);
      assert.equal(stats(state)[stat], preview.next);
      assert.equal(stats(state)[stat] - preview.current, amount);
      assert.equal(getUpgradeLevel(state, definition.id), rank);
      for (const [resource, cost] of Object.entries(definition.costs[rank - 1])) {
        assert.equal(before.resources[resource].amount - state.resources[resource].amount, cost);
      }
    }
    const extra = purchaseUpgrade(state, definition);
    assert.deepEqual(extra.upgrades, state.upgrades);
    assert.deepEqual(extra.resources, state.resources);
  }
  assert.deepEqual(getUpgradeBonusTotals(state), { attackPower: 3, accuracy: 9, guardPower: 3 });
  assert.deepEqual(state.player, original.player);
  assert.deepEqual(state.equipment, original.equipment);
});

test("insufficient resources and stat caps block spending, including after a partial capped gain", () => {
  const before = prepared();
  before.resources.herbs.amount = 14;
  const rejected = purchaseUpgrade(before, upgrade("striking_drills"));
  assert.deepEqual(rejected.upgrades, before.upgrades);
  assert.deepEqual(rejected.resources, before.resources);
  const nearCap = prepared();
  nearCap.player.attributes.dexterity = 7;
  assert.deepEqual(getUpgradePreview(nearCap, upgrade("precision_drills")), [{ stat: "accuracy", current: 93, next: 95 }]);
  const atCap = purchaseUpgrade(nearCap, upgrade("precision_drills"));
  assert.equal(stats(atCap).accuracy, 95);
  assert.match(getUpgradeBlockReason(atCap, upgrade("precision_drills")), /stat cap/);
  const capped = purchaseUpgrade(atCap, upgrade("precision_drills"));
  assert.deepEqual(capped.upgrades, atCap.upgrades);
  assert.deepEqual(capped.resources, atCap.resources);
});

test("combat snapshots use purchased power, precision, and guard with actual damage effects", () => {
  const before = prepared();
  const originalSpar = startCombat(before, "garron_spar", 1);
  const powerSpar = startCombat(purchaseUpgrade(before, upgrade("striking_drills")), "garron_spar", 1);
  const attack = performCombatMove(originalSpar, "attack");
  const strongerAttack = performCombatMove(powerSpar, "attack");
  assert.equal(strongerAttack.combat.enemy.hp, attack.combat.enemy.hp - 1);
  const precisionSpar = startCombat(purchaseUpgrade(before, upgrade("precision_drills")), "garron_spar", 1);
  assert.equal(getHitChance(precisionSpar.combat.player, precisionSpar.combat.enemy),
    getHitChance(originalSpar.combat.player, originalSpar.combat.enemy) + 3);
  const guardSpar = startCombat(purchaseUpgrade(before, upgrade("guard_drills")), "garron_spar", 1);
  originalSpar.combat.round = 3;
  guardSpar.combat.round = 3;
  assert.equal(performCombatMove(guardSpar, "guard").combat.player.hp,
    performCombatMove(originalSpar, "guard").combat.player.hp + 1);
  assert.equal(performCombatMove(guardSpar, "recover").combat.player.hp,
    performCombatMove(originalSpar, "recover").combat.player.hp);
  for (const definition of upgrades) assert.equal(purchaseUpgrade(powerSpar, definition), powerSpar);
});

test("breathing improves adventure resting but never combat Recover", () => {
  const before = prepared();
  const after = purchaseUpgrade(before, upgrade("breathing_practice"));
  for (const state of [before, after]) {
    state.player.isResting = true;
    state.player.stamina = 0;
  }
  assert.equal(processGameTick(before, 1).player.stamina, 0.5);
  assert.equal(processGameTick(after, 1).player.stamina, 0.6);
  for (const state of [before, after]) {
    const spar = startCombat(state, "garron_spar", 1);
    spar.combat.player.stamina = 0;
    assert.equal(performCombatMove(spar, "recover").combat.player.stamina, 3);
    assert.equal(processGameTick(spar, 10), spar);
  }
});

test("legacy saves retain applied conditioning and gain no unpurchased techniques on load", () => {
  let legacy = prepared();
  for (const id of ["stamina_training", "breathing_practice", "basic_conditioning"]) {
    legacy = purchaseUpgrade(legacy, upgrade(id));
  }
  const migrated = migrateSaveRecord({ version: 9, state: legacy });
  const twice = migrateSaveRecord({ version: 9, state: migrated });
  assert.deepEqual(migrated.player, legacy.player);
  assert.deepEqual(twice, migrated);
  assert.deepEqual(getUpgradeBonusTotals(migrated), {});
  assert.deepEqual(stats(migrated), stats(legacy));
  assert.equal(getUpgradeBlockReason(migrated, upgrade("guard_drills")), null);
});

test("save/load retains technique ranks and stats without applying them twice", (t) => {
  const data = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  } });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  let state = prepared();
  for (const definition of upgrades) state = purchaseUpgrade(state, definition);
  saveGameToSlot(1, state);
  const loaded = loadGameFromSlot(1);
  assert.deepEqual(loaded.upgrades, state.upgrades);
  assert.deepEqual(loaded.player, state.player);
  assert.deepEqual(stats(loaded), stats(state));
  const active = startCombat(loaded, "garron_spar", 30);
  saveGameToSlot(2, active);
  assert.deepEqual(loadGameFromSlot(2).combat, active.combat);
  assert.deepEqual(stats(loadGameFromSlot(1)), stats(state));
});

test("invalid or out-of-range saved technique levels cannot create invalid bonuses", () => {
  const state = prepared();
  for (const level of [-1, NaN, Infinity, "3", null, {}]) {
    state.upgrades.levels.striking_drills = level;
    assert.equal(getUpgradeLevel(state, "striking_drills"), 0);
  }
  state.upgrades.levels.striking_drills = 99;
  assert.equal(getUpgradeBonusTotals(state).attackPower, 3);
  state.upgrades.levels.striking_drills = 1.9;
  assert.equal(getUpgradeBonusTotals(state).attackPower, 1);
});

test("multi-resource upgrades require the whole cost and never partially spend", () => {
  const definition = upgrade("striking_drills");
  const rankOne = purchaseUpgrade(prepared(), definition);
  for (const [herbs, wood] of [[25, 4], [24, 5], [0, 0]]) {
    const before = structuredClone(rankOne);
    before.resources.herbs.amount = herbs;
    before.resources.wood.amount = wood;
    const after = purchaseUpgrade(before, definition);
    assert.deepEqual(after.resources, before.resources);
    assert.deepEqual(after.upgrades, before.upgrades);
    assert.deepEqual(stats(after), stats(before));
    const feedback = createUpgradeFeedback(before, after, definition.id);
    assert.equal(feedback.tone, "info");
    assert.equal(feedback.messages.at(-1), "No resources were spent.");
    assert.match(feedback.messages[0], herbs < 25 ? /Herbs/ : /Wood/);
  }
  rankOne.resources.herbs.amount = 25;
  rankOne.resources.wood.amount = 5;
  const rankTwo = purchaseUpgrade(rankOne, definition);
  assert.equal(rankTwo.resources.herbs.amount, 0);
  assert.equal(rankTwo.resources.wood.amount, 0);
  assert.equal(getUpgradeLevel(rankTwo, definition.id), 2);
  const feedback = createUpgradeFeedback(rankOne, rankTwo, definition.id);
  assert.equal(feedback.tone, "success");
  assert.equal(feedback.itemLabel, "Striking Drills · Level 2");
  assert.deepEqual(feedback.messages, [
    `Attack Power: ${stats(rankOne).attackPower} → ${stats(rankTwo).attackPower}`,
    "Spent: 25 Herbs, 5 Wood",
  ]);
  assert.match(rankTwo.actionLog.find((entry) => typeof entry === "string" && entry.startsWith("Upgrade purchased:")), /Spent: 25 Herbs, 5 Wood/);
});

test("upgrade feedback reports actual capped gains, restored vitals, and clean regen values", () => {
  const state = prepared();
  state.player.attributes.dexterity = 7;
  const precision = purchaseUpgrade(state, upgrade("precision_drills"));
  assert.equal(createUpgradeFeedback(state, precision, "precision_drills").messages[0], "Accuracy: 93% → 95%");
  const stamina = purchaseUpgrade(state, upgrade("stamina_training"));
  assert.deepEqual(createUpgradeFeedback(state, stamina, "stamina_training").messages, [
    "Max stamina: 8 → 10", "+2 Stamina restored", "Spent: 5 Herbs",
  ]);
  const breathing = purchaseUpgrade(state, upgrade("breathing_practice"));
  assert.deepEqual(createUpgradeFeedback(state, breathing, "breathing_practice").messages, [
    "Stamina regen: 0.5/s → 0.6/s", "Spent: 8 Herbs",
  ]);
});

test("feedback at the final rank reports the last gain, and repeated or blocked purchases report no change", () => {
  let before = prepared();
  for (let rank = 0; rank < 2; rank++) before = purchaseUpgrade(before, upgrade("striking_drills"));
  const maxed = purchaseUpgrade(before, upgrade("striking_drills"));
  assert.equal(createUpgradeFeedback(before, maxed, "striking_drills").messages[0],
    `Attack Power: ${stats(before).attackPower} → ${stats(maxed).attackPower}`);
  const cases = [
    [maxed, "striking_drills", /Maximum level/],
    [createGameState(), "striking_drills", /Combat Basics/],
    [startCombat(prepared(), "garron_spar", 1), "striking_drills", /Finish the battle/],
    [prepared(), "missing", /unavailable/],
  ];
  const capped = prepared();
  capped.player.attributes.dexterity = 20;
  cases.push([capped, "precision_drills", /stat cap/]);
  for (const [state, id, reason] of cases) {
    const after = purchaseUpgrade(state, { id });
    const feedback = createUpgradeFeedback(state, after, id);
    assert.equal(feedback.title, "No Change");
    assert.match(feedback.messages[0], reason);
    assert.equal(feedback.messages.at(-1), "No resources were spent.");
    assert.deepEqual(after.resources, state.resources);
  }
});

test("wood gathering is reachable through forest discovery, spends stamina, and narrates only once", () => {
  let state = createGameState();
  // This test starts after the opening conversations; their gates have dedicated tests.
  state.unlocks.areas.forest_edge = true;
  state = moveToArea(state, areas.find((area) => area.id === "forest_edge"));
  assert.equal(getAvailableActions(actions, state.player.area, state.unlocks).some((entry) => entry.id === "gather_wood"), false);
  const wrongArea = performAction(state, action("gather_wood"));
  assert.deepEqual(wrongArea.resources, state.resources);
  for (let i = 0; i < 3; i++) state = performAction(state, action("explore_forest_edge"));
  assert.equal(state.unlocks.areas.forest_trail, true);
  state = moveToArea(state, areas.find((area) => area.id === "forest_trail"));
  assert.ok(getAvailableActions(actions, state.player.area, state.unlocks).some((entry) => entry.id === "gather_wood"));
  const before = structuredClone(state);
  const first = performAction(state, action("gather_wood"));
  assert.deepEqual(state, before);
  assert.equal(first.resources.wood.amount, 3);
  assert.equal(first.resources.wood.discovered, true);
  assert.equal(first.player.stamina, state.player.stamina - 2);
  const second = performAction(first, action("gather_wood"));
  assert.equal(second.resources.wood.amount, 6);
  assert.equal(second.storyLog.filter((message) => message === action("gather_wood").storyOnFirstUse).length, 1);
  const exhausted = performAction(second, action("gather_wood"));
  assert.deepEqual(exhausted.resources, second.resources);
  assert.equal(exhausted.progress.actionCounts.gather_wood, 2);
  const reloaded = migrateSaveRecord({ version: 9, state: second });
  assert.deepEqual(reloaded.resources.wood, second.resources.wood);
  reloaded.player.stamina = 2;
  const again = performAction(reloaded, action("gather_wood"));
  assert.equal(again.storyLog.filter((message) => message === action("gather_wood").storyOnFirstUse).length, 1);
});

test("older saves receive an empty wood resource and the gathering action without free materials", () => {
  const old = prepared();
  delete old.resources.wood;
  delete old.unlocks.actions.gather_wood;
  const migrated = migrateSaveRecord({ version: 9, state: old });
  assert.deepEqual(migrated.resources.wood, { label: "Wood", amount: 0, discovered: false });
  assert.equal(migrated.unlocks.actions.gather_wood, true);
  assert.deepEqual(migrated.upgrades, old.upgrades);
});
