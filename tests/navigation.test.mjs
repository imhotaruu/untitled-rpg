import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { getAvailablePages } = await import("../src/engine/navigationSystem.js");
const { createGameState } = await import("../src/engine/createGameState.js");
const { performConversationAction, finishConversation } = await import("../src/engine/conversationSystem.js");
const { actions } = await import("../src/data/actions.js");
const { migrateSaveState } = await import("../src/engine/saveMigration.js");
const ids = (state) => getAvailablePages(state).map((page) => page.id);
const initial = ["main", "character", "story"];
const act = (state, id) => performConversationAction(state, actions.find((action) => action.id === id));
const finish = (state) => finishConversation(state, state.conversation?.token);

test("fresh adventures show only Main, Character, and Story, with no unavailable placeholders", () => {
  const state = createGameState();
  assert.deepEqual(ids(state), initial);
  assert.ok(!ids(state).includes("party") && !ids(state).includes("codex"));
});

test("either Garron's lesson or a visit to Elira introduces Relationships", () => {
  for (const [area, action] of [["stonefield_house", "train_with_garron"], ["healers_hut", "visit_healer"]]) {
    const state = createGameState();
    state.player.area = area;
    const pending = act(state, action);
    assert.deepEqual(ids(pending), [...initial, "relationships"]);
    assert.deepEqual(ids(finish(pending)), [...initial, "relationships"]);
  }
});

test("Quests appears when Rowan offers his lesson and Crafting when it is accepted", () => {
  let state = createGameState();
  state.player.area = "stonefield_house";
  state = finish(act(state, "train_with_garron"));
  state.player.area = "village_square";
  state = finish(act(state, "meet_rowan"));
  assert.deepEqual(ids(state), [...initial, "relationships"]);
  state.resources.wood.amount = 6;
  state = finish(act(state, "bring_rowan_wood"));
  assert.deepEqual(ids(state), [...initial, "relationships", "quests"]);
  state = finish(act(state, "begin_rowan_crafting"));
  assert.deepEqual(ids(state), [...initial, "relationships", "quests", "crafting"]);
  assert.deepEqual(ids(migrateSaveState(state)), ids(state));
});

test("failed interactions do not reveal navigation pages", () => {
  const state = createGameState();
  state.player.area = "stonefield_house";
  state.player.stamina = 0;
  assert.deepEqual(ids(act(state, "train_with_garron")), initial);
  assert.deepEqual(ids(act(state, "visit_healer")), initial);
  assert.deepEqual(ids(act(state, "begin_rowan_crafting")), initial);
});

test("existing saves infer visible pages from prior progress without new flags", () => {
  for (const unlock of ["combat_basics", "basic_guard"]) {
    const state = createGameState();
    state.unlocks.systems[unlock] = true;
    assert.ok(ids(migrateSaveState(state)).includes("relationships"));
  }
  const state = createGameState();
  state.unlocks.completedActions.meet_rowan = true;
  assert.deepEqual(ids(migrateSaveState(state)), [...initial, "relationships"]);
  state.unlocks.completedActions.complete_rowan_crafting = true;
  assert.ok(ids(migrateSaveState(state)).includes("quests"));
  state.unlocks.completedActions.begin_rowan_crafting = true;
  assert.ok(ids(migrateSaveState(state)).includes("crafting"));
});

test("loading a fresh save yields the locked-page list again and does not mutate either save", () => {
  const advanced = createGameState();
  advanced.unlocks.completedActions.begin_rowan_crafting = true;
  const snapshot = structuredClone(advanced);
  assert.ok(ids(advanced).includes("crafting"));
  assert.deepEqual(ids(migrateSaveState(createGameState())), initial);
  assert.deepEqual(advanced, snapshot);
});
