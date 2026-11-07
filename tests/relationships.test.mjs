import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState } = await import("../src/engine/createGameState.js");
const { actions } = await import("../src/data/actions.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { getRelationshipChart } = await import("../src/engine/relationshipSystem.js");
const { getCompletedMilestones, getAvailableActions } = await import("../src/engine/selectors.js");
const { migrateSaveState } = await import("../src/engine/saveMigration.js");
const { createRelationshipFeedback } = await import("../src/utils/relationshipFeedback.js");
const { startCombat } = await import("../src/engine/combatSystem.js");

const action = (id) => actions.find((entry) => entry.id === id);
function trained() {
  const state = createGameState();
  state.player.area = "stonefield_house";
  return performAction(state, action("train_with_garron"));
}
function introduced() {
  const state = trained();
  state.player.area = "village_square";
  return performAction(state, action("meet_rowan"));
}
const bond = (state, id) => getRelationshipChart(state).connections.find((entry) => entry.id === id);

test("Garron is known as the player's father from the start, while training remains earned", () => {
  const fresh = createGameState();
  fresh.player.name = "Aster";
  assert.deepEqual(getRelationshipChart(fresh).people.map((person) => person.name), ["Aster", "Garron", "Elira"]);
  assert.equal(getRelationshipChart(fresh).people[1].role, "Your father");
  assert.equal(getRelationshipChart(fresh).people[2].role, "Your mother");
  assert.equal(bond(fresh, "player_elira").relationship, "Mother and child");
  assert.equal(bond(fresh, "garron_elira").relationship, "Husband and wife");
  assert.equal(bond(fresh, "garron_elira").label, "Married");
  assert.deepEqual(bond(fresh, "player_elira").moments, []);
  assert.deepEqual(bond(fresh, "garron_elira").moments, []);
  assert.equal(bond(fresh, "player_garron").relationship, "Father and child");
  assert.equal(bond(fresh, "player_garron").label, "Family");
  assert.deepEqual(bond(fresh, "player_garron").moments, []);
  assert.equal(migrateSaveState(fresh).unlocks.actions.meet_rowan, undefined);
  const state = trained();
  assert.deepEqual(getRelationshipChart(state).people.map((person) => person.id), ["player", "garron", "elira"]);
  assert.equal(bond(state, "player_garron").label, "First lessons");
  assert.equal(bond(state, "player_garron").relationship, "Father and child");
  assert.equal(state.unlocks.actions.meet_rowan, true);
  assert.ok(getAvailableActions(actions, "village_square", state.unlocks).some((entry) => entry.id === "meet_rowan"));
});

test("introduction is locked before training, area-bound, and once-only", () => {
  const fresh = createGameState();
  fresh.player.area = "village_square";
  assert.deepEqual(getRelationshipChart(performAction(fresh, action("meet_rowan"))), getRelationshipChart(fresh));
  const home = trained();
  assert.equal(performAction(home, action("meet_rowan")).unlocks.completedActions.meet_rowan, undefined);
  const state = introduced();
  assert.equal(getRelationshipChart(state).connections.length, 5);
  assert.equal(bond(state, "garron_rowan").label, "Training partners");
  assert.equal(state.unlocks.actions.bring_rowan_wood, true);
  const again = performAction(state, action("meet_rowan"));
  assert.equal(again.progress.actionCounts.meet_rowan, 1);
  assert.deepEqual(again.storyLog, state.storyLog);
  assert.equal(getCompletedMilestones(state).filter((entry) => entry.id === "meet_rowan").length, 1);
});

test("wood delivery requires the introduction and full payment, then pays once", () => {
  const locked = trained();
  locked.player.area = "village_square";
  locked.resources.wood.amount = 10;
  assert.deepEqual(performAction(locked, action("bring_rowan_wood")).resources, locked.resources);
  const state = introduced();
  state.resources.wood.amount = 5;
  const failed = performAction(state, action("bring_rowan_wood"));
  assert.deepEqual(failed.resources, state.resources);
  assert.deepEqual(failed.storyLog, state.storyLog);
  assert.equal(failed.unlocks.completedActions.bring_rowan_wood, undefined);
  assert.equal(createRelationshipFeedback(state, failed), null);
  state.resources.wood.amount = 8;
  const before = structuredClone(state);
  const delivered = performAction(state, action("bring_rowan_wood"));
  assert.deepEqual(state, before);
  assert.equal(delivered.resources.wood.amount, 2);
  assert.equal(delivered.resources.gold.amount, state.resources.gold.amount + 5);
  assert.equal(bond(delivered, "player_rowan").label, "A helping hand");
  assert.deepEqual(delivered.gatheringMastery, state.gatheringMastery);
  const repeated = performAction(delivered, action("bring_rowan_wood"));
  assert.deepEqual(repeated.resources, delivered.resources);
  assert.deepEqual(repeated.storyLog, delivered.storyLog);
  assert.equal(repeated.progress.actionCounts.bring_rowan_wood, 1);
  assert.ok(getCompletedMilestones(delivered).some((entry) => entry.id === "bring_rowan_wood"));
});

test("training milestones develop Garron's bond without repeatable relationship farming", () => {
  let state = trained();
  for (let i = 0; i < 5; i++) state = performAction(state, action("practice_with_garron"));
  assert.equal(bond(state, "player_garron").label, "Growing confidence");
  const guarded = state;
  state = performAction(state, action("collect_training_armor"));
  assert.equal(bond(state, "player_garron").label, "Looking out for you");
  assert.equal(createRelationshipFeedback(guarded, state).title, "Bond Updated");
  const before = getRelationshipChart(state);
  state.player.stamina = 8;
  state = performAction(state, action("practice_with_garron"));
  assert.deepEqual(getRelationshipChart(state), before);
  state.player.area = "village_square";
  for (let i = 0; i < 10; i++) state = performAction(state, action("talk_village_square"));
  assert.deepEqual(getRelationshipChart(state), before);
});

test("both new actions are blocked during a battle", () => {
  const state = introduced();
  state.player.area = "stonefield_house";
  state.unlocks.systems.basic_guard = true;
  state.resources.wood.amount = 10;
  const combat = startCombat(state, "garron_spar", 42);
  assert.ok(combat.combat);
  assert.equal(performAction(combat, action("meet_rowan")), combat);
  assert.equal(performAction(combat, action("bring_rowan_wood")), combat);
});

test("old saves recover established bonds without meeting Rowan or replaying old scenes", () => {
  const old = trained();
  delete old.unlocks.completedActions.train_with_garron;
  delete old.unlocks.actions.meet_rowan;
  old.unlocks.completedRules = old.unlocks.completedRules.filter((id) => id !== "unlock_carpenter_introduction");
  const state = migrateSaveState(old);
  assert.deepEqual(getRelationshipChart(state).people.map((person) => person.id), ["player", "garron", "elira"]);
  assert.equal(state.unlocks.actions.meet_rowan, true);
  assert.deepEqual(state.storyLog, old.storyLog);
  assert.deepEqual(state.resources, old.resources);
  assert.deepEqual(migrateSaveState(state), state);
});

test("save round trips and rolled-off story logs preserve bonds and milestones", () => {
  let state = introduced();
  state.resources.wood.amount = 6;
  state = performAction(state, action("bring_rowan_wood"));
  const chart = getRelationshipChart(state);
  const milestones = getCompletedMilestones(state);
  state.storyLog = Array(50).fill("A later story.");
  const loaded = migrateSaveState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(getRelationshipChart(loaded), chart);
  assert.deepEqual(getCompletedMilestones(loaded), milestones);
  assert.deepEqual(performAction(loaded, action("bring_rowan_wood")).resources, loaded.resources);
  assert.equal(bond(createGameState(), "player_garron").label, "Family");
  assert.equal(getRelationshipChart(createGameState()).people.length, 3);
});

test("connection feedback happens only on discovery or a new shared moment", () => {
  const fresh = createGameState();
  const state = trained();
  assert.equal(createRelationshipFeedback(fresh, state).title, "Bond Updated");
  assert.equal(createRelationshipFeedback(state, state), null);
  const met = introduced();
  const feedback = createRelationshipFeedback(state, met);
  assert.equal(feedback.title, "New Connection");
  assert.ok(feedback.messages.some((message) => message.includes("Rowan")));
});
