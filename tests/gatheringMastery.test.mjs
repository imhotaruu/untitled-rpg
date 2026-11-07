import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { actions } = await import("../src/data/actions.js");
const { createGameState } = await import("../src/engine/createGameState.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { getGatheringProgress, getGatheringLevel, getActionResourceRewards, hasGatheringMastery, normalizeGatheringMastery } = await import("../src/engine/gatheringSystem.js");
const { migrateSaveRecord, CURRENT_SAVE_VERSION } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { createGatheringFeedback, masteryDiscoveryMessage } = await import("../src/utils/gatheringFeedback.js");
const { firstGatheringMasteryEvent } = await import("../src/data/storyEvents.js");
const { processStoryEvents } = await import("../src/engine/storySystem.js");
const { getCompletedMilestones } = await import("../src/engine/selectors.js");
const action = (id) => actions.find((entry) => entry.id === id);

function ready(id = "gather_wood") {
  const state = createGameState();
  state.player.area = action(id).area;
  state.unlocks.actions[id] = true;
  state.unlocks.areas[state.player.area] = true;
  return state;
}

test("the first successful gather unlocks Mastery at level zero with 1/100 XP and discovery feedback", () => {
  for (const id of ["explore_forest_edge", "forage_carefully", "gather_wood"]) {
    const before = ready(id);
    const resource = id === "gather_wood" ? "wood" : "herbs";
    before.resources[resource].discovered = true;
    assert.equal(hasGatheringMastery(before), false);
    const after = performAction(before, action(id));
    assert.equal(hasGatheringMastery(after), true);
    assert.equal(getGatheringLevel(after, resource), 0);
    assert.equal(getGatheringProgress(after, resource).xp, 1);
    assert.equal(getGatheringProgress(after, resource).xpRequired, 100);
    const feedback = createGatheringFeedback(before, after, action(id));
    assert.equal(feedback.title, "Mastery Discovered");
    assert.ok(feedback.messages.includes(masteryDiscoveryMessage));
    assert.ok(feedback.messages.includes("Unlocked Character → Mastery."));
    const second = performAction(after, action(id));
    assert.equal(createGatheringFeedback(after, second, action(id)), null);
    assert.equal(second.actionLog.filter((entry) => entry.message === "Unlocked Character → Mastery.").length, 1);
  }
});

test("all five levels require exponentially increasing successful effort", () => {
  let state = ready();
  let clicks = 0;
  for (const [level, requirement] of [100, 200, 400, 800, 1600].entries()) {
    assert.equal(getGatheringProgress(state, "wood").xpRequired, requirement);
    for (let xp = 0; xp < requirement; xp++) {
      state.player.stamina = 2;
      state = performAction(state, action("gather_wood"));
      clicks++;
      assert.equal(getGatheringLevel(state, "wood"), xp === requirement - 1 ? level + 1 : level);
    }
    assert.equal(getGatheringProgress(state, "wood").xp, 0);
  }
  assert.equal(clicks, 3100);
  assert.equal(getGatheringProgress(state, "wood").maxed, true);
  assert.equal(getGatheringProgress(state, "wood").xpRequired, null);
  state.player.stamina = 2;
  const after = performAction(state, action("gather_wood"), { criticalRolls: { wood: 0 } });
  assert.equal(after.resources.wood.amount - state.resources.wood.amount, 16);
  assert.deepEqual(after.gatheringMastery, state.gatheringMastery);
  assert.equal(createGatheringFeedback(state, after, action("gather_wood")).title, "Critical Gather");
});

test("threshold crossings use the old level for this harvest and the new level for the next", () => {
  const before = ready();
  before.gatheringMastery.levels.wood = 2;
  before.gatheringMastery.xp.wood = 399;
  const after = performAction(before, action("gather_wood"));
  assert.equal(after.resources.wood.amount, 5);
  assert.equal(getGatheringLevel(after, "wood"), 3);
  assert.equal(getGatheringProgress(after, "wood").xp, 0);
  assert.equal(getGatheringProgress(after, "wood").xpRequired, 800);
  assert.deepEqual(getActionResourceRewards(after, action("gather_wood")), { wood: 6 });
  const feedback = createGatheringFeedback(before, after, action("gather_wood"));
  assert.equal(feedback.title, "Mastery Increased");
  assert.match(feedback.messages[0], /Level 3.*\+3 Wood/);
  assert.match(feedback.messages[1], /next gather/);
});

test("critical rolls double the whole yield at a 10 percent boundary without changing XP", () => {
  const before = ready();
  before.gatheringMastery.levels.wood = 2;
  const original = structuredClone(before);
  for (const [roll, expected] of [[0, 10], [0.099999, 10], [0.1, 5], [0.9, 5], [-1, 5], [NaN, 5], [Infinity, 5], [undefined, 5], ["0.01", 5]]) {
    const after = performAction(before, action("gather_wood"), { criticalRolls: { wood: roll } });
    assert.equal(after.resources.wood.amount, expected);
    assert.equal(getGatheringProgress(after, "wood").xp, 1);
    assert.equal(getGatheringLevel(after, "wood"), 2);
    assert.equal(after.player.stamina, before.player.stamina - 2);
    const feedback = createGatheringFeedback(before, after, action("gather_wood"));
    if (expected === 10) {
      assert.equal(feedback.title, "Critical Gather");
      assert.match(feedback.messages[0], /\+10 Wood.*×2/);
      assert.ok(after.actionLog.some((entry) => entry.message?.includes("Critical gather! Gathered 10 Wood")));
    } else assert.equal(feedback, null);
  }
  assert.deepEqual(before, original);
  const options = { criticalRolls: { wood: 0.05 } };
  assert.deepEqual(performAction(before, action("gather_wood"), options), performAction(before, action("gather_wood"), options));
});

test("a critical gather at a level threshold combines accurate feedback and does not double the new bonus", () => {
  const before = ready();
  before.gatheringMastery.xp.wood = 99;
  const after = performAction(before, action("gather_wood"), { criticalRolls: { wood: 0 } });
  assert.equal(after.resources.wood.amount, 6);
  assert.equal(getGatheringLevel(after, "wood"), 1);
  assert.equal(getGatheringProgress(after, "wood").xp, 0);
  const feedback = createGatheringFeedback(before, after, action("gather_wood"));
  assert.equal(feedback.title, "Mastery Increased");
  assert.match(feedback.messages.at(-1), /\+6 Wood.*×2/);
});

test("Explore and Forage share Herb XP regardless of yield, while Wood progresses separately", () => {
  const before = ready("explore_forest_edge");
  const explored = performAction(before, action("explore_forest_edge"));
  const foraged = performAction(explored, action("forage_carefully"), { criticalRolls: { herbs: 0 } });
  assert.equal(foraged.resources.herbs.amount, 7);
  assert.equal(getGatheringProgress(foraged, "herbs").xp, 2);
  assert.equal(getGatheringProgress(foraged, "wood").started, false);
  foraged.player.area = "forest_trail";
  const wood = performAction(foraged, action("gather_wood"));
  assert.equal(getGatheringProgress(wood, "herbs").xp, 2);
  assert.equal(getGatheringProgress(wood, "wood").xp, 1);
  assert.equal(createGatheringFeedback(foraged, wood, action("gather_wood")).messages.includes("Unlocked Character → Mastery."), false);
});

test("failed, locked, and combat-blocked gathers give neither XP nor critical rewards", () => {
  for (const change of [
    (state) => { state.player.stamina = 1; },
    (state) => { state.player.area = "village_square"; },
    (state) => { state.combat = { status: "active" }; },
    (state) => { state.combat = { status: "victory" }; },
  ]) {
    const state = ready();
    change(state);
    const after = performAction(state, action("gather_wood"), { criticalRolls: { wood: 0 } });
    assert.deepEqual(after.resources, state.resources);
    assert.deepEqual(after.gatheringMastery, state.gatheringMastery);
    assert.equal(createGatheringFeedback(state, after, action("gather_wood")), null);
    assert.equal(hasGatheringMastery(after), false);
  }
  const locked = ready("forage_carefully");
  delete locked.unlocks.actions.forage_carefully;
  const after = performAction(locked, action("forage_carefully"), { criticalRolls: { herbs: 0 } });
  assert.deepEqual(after.gatheringMastery, locked.gatheringMastery);
  assert.deepEqual(after.resources, locked.resources);
});

test("ordinary rewards do not gain gathering XP, mastery bonuses, or critical multipliers", () => {
  const before = ready();
  before.gatheringMastery.levels.wood = 3;
  const reward = { id: "test_reward", area: before.player.area, label: "Reward", rewards: { wood: 2, herbs: 1 } };
  const after = performAction(before, reward, { criticalRolls: { wood: 0, herbs: 0 } });
  assert.equal(after.resources.wood.amount, 2);
  assert.equal(after.resources.herbs.amount, 1);
  assert.deepEqual(after.gatheringMastery, before.gatheringMastery);
  assert.equal(createGatheringFeedback(before, after, reward), null);
});

test("multi-resource gathers award one XP each and independent critical results", () => {
  const before = ready();
  const mixed = { ...action("gather_wood"), rewards: { wood: 3, herbs: 1 }, gatheringResources: ["wood", "wood", "herbs", "ore"] };
  const after = performAction(before, mixed, { criticalRolls: { wood: 0, herbs: 0.8, ore: 0 } });
  assert.equal(after.resources.wood.amount, 6);
  assert.equal(after.resources.herbs.amount, 1);
  assert.deepEqual(after.gatheringMastery.xp, { herbs: 1, wood: 1 });
  assert.equal(after.resources.ore.amount, 0);
});

test("normalization carries surplus XP, clamps invalid data, and preserves legacy levels", () => {
  assert.deepEqual(normalizeGatheringMastery({ levels: { wood: 3, herbs: 1 } }),
    { levels: { wood: 3, herbs: 1 }, xp: { wood: 0, herbs: 0 } });
  assert.deepEqual(normalizeGatheringMastery({ levels: {}, xp: { herbs: 350, wood: 99 } }),
    { levels: { herbs: 2, wood: 0 }, xp: { herbs: 50, wood: 99 } });
  for (const value of [null, [], "bad", { levels: { herbs: -1 }, xp: { herbs: Infinity, wood: "5" } }]) {
    assert.deepEqual(normalizeGatheringMastery(value), { levels: { herbs: 0, wood: 0 }, xp: { herbs: 0, wood: 0 } });
  }
  assert.deepEqual(normalizeGatheringMastery({ levels: { herbs: 99 }, xp: { herbs: 999, wood: 3100 } }),
    { levels: { herbs: 5, wood: 5 }, xp: { herbs: 0, wood: 0 } });
});

test("old saves preserve earned levels, materials, and completed story without inventing past XP", () => {
  const old = ready();
  old.gatheringMastery = { levels: { herbs: 2, wood: 1 } };
  old.progress.actionCounts.gather_wood = 100;
  old.resources.wood.amount = 300;
  old.completedStoryEvents.push(firstGatheringMasteryEvent.id);
  const loaded = migrateSaveRecord({ version: 10, state: old });
  assert.deepEqual(loaded.gatheringMastery, { levels: { herbs: 2, wood: 1 }, xp: { herbs: 0, wood: 0 } });
  assert.equal(loaded.resources.wood.amount, 300);
  assert.deepEqual(loaded.storyLog, old.storyLog);
  assert.deepEqual(migrateSaveRecord({ version: 11, state: loaded }), loaded);
  delete old.gatheringMastery;
  const noProgress = migrateSaveRecord({ version: 9, state: old });
  assert.equal(hasGatheringMastery(noProgress), false);
});

test("save/load retains partial XP and current level without restoring notifications", (t) => {
  const storage = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  const before = ready();
  before.gatheringMastery.levels.herbs = 2;
  before.gatheringMastery.xp.herbs = 147;
  const state = performAction(before, action("gather_wood"));
  saveGameToSlot(1, state);
  assert.equal(CURRENT_SAVE_VERSION, 18);
  assert.equal(JSON.parse(storage.get("new-untitled-game-save-slot-1")).version, 18);
  const loaded = loadGameFromSlot(1);
  assert.deepEqual(loaded.gatheringMastery, { levels: { herbs: 2, wood: 0 }, xp: { herbs: 147, wood: 1 } });
  assert.equal(Object.hasOwn(loaded, "itemFeedback"), false);
  assert.equal(createGatheringFeedback(state, loaded), null);
  assert.ok(getCompletedMilestones(loaded).some((milestone) => milestone.id === firstGatheringMasteryEvent.id));
  const options = { criticalRolls: { wood: 0.5 } };
  assert.deepEqual(performAction(loaded, action("gather_wood"), options), performAction(state, action("gather_wood"), options));
});

test("first XP creates the latest discovery story beat once without waiting for a level", () => {
  const first = performAction(ready("explore_forest_edge"), action("explore_forest_edge"));
  assert.equal(first.storyLog[0], firstGatheringMasteryEvent.text);
  assert.equal(getGatheringLevel(first, "herbs"), 0);
  assert.ok(first.completedStoryEvents.includes("first_herb_discovery"));
  const second = performAction(first, action("explore_forest_edge"));
  second.player.area = "forest_trail";
  const other = performAction(second, action("gather_wood"));
  assert.equal(other.storyLog.filter((text) => text === firstGatheringMasteryEvent.text).length, 1);
  assert.deepEqual(getCompletedMilestones(other).map(({ title }) => title), ["Learning by Doing"]);
});

test("milestones survive bounded history and existing progressed saves get the beat once", () => {
  const old = ready();
  old.gatheringMastery.levels.wood = 3;
  const loaded = migrateSaveRecord({ version: 10, state: old });
  assert.equal(loaded.storyLog[0], firstGatheringMasteryEvent.text);
  assert.deepEqual(migrateSaveRecord({ version: 11, state: loaded }), loaded);
  processStoryEvents(loaded, Array.from({ length: 55 }, (_, index) => ({
    id: "later_story_" + index, condition: () => true, text: "Later passage " + index,
  })));
  const reloaded = migrateSaveRecord({ version: 11, state: loaded });
  assert.equal(reloaded.storyLog.length, 50);
  assert.equal(reloaded.storyLog.includes(firstGatheringMasteryEvent.text), false);
  assert.equal(getCompletedMilestones(reloaded).filter((milestone) => milestone.id === firstGatheringMasteryEvent.id).length, 1);
});

test("Basic Guard's existing completion trace still resolves to Codex metadata", () => {
  let state = ready("train_with_garron");
  state = performAction(state, action("train_with_garron"));
  for (let i = 0; i < 5; i++) state = performAction(state, action("practice_with_garron"));
  assert.deepEqual(getCompletedMilestones(state).map(({ id, title }) => ({ id, title })),
    [{ id: "basic_guard", title: "A Steadier Stance" }]);
});
