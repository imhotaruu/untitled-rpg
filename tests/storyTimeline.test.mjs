import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { getStoryTimeline } = await import("../src/engine/storyTimelineSystem.js");
const { createGameState, createNewJourney } = await import("../src/engine/createGameState.js");
const { actions } = await import("../src/data/actions.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { performConversationAction, finishConversation } = await import("../src/engine/conversationSystem.js");
const { moveToArea } = await import("../src/engine/areaSystem.js");
const { craftItem } = await import("../src/engine/craftingSystem.js");
const { migrateSaveState } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { skipPrologue, completeBirthScene, advancePrologue } = await import("../src/engine/prologueSystem.js");
const action = (id) => actions.find((entry) => entry.id === id);
const ids = (state) => getStoryTimeline(state).map((moment) => moment.id);
const open = (state, id) => performConversationAction(state, action(id));
const finish = (state) => finishConversation(state, state.conversation?.token);
const visit = (state, id) => moveToArea(state, { id });
const trained = () => finish(open(createGameState(), "train_with_garron"));
const metRowan = () => finish(open(visit(trained(), "village_square"), "meet_rowan"));

test("fresh chapter shows only its opening and prologue replay; prologue states reveal no adventure", () => {
  assert.deepEqual(ids(createGameState()), ["prologue", "chapter_one_opening"]);
  assert.deepEqual(ids(createNewJourney()), []);
  assert.deepEqual(getStoryTimeline(null), []);
  const skipped = advancePrologue(completeBirthScene(skipPrologue(createNewJourney()), { name: "River", gender: "Unspecified" }), "chapter");
  assert.deepEqual(ids(skipped), ["prologue", "chapter_one_opening"]);
  assert.equal(getStoryTimeline(skipped)[0].replay, true);
  assert.equal(Object.hasOwn(getStoryTimeline(skipped)[0], "completed"), false);
});

test("family and Rowan recaps wait for completed conversations, including pending saves", () => {
  for (const [state, actionId, momentId] of [
    [createGameState(), "train_with_garron", "garron_training"],
    [visit(trained(), "healers_hut"), "visit_healer", "elira_visit"],
    [visit(trained(), "village_square"), "meet_rowan", "meet_rowan"],
  ]) {
    const pending = open(state, actionId);
    assert.ok(pending.conversation);
    assert.ok(!ids(pending).includes(momentId));
    assert.ok(!ids(migrateSaveState(pending)).includes(momentId));
    const completed = finish(pending);
    assert.ok(ids(completed).includes(momentId));
    assert.ok(ids(migrateSaveState(completed)).includes(momentId));
  }
});

test("heard-about locations and unavailable actions cannot reveal discovered-route recaps", () => {
  const state = metRowan();
  assert.equal(state.unlocks.heardAreas.forest_trail, true);
  assert.ok(!ids(state).includes("forest_trail"));
  assert.ok(!ids(state).includes("first_visit_forest_edge"), "opening a route is not a first visit");
  assert.ok(!ids(open(state, "complete_rowan_crafting")).includes("rowan_first_craft"));
  let exploring = visit(state, "forest_edge");
  assert.ok(ids(exploring).includes("first_visit_forest_edge"));
  for (let i = 0; i < 3; i += 1) exploring = performAction(exploring, action("explore_forest_edge"), { encounterRoll: 1 });
  assert.ok(ids(exploring).includes("forest_trail"));
  exploring.unlocks.heardAreas = {};
  assert.ok(ids(exploring).includes("forest_trail"));
});

test("Basic Guard waits for its own milestone dialogue, then survives routine practice", () => {
  let state = trained();
  for (let i = 0; i < 4; i += 1) state = finish(open(state, "practice_with_garron"));
  const pending = open(state, "practice_with_garron");
  assert.ok(pending.conversation.passageIds.includes("garron_guard"));
  assert.ok(!ids(migrateSaveState(pending)).includes("basic_guard"));
  state = finish(pending);
  assert.ok(ids(state).includes("basic_guard"));
  state.player.stamina = 8;
  assert.ok(ids(open(state, "practice_with_garron")).includes("basic_guard"));
});

test("crafting recap appears after turn-in dialogue, not on acceptance or crafting", () => {
  let state = metRowan();
  state.resources.wood.amount = 10;
  let pending = open(state, "bring_rowan_wood");
  assert.ok(!ids(pending).includes("bring_rowan_wood"));
  state = finish(pending);
  assert.ok(ids(state).includes("bring_rowan_wood"));
  state = finish(open(state, "begin_rowan_crafting"));
  assert.ok(!ids(state).includes("rowan_first_craft"));
  state = craftItem(state, "handmade_training_sword");
  assert.ok(!ids(state).includes("rowan_first_craft"));
  pending = open(state, "complete_rowan_crafting");
  assert.ok(pending.conversation);
  assert.ok(!ids(migrateSaveState(pending)).includes("rowan_first_craft"));
  state = finish(pending);
  assert.ok(ids(state).includes("rowan_first_craft"));
  assert.deepEqual(ids(finishConversation(state, pending.conversation.token)), ids(state));
});

test("old saves recover from durable actions, rules, visits and routes without dates or capped logs", () => {
  const state = createGameState();
  delete state.narrative; delete state.journal;
  state.unlocks.completedActions = { train_with_garron: true, meet_rowan: true, bring_rowan_wood: true, complete_rowan_crafting: true };
  state.unlocks.completedRules = ["progress_milestone_basic_guard"];
  state.progress.actionCounts.visit_healer = 2;
  state.progress.areaVisits.forest_edge = 1;
  state.progress.areaVisits.forest_trail = 1;
  state.storyLog = []; state.actionLog = [];
  const recovered = migrateSaveState(state);
  assert.equal(ids(recovered).length, 10);
  assert.deepEqual(ids(migrateSaveState(recovered)), ids(recovered));
  assert.ok(getStoryTimeline(recovered).every((entry) => !Object.hasOwn(entry, "day")));
});

test("reading is pure, read flags do not hide moments, and story order does not follow action order", () => {
  let state = metRowan();
  state = finish(open(visit(state, "healers_hut"), "visit_healer"));
  state.storyLog = []; state.actionLog = [];
  state.journal.entries.forEach((entry) => { entry.read = true; });
  const snapshot = structuredClone(state);
  const visible = ids(state);
  assert.ok(visible.indexOf("elira_visit") < visible.indexOf("meet_rowan"));
  assert.deepEqual(ids(state), visible);
  assert.deepEqual(state, snapshot);
});

test("different save slots keep their own revealed moments", () => {
  const original = globalThis.localStorage;
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  try {
    const state = metRowan();
    saveGameToSlot(1, createGameState());
    saveGameToSlot(2, state);
    assert.deepEqual(ids(loadGameFromSlot(1)), ["prologue", "chapter_one_opening"]);
    assert.deepEqual(ids(loadGameFromSlot(2)), ids(state));
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = original;
  }
});
