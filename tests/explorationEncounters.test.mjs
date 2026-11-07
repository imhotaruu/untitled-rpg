import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState } = await import("../src/engine/createGameState.js");
const { actions } = await import("../src/data/actions.js");
const { areas } = await import("../src/data/areas.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { moveToArea } = await import("../src/engine/areaSystem.js");
const { processGameTick } = await import("../src/engine/tickSystem.js");
const { startCombat } = await import("../src/engine/combatSystem.js");
const { getPendingExploration, resolveExplorationEncounter, normalizeExploration } = await import("../src/engine/explorationSystem.js");
const { migrateSaveRecord, migrateSaveState } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { getCompletedMilestones } = await import("../src/engine/selectors.js");
const action = (id) => actions.find((entry) => entry.id === id);
function ready(area = "forest_edge", sequence = 0) {
  const state = createGameState();
  state.player.area = area;
  state.exploration.sequence = sequence;
  state.unlocks.areas.forest_trail = true;
  return state;
}
const explore = (state, roll = 0.99) => performAction(state, action(state.player.area === "forest_trail" ? "explore_forest_trail" : "explore_forest_edge"), { encounterRoll: roll });
const leave = (state) => resolveExplorationEncounter(state, state.exploration.pending.token, "leave");

test("first successful exploration introduces a common encounter after normal costs, resources, and XP", () => {
  const state = ready();
  const original = structuredClone(state);
  const next = explore(state, 0);
  assert.deepEqual(state, original);
  assert.equal(next.player.stamina, state.player.stamina - 1);
  assert.equal(next.resources.herbs.amount, 1);
  assert.equal(next.gatheringMastery.xp.herbs, 1);
  assert.equal(getPendingExploration(next).id, "sheltered_herbs");
  assert.equal(getPendingExploration(next).rarity, "common");
  assert.equal(next.storyLog[0], getPendingExploration(next).text);
  assert.equal(next.exploration.pending.token, 1);
  assert.deepEqual(next.exploration.discovered, ["sheltered_herbs"]);
  assert.equal(getPendingExploration(explore(ready("forest_trail"))).id, "fallen_bough");
});

test("investigation rewards resolve exactly once and do not grant gathering XP or crit bonuses", () => {
  const state = explore(ready());
  const next = resolveExplorationEncounter(state, 1, "gather");
  assert.equal(next.resources.herbs.amount, state.resources.herbs.amount + 2);
  assert.deepEqual(next.gatheringMastery, state.gatheringMastery);
  assert.equal(next.player.stamina, state.player.stamina);
  assert.equal(next.exploration.pending, null);
  assert.equal(next.exploration.resolved, 1);
  assert.equal(next.exploration.cooldown, 2);
  assert.equal(resolveExplorationEncounter(next, 1, "gather"), next);
  assert.ok(getCompletedMilestones(next).some((entry) => entry.id === "first_exploration_encounter"));
  assert.ok(next.actionLog[0].message.includes("+2 Herbs"));
});

test("leaving is free even at zero stamina, and still resolves the encounter", () => {
  const before = ready();
  before.player.stamina = 1;
  const state = explore(before);
  const next = leave(state);
  assert.equal(next.player.stamina, 0);
  assert.deepEqual(next.resources, state.resources);
  assert.equal(next.exploration.pending, null);
  assert.equal(next.exploration.resolved, 1);
});

test("pending encounters block world actions, travel, ticks, and combat but reject invalid choices", () => {
  const state = explore(ready());
  assert.equal(performAction(state, action("explore_forest_edge"), { encounterRoll: 0 }), state);
  assert.equal(moveToArea(state, areas[0]), state);
  assert.equal(processGameTick(state, 100), state);
  assert.equal(resolveExplorationEncounter(state, 99, "gather"), state);
  assert.equal(resolveExplorationEncounter(state, 1, "invented"), state);
  const atHome = structuredClone(state);
  atHome.player.area = "stonefield_house";
  atHome.unlocks.systems.basic_guard = true;
  assert.equal(startCombat(atHome, "garron_spar", 1), atHome);
  assert.equal(resolveExplorationEncounter(atHome, 1, "gather"), atHome);
});

test("two successful explores are quiet, failed actions and gathering do not advance the cooldown", () => {
  let state = leave(explore(ready()));
  const exhausted = structuredClone(state);
  exhausted.player.stamina = 0;
  assert.equal(explore(exhausted, 0).exploration.cooldown, 2);
  state.player.area = "forest_trail";
  const gathered = performAction(state, action("gather_wood"), { encounterRoll: 0 });
  assert.deepEqual(gathered.exploration, state.exploration);
  state = explore(state, 0);
  assert.equal(state.exploration.cooldown, 1);
  assert.equal(state.exploration.pending, null);
  state = explore(state, 0);
  assert.equal(state.exploration.cooldown, 0);
  assert.equal(state.exploration.pending, null);
  state = explore(state, 0);
  assert.equal(getPendingExploration(state).rarity, "rare");
  assert.equal(state.exploration.pending.token, 2);
  assert.equal(resolveExplorationEncounter(state, 1, "take"), state);
});

test("eligible random draws have separate 5% rare, 20% common, and 75% quiet ranges", () => {
  for (const area of ["forest_edge", "forest_trail"]) {
    for (const [roll, expected] of [[0, "rare"], [0.049999, "rare"], [0.05, "common"], [0.249999, "common"], [0.25, undefined], [0.9999, undefined]]) {
      assert.equal(getPendingExploration(explore(ready(area, 1), roll))?.rarity, expected);
    }
  }
  for (const roll of [NaN, Infinity, -1, 1]) assert.equal(explore(ready(), roll).exploration.pending, null);
});

test("rare cache grants its fixed resources once and records a durable milestone", () => {
  const state = explore(ready("forest_trail", 1), 0.01);
  const next = resolveExplorationEncounter(state, 2, "take");
  assert.equal(next.resources.gold.amount, state.resources.gold.amount + 8);
  assert.equal(next.resources.cloth.amount, 1);
  assert.equal(next.resources.cloth.discovered, true);
  assert.ok(getCompletedMilestones(next).some((entry) => entry.id === "first_rare_encounter"));
  const second = { ...next, exploration: { ...next.exploration, cooldown: 0 } };
  const again = leave(explore(second, 0.01));
  assert.equal(again.completedStoryEvents.filter((id) => id === "first_rare_encounter").length, 1);
  assert.equal(again.resources.gold.amount, next.resources.gold.amount);
  assert.deepEqual(again.exploration.discovered, ["old_trail_cache"]);
});

test("save and load preserve pending choice, token, and rewards without rerolling", () => {
  const storage = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) } });
  try {
    const pending = explore(ready());
    saveGameToSlot(1, pending);
    const loaded = loadGameFromSlot(1);
    assert.deepEqual(loaded.exploration, pending.exploration);
    assert.deepEqual(loaded.storyLog, pending.storyLog);
    const resolved = resolveExplorationEncounter(loaded, 1, "gather");
    saveGameToSlot(1, resolved);
    const reloaded = loadGameFromSlot(1);
    assert.equal(reloaded.exploration.pending, null);
    assert.equal(resolveExplorationEncounter(reloaded, 1, "gather"), reloaded);
    assert.equal(reloaded.resources.herbs.amount, 3);
    assert.deepEqual(migrateSaveState(reloaded), reloaded);
  } finally { if (previous === undefined) delete globalThis.localStorage; else Object.defineProperty(globalThis, "localStorage", previous); }
});

