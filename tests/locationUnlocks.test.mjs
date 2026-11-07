import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";
const { createGameState, createNewJourney } = await import("../src/engine/createGameState.js");
const { actions } = await import("../src/data/actions.js");
const { areas } = await import("../src/data/areas.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { performConversationAction, finishConversation } = await import("../src/engine/conversationSystem.js");
const { moveToArea } = await import("../src/engine/areaSystem.js");
const { resolveExplorationEncounter } = await import("../src/engine/explorationSystem.js");
const { processUnlocks } = await import("../src/engine/unlockSystem.js");
const { getKnownLocationGroups, getLocationState, meetsLocationRequirement, processLocationUnlocks } = await import("../src/engine/locationSystem.js");
const { migrateSaveState } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { processGameTick } = await import("../src/engine/tickSystem.js");
const action = (id) => actions.find((entry) => entry.id === id);
const trail = areas.find((entry) => entry.id === "forest_trail");
const visible = (state) => getKnownLocationGroups(state).flatMap((group) => group.areas.map((area) => area.id));
const finish = (state) => finishConversation(state, state.conversation?.token);
function rowanPending() {
  let state = createGameState(); state.player.area = "stonefield_house";
  state = finish(performConversationAction(state, action("train_with_garron")));
  state = moveToArea(state, { id: "village_square" });
  return performConversationAction(state, action("meet_rowan"));
}
function explore(state) { return performAction(state, action("explore_forest_edge")); }

test("fresh Chapter 1 starts at home and hides every other location", () => {
  assert.equal(createGameState().player.area, "stonefield_house");
  assert.deepEqual(visible(createGameState()), ["stonefield_house"]);
  assert.deepEqual(visible(migrateSaveState(createGameState())), ["stonefield_house"]);
  assert.deepEqual(visible(createNewJourney()), []);
  assert.equal(getLocationState(createGameState(), "forest_trail").knowledge, "unknown");
});

test("Rowan's hint is learned only after finishing dialogue and never grants travel or wood", () => {
  const pending = rowanPending();
  const snapshot = structuredClone(pending);
  assert.ok(!visible(pending).includes(trail.id));
  assert.ok(!visible(migrateSaveState(pending)).includes(trail.id));
  const state = finish(pending);
  assert.deepEqual(pending, snapshot);
  assert.equal(getLocationState(state, trail.id).knowledge, "heard");
  assert.equal(getLocationState(state, trail.id).canTravel, false);
  assert.match(getLocationState(state, trail.id).reason, /Rowan/);
  assert.ok(visible(state).includes(trail.id));
  assert.equal(moveToArea(state, trail), state);
  assert.equal(state.resources.wood.amount, 0);
  assert.ok(state.journal.entries.some((entry) => entry.id === "note:rowan_wood"));
  assert.equal(finishConversation(state, pending.conversation.token), state);
});

test("family lessons and Rowan reveal the opening locations only after their conversations finish", () => {
  let state = createGameState();
  for (const id of ["village_square", "healers_hut", "forest_edge"]) {
    assert.equal(moveToArea(state, { id }), state);
  }
  const failed = structuredClone(state); failed.player.stamina = 0;
  assert.deepEqual(visible(performConversationAction(failed, action("train_with_garron"))), ["stonefield_house"]);
  state = performConversationAction(state, action("train_with_garron"));
  assert.deepEqual(visible(state), ["stonefield_house"]);
  assert.deepEqual(visible(migrateSaveState(state)), ["stonefield_house"]);
  state = finish(state);
  assert.deepEqual(visible(state), ["stonefield_house", "village_square", "healers_hut"]);
  state = moveToArea(state, { id: "healers_hut" });
  state = finish(performConversationAction(state, action("visit_healer")));
  assert.equal(getLocationState(state, "forest_edge").knowledge, "unknown", "Elira is a visit, not an exploration gate");
  state = moveToArea(state, { id: "village_square" });
  state = performConversationAction(state, action("meet_rowan"));
  assert.equal(getLocationState(migrateSaveState(state), "forest_edge").knowledge, "unknown");
  state = finish(state);
  assert.equal(getLocationState(state, "forest_edge").canTravel, true);
  assert.equal(getLocationState(state, "forest_trail").knowledge, "heard");
});

test("rest restores only stamina and finishes even when wounded; Elira restores HP without restoring stamina", () => {
  let state = createGameState();
  state.player.hp = 3; state.player.stamina = 7; state.player.hpRegen = 10;
  state = performAction(state, action("rest_home"));
  assert.equal(state.player.isResting, true);
  state = processGameTick(state, 10);
  assert.equal(state.player.stamina, state.player.maxStamina);
  assert.equal(state.player.hp, 3);
  assert.equal(state.player.isResting, false);
  assert.equal(performAction(state, action("rest_home")).player.isResting, false);
  state.unlocks.areas.healers_hut = true;
  state = moveToArea(state, { id: "healers_hut" });
  state.player.stamina = 2;
  state = finish(performConversationAction(state, action("visit_healer")));
  assert.equal(state.player.hp, 5);
  assert.equal(state.player.stamina, 2);
  state.player.hp = 9;
  state = finish(performConversationAction(state, action("visit_healer")));
  assert.equal(state.player.hp, 10);
});

test("pre-progression saves retain their previously open village and forest locations", () => {
  const state = createGameState();
  state.unlocks.areas = { stonefield_house: true, village_square: true, healers_hut: true, forest_edge: true };
  assert.deepEqual(visible(migrateSaveState(state)), ["stonefield_house", "village_square", "healers_hut", "forest_edge"]);
});

test("exploration discovers a route with or without the hint; foraging and failed actions do not count", () => {
  const legacy = createGameState(); legacy.unlocks.areas.forest_edge = true;
  for (const start of [legacy, finish(rowanPending())]) {
    let state = moveToArea(start, { id: "forest_edge" });
    state.player.stamina = 0;
    state = explore(state);
    assert.notEqual(getLocationState(state, trail.id).knowledge, "discovered");
    state.player.stamina = 8;
    state = explore(state);
    state = performAction(state, action("forage_carefully"));
    state = explore(state);
    assert.equal(state.progress.actionCounts.explore_forest_edge, 2);
    assert.equal(getLocationState(state, trail.id).canTravel, false);
    state = explore(state);
    assert.equal(getLocationState(state, trail.id).canTravel, true);
    assert.equal(state.unlocks.completedRules.filter((id) => id === "unlock_forest_trail").length, 1);
    const logs = structuredClone(state.actionLog);
    processUnlocks(state);
    assert.deepEqual(state.actionLog, logs);
    assert.equal(moveToArea(state, trail).player.area, trail.id);
  }
});

test("hearing the clue after discovering the trail cannot downgrade the route", () => {
  const pending = rowanPending(); pending.unlocks.areas.forest_trail = true;
  const state = finish(pending);
  assert.equal(getLocationState(state, trail.id).knowledge, "discovered");
  assert.equal(getLocationState(state, trail.id).canTravel, true);
});

test("discovering the trail during an encounter keeps travel blocked until the response finishes, including after loading", () => {
  let state = moveToArea(finish(rowanPending()), { id: "forest_edge" });
  state = explore(explore(state));
  state = performAction(state, action("explore_forest_edge"), { encounterRoll: 0 });
  assert.ok(state.exploration.pending);
  assert.equal(getLocationState(state, trail.id).knowledge, "discovered");
  assert.equal(getLocationState(state, trail.id).canTravel, false);
  state = migrateSaveState(state);
  assert.equal(moveToArea(state, trail), state);
  state = resolveExplorationEncounter(state, state.exploration.pending.token, "leave");
  assert.equal(state.exploration.pending, null);
  assert.equal(getLocationState(state, trail.id).canTravel, true);
  assert.equal(moveToArea(state, trail).player.area, trail.id);
});

test("travel rejects hidden, unknown, blocked and duplicate destinations without touching rest, logs or visits", () => {
  const state = createGameState(); state.player.isResting = true;
  for (const destination of [trail, { id: "invented" }, null, { id: state.player.area }]) {
    assert.equal(moveToArea(state, destination), state);
  }
  for (const blocked of [createNewJourney(), { ...state, combat: {} }, { ...state, conversation: {} },
    { ...state, exploration: { pending: {} } }]) {
    assert.equal(moveToArea(blocked, { id: "forest_edge" }), blocked);
    assert.equal(getLocationState(blocked, "forest_edge").canTravel, false);
  }
  state.unlocks.areas.forest_edge = true;
  const next = moveToArea(state, { id: "forest_edge", label: "Injected label", discovered: true });
  assert.equal(next.player.isResting, false);
  assert.equal(state.player.isResting, true);
  assert.ok(next.actionLog.includes("Moved to: Forest Edge"));
  assert.equal(next.progress.areaVisits.forest_edge, 1);
});

test("requirements support exploration, conversations, story, quests, and combined conditions without default passes", () => {
  const state = finish(rowanPending());
  state.progress.actionCounts.explore_forest_edge = 3;
  state.completedStoryEvents.push("test_story");
  state.unlocks.completedActions.bring_rowan_wood = true;
  const conditions = [trail.progression.heardWhen, trail.progression.discoverWhen,
    { type: "story", id: "test_story" }, { type: "quest", id: "rowan_first_craft", status: "available" }];
  assert.equal(meetsLocationRequirement(state, { type: "all", conditions }), true);
  assert.equal(meetsLocationRequirement(state, { type: "any", conditions: [null, conditions[0]] }), true);
  for (const invalid of [null, {}, { type: "all", conditions: [] }, { type: "any", conditions: [] },
    { type: "quest", id: "unknown", status: "locked" }, { type: "action", id: "missing", count: 0 }]) {
    assert.equal(meetsLocationRequirement(state, invalid), false);
  }
});

test("a discovered route can have a separate access requirement without being forgotten", () => {
  const original = trail.progression;
  try {
    trail.progression = { ...original, accessWhen: { type: "story", id: "test_permission" }, accessHint: "The way is closed." };
    const state = createGameState(); state.unlocks.areas.forest_trail = true;
    assert.equal(getLocationState(state, trail.id).knowledge, "discovered");
    assert.equal(getLocationState(state, trail.id).reason, "The way is closed.");
    assert.equal(moveToArea(state, trail), state);
    state.completedStoryEvents.push("test_permission");
    assert.equal(getLocationState(state, trail.id).canTravel, true);
    assert.equal(moveToArea(state, trail).player.area, trail.id);
  } finally { trail.progression = original; }
});

test("older saves preserve routes proven by flags, visits, current location, rules, or exploration progress", () => {
  for (const setEvidence of [
    (s) => { s.unlocks.areas.forest_trail = true; },
    (s) => { s.progress.areaVisits.forest_trail = 1; },
    (s) => { s.player.area = "forest_trail"; },
    (s) => { s.unlocks.completedRules.push("unlock_forest_trail"); },
    (s) => { s.progress.actionCounts.explore_forest_edge = 3; },
  ]) {
    const old = createGameState(); delete old.unlocks.heardAreas;
    setEvidence(old);
    const snapshot = structuredClone(old);
    const loaded = migrateSaveState(old);
    assert.deepEqual(old, snapshot);
    assert.equal(getLocationState(loaded, trail.id).canTravel, true);
    assert.deepEqual(loaded.progress, old.progress);
    assert.deepEqual(loaded.actionLog, old.actionLog, "migration does not replay discoveries");
    assert.deepEqual(migrateSaveState(loaded), loaded);
  }
});

test("old conversation knowledge recovers without inventing a route or leaking pending dialogue", () => {
  const old = finish(rowanPending()); delete old.journal; delete old.unlocks.heardAreas;
  const loaded = migrateSaveState(old);
  assert.equal(getLocationState(loaded, trail.id).knowledge, "heard");
  assert.equal(getLocationState(loaded, trail.id).canTravel, false);
  const pending = rowanPending(); delete pending.journal; delete pending.unlocks.heardAreas;
  assert.equal(getLocationState(migrateSaveState(pending), trail.id).knowledge, "unknown");
});

test("normalization discards unknown IDs and invalid flags, and repairs an unknown current location", () => {
  const state = createGameState(); state.player.area = "removed_place";
  state.unlocks.areas = { invented: true, forest_trail: "false" };
  state.unlocks.heardAreas = { invented: true, forest_trail: 1 };
  const loaded = migrateSaveState(state);
  assert.equal(loaded.player.area, "stonefield_house");
  assert.equal(getLocationState(loaded, trail.id).knowledge, "unknown");
  assert.equal(loaded.unlocks.areas.invented, undefined);
  assert.deepEqual(loaded.unlocks.heardAreas, {});
  const prologue = createNewJourney();
  prologue.unlocks.heardAreas.forest_trail = true;
  prologue.unlocks.areas.forest_trail = true;
  const clean = migrateSaveState(prologue);
  assert.equal(clean.unlocks.areas.forest_trail, undefined);
  assert.deepEqual(clean.unlocks.heardAreas, {});
  processLocationUnlocks(clean);
  assert.deepEqual(visible(clean), []);
});

test("heard and discovered states survive separate save slots without sharing progress", () => {
  const previousStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try {
    const heard = finish(rowanPending());
    const discovered = structuredClone(heard); discovered.unlocks.areas.forest_trail = true;
    saveGameToSlot(1, heard); saveGameToSlot(2, discovered);
    assert.equal(getLocationState(loadGameFromSlot(1), trail.id).knowledge, "heard");
    assert.equal(getLocationState(loadGameFromSlot(2), trail.id).knowledge, "discovered");
    assert.equal(JSON.parse(values.get("new-untitled-game-save-slot-1")).version, 18);
  } finally { globalThis.localStorage = previousStorage; }
});