test("old saves start without an encounter and invalid pending data cannot trap the player", () => {
  const old = ready();
  delete old.exploration;
  const migrated = migrateSaveRecord({ version: 11, state: old });
  assert.deepEqual(migrated.exploration, createGameState().exploration);
  assert.deepEqual(migrated.resources, old.resources);
  const valid = explore(ready()).exploration;
  for (const invalid of [null, "bad", { ...valid, pending: { ...valid.pending, id: "fake" } }, { ...valid, pending: { ...valid.pending, token: 9 } }, { ...valid, pending: { ...valid.pending, areaId: "village_square" } }]) {
    assert.equal(normalizeExploration(invalid, "forest_edge").pending, null);
  }
  assert.equal(normalizeExploration(valid, "village_square").pending, null);
  assert.equal(normalizeExploration(valid, "forest_edge", true).pending, null);
  const malformed = normalizeExploration({ cooldown: 500, sequence: -2, resolved: NaN, discovered: ["fake", "sheltered_herbs", "sheltered_herbs"] }, "forest_edge");
  assert.equal(malformed.cooldown, 2);
  assert.equal(malformed.sequence, 0);
  assert.deepEqual(malformed.discovered, ["sheltered_herbs"]);
});

test("unrelated and failed actions cannot create encounters or grant early discoveries", () => {
  const exhausted = ready();
  exhausted.player.stamina = 0;
  assert.deepEqual(explore(exhausted, 0).exploration, exhausted.exploration);
  const wrongArea = ready("village_square");
  assert.deepEqual(performAction(wrongArea, action("explore_forest_edge"), { encounterRoll: 0 }).exploration, wrongArea.exploration);
  const wood = ready("forest_trail");
  assert.deepEqual(performAction(wood, action("gather_wood"), { encounterRoll: 0 }).exploration, wood.exploration);
});
