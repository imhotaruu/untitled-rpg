import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState, createNewJourney } = await import("../src/engine/createGameState.js");
const { actions } = await import("../src/data/actions.js");
const { areas } = await import("../src/data/areas.js");
const { upgrades } = await import("../src/data/upgrades.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { performConversationAction, getPendingConversation, finishConversation, normalizeConversation } = await import("../src/engine/conversationSystem.js");
const { moveToArea } = await import("../src/engine/areaSystem.js");
const { processGameTick } = await import("../src/engine/tickSystem.js");
const { startCombat } = await import("../src/engine/combatSystem.js");
const { craftItem, getCraftingBlockReason } = await import("../src/engine/craftingSystem.js");
const { getQuestStatus } = await import("../src/engine/questSystem.js");
const { equipItem, unequipSlot } = await import("../src/engine/equipmentSystem.js");
const { consumeInventoryItem } = await import("../src/engine/itemSystem.js");
const { purchaseUpgrade } = await import("../src/engine/upgradeSystem.js");
const { migrateSaveState, migrateSaveRecord } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot, getSaveSlotSummaries } = await import("../src/engine/saveSystem.js");

const action = (id) => actions.find((entry) => entry.id === id);
const open = (state, id) => performConversationAction(state, action(id));
const finish = (state) => finishConversation(state, state.conversation?.token);
const run = (state, id) => finish(open(state, id));
function home() {
  const state = createGameState();
  state.player.area = "stonefield_house";
  state.player.name = "Aster";
  return state;
}
function trained() { return run(home(), "train_with_garron"); }
function rowanReady() {
  const state = trained();
  state.player.area = "village_square";
  state.resources.wood.amount = 10;
  return state;
}
function lessonReady() {
  return run(run(rowanReady(), "meet_rowan"), "bring_rowan_wood");
}

test("Garron's first lesson has named speakers and preserves the original action outcome", () => {
  const before = home();
  const snapshot = structuredClone(before);
  const original = performAction(before, action("train_with_garron"));
  const state = open(before, "train_with_garron");
  assert.deepEqual(before, snapshot);
  assert.equal(state.player.stamina, before.player.stamina - 1);
  assert.deepEqual(state.inventory, original.inventory);
  assert.deepEqual(state.storyLog, before.storyLog, "recap is held until the conversation ends");
  const dialogue = getPendingConversation(state);
  assert.equal(dialogue.person.role, "Your father");
  assert.deepEqual(new Set(dialogue.beats.map((beat) => beat.speaker)), new Set(["Narration", "Garron", "Aster"]));
  const finished = finish(state);
  assert.deepEqual({ ...finished, journal: original.journal }, original, "dialogue only adds a journal note to the settled action");
  assert.ok(finished.journal.entries.some((entry) => entry.id === "note:garron_footing"));
});

test("repeated action and completion inputs cannot repeat costs or rewards", () => {
  const state = open(home(), "train_with_garron");
  assert.equal(open(state, "train_with_garron"), state);
  assert.equal(performAction(state, action("train_with_garron")), state);
  assert.equal(finishConversation(state, state.conversation.token + 1), state);
  const done = finish(state);
  assert.equal(finishConversation(done, state.conversation.token), done);
  const repeated = open(done, "train_with_garron");
  assert.equal(repeated.conversation, null);
  assert.deepEqual(repeated.inventory, done.inventory);
  assert.deepEqual(repeated.resources, done.resources);
  assert.deepEqual(repeated.progress, done.progress);
});

test("practice dialogue occurs on the first form and Basic Guard milestone, not every click", () => {
  let state = trained();
  for (let count = 1; count <= 6; count++) {
    state.player.stamina = state.player.maxStamina;
    state = open(state, "practice_with_garron");
    if (count === 1) assert.deepEqual(state.conversation.passageIds, ["garron_practice"]);
    else if (count === 5) assert.deepEqual(state.conversation.passageIds, ["garron_guard"]);
    else assert.equal(state.conversation, null);
    state = finish(state);
    assert.equal(state.progress.combatTraining, count);
  }
  assert.equal(state.unlocks.systems.basic_guard, true);
  const armor = open(state, "collect_training_armor");
  assert.deepEqual(armor.conversation.passageIds, ["garron_armor"]);
  assert.deepEqual(finish(armor), performAction(state, action("collect_training_armor")));
});

test("Elira acknowledges healthy visits and heals only the existing amount on wounded visits", () => {
  const before = home();
  before.player.area = "healers_hut";
  let state = open(before, "visit_healer");
  assert.deepEqual(state.conversation.passageIds, ["elira_visit", "elira_well"]);
  assert.equal(state.player.hp, state.player.maxHp);
  assert.equal(getPendingConversation(state).person.role, "Your mother");
  state = finish(state);
  state.player.hp -= 1;
  const wounded = open(state, "visit_healer");
  assert.deepEqual(wounded.conversation.passageIds, ["elira_care"]);
  assert.equal(wounded.player.hp, wounded.player.maxHp);
  state = finish(wounded);
  state.player.hp -= 5;
  assert.equal(open(state, "visit_healer").player.hp, state.player.hp + 2);
  const freshWounded = structuredClone(before);
  freshWounded.player.hp -= 3;
  assert.deepEqual(open(freshWounded, "visit_healer").conversation.passageIds, ["elira_visit", "elira_care"]);
});

test("Rowan's introduction, favor, acceptance, and completion keep costs and quest rewards unchanged", () => {
  let state = rowanReady();
  for (const id of ["meet_rowan", "bring_rowan_wood", "begin_rowan_crafting"]) {
    const original = performAction(state, action(id));
    const pending = open(state, id);
    assert.equal(getPendingConversation(pending).person.name, "Rowan");
    state = finish(pending);
    assert.deepEqual({ ...state, journal: original.journal }, original, "journal notes do not change action outcomes");
  }
  assert.equal(state.resources.wood.amount, 4);
  assert.equal(state.resources.cloth.amount, 1);
  assert.equal(getQuestStatus(state, "rowan_first_craft"), "active");
  state = craftItem(state, "handmade_training_sword");
  assert.equal(getQuestStatus(state, "rowan_first_craft"), "ready");
  const pending = open(state, "complete_rowan_crafting");
  assert.deepEqual(pending.conversation.passageIds, ["rowan_finished"]);
  const done = finish(pending);
  assert.deepEqual(done, performAction(state, action("complete_rowan_crafting")));
  assert.equal(getQuestStatus(done, "rowan_first_craft"), "completed");
  assert.equal(done.resources.gold.amount, 10);
  assert.equal(open(done, "complete_rowan_crafting").resources.gold.amount, 10);
});

test("unavailable or unaffordable actions never open a conversation", () => {
  assert.equal(open(createNewJourney(), "train_with_garron").conversation, null);
  const tired = home();
  tired.player.stamina = 0;
  assert.equal(open(tired, "train_with_garron").conversation, null);
  assert.equal(open(home(), "meet_rowan").conversation, null);
  const poor = run(rowanReady(), "meet_rowan");
  poor.resources.wood.amount = 5;
  const after = open(poor, "bring_rowan_wood");
  assert.equal(after.conversation, null);
  assert.deepEqual(after.resources, poor.resources);
  assert.equal(performConversationAction(poor, { id: "unknown" }), poor);
});

test("non-conversation actions retain their original behavior", () => {
  const state = home();
  state.player.hp -= 1;
  assert.deepEqual(open(state, "rest_home"), performAction(state, action("rest_home")));
  state.player.area = "village_square";
  assert.deepEqual(open(state, "talk_village_square"), performAction(state, action("talk_village_square")));
});

test("conversation blocks gameplay mutations and recovery until reading ends", () => {
  const state = open(lessonReady(), "begin_rowan_crafting");
  assert.equal(open(state, "talk_village_square"), state);
  assert.equal(moveToArea(state, areas.find((area) => area.id === "stonefield_house")), state);
  state.player.isResting = true;
  state.player.hp = 1;
  assert.equal(processGameTick(state, 100), state);
  assert.equal(startCombat(state, "garron_spar"), state);
  assert.equal(craftItem(state, "handmade_training_sword"), state);
  assert.match(getCraftingBlockReason(state, "handmade_training_sword"), /conversation/);
  assert.equal(equipItem(state, "training_stick"), state);
  assert.equal(unequipSlot(state, "weapon"), state);
  assert.equal(consumeInventoryItem(state, "simple_poultice"), state);
  assert.equal(purchaseUpgrade(state, upgrades[0]), state);
});

test("saving and resuming each character's conversation preserves settled rewards and pending prose", (t) => {
  const storage = new Map();
  const old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  } });
  t.after(() => old ? Object.defineProperty(globalThis, "localStorage", old) : delete globalThis.localStorage);
  const healer = home();
  healer.player.area = "healers_hut";
  healer.player.hp -= 3;
  const cases = [open(home(), "train_with_garron"), open(trained(), "practice_with_garron"),
    open(healer, "visit_healer"), open(rowanReady(), "meet_rowan"),
    open(run(rowanReady(), "meet_rowan"), "bring_rowan_wood"), open(lessonReady(), "begin_rowan_crafting")];
  const crafted = craftItem(run(lessonReady(), "begin_rowan_crafting"), "handmade_training_sword");
  cases.push(open(crafted, "complete_rowan_crafting"));
  for (const state of cases) {
    saveGameToSlot(1, state);
    const loaded = loadGameFromSlot(1);
    assert.deepEqual(loaded.conversation, state.conversation);
    assert.deepEqual(getPendingConversation(loaded).beats, getPendingConversation(state).beats);
    assert.deepEqual(loaded.inventory, state.inventory);
    assert.deepEqual(loaded.resources, state.resources);
    assert.deepEqual(loaded.progress, state.progress);
    assert.match(getSaveSlotSummaries()[0].storyStage, /Conversation/);
    const done = finish(loaded);
    assert.deepEqual(done.storyLog, finish(state).storyLog);
    assert.deepEqual(done.resources, state.resources);
    assert.deepEqual(done.inventory, state.inventory);
    assert.equal(finish(done), done);
  }
});

test("older adventures do not replay already-completed introductions or change rewards", () => {
  const old = performAction(home(), action("train_with_garron"));
  delete old.conversation;
  const migrated = migrateSaveRecord({ version: 15, state: old });
  assert.equal(migrated.conversation, null);
  assert.deepEqual(migrated.inventory, old.inventory);
  assert.deepEqual(migrated.progress, old.progress);
  assert.equal(open(migrated, "train_with_garron").conversation, null);
});

test("malformed or conflicting conversation saves drop safely without charging anything", () => {
  const valid = open(home(), "train_with_garron");
  for (const patch of [
    { token: -1 }, { token: valid.conversation.token + 1 }, { areaId: "healers_hut" },
    { passageIds: ["__proto__"] }, { passageIds: ["elira_well"] }, { passageIds: [] },
    { passageIds: ["garron_training", "garron_training"] }, { storyEntries: [5] },
    { actionId: "unknown" },
  ]) {
    const state = { ...valid, conversation: { ...valid.conversation, ...patch } };
    const normalized = migrateSaveState(state);
    assert.equal(normalized.conversation, null);
    assert.deepEqual(normalized.resources, valid.resources);
    assert.deepEqual(normalized.inventory, valid.inventory);
  }
  assert.equal(normalizeConversation(valid.conversation, { ...valid, combat: {} }), null);
  assert.equal(normalizeConversation(valid.conversation, { ...valid, exploration: { pending: {} } }), null);
  assert.equal(normalizeConversation(valid.conversation, { ...valid, narrative: { phase: "prologue" } }), null);
});

test("deferred story events preserve ordering and the history cap on completion", () => {
  const before = home();
  before.progress.totalActions = 9;
  before.storyLog = Array.from({ length: 50 }, (_, index) => `Older story ${index}`);
  const original = performAction(before, action("train_with_garron"));
  const pending = open(before, "train_with_garron");
  assert.ok(pending.conversation.storyEntries.length >= 2);
  assert.deepEqual(pending.storyLog, before.storyLog);
  const completed = finish(pending);
  assert.equal(completed.storyLog.length, 50);
  assert.deepEqual(completed.storyLog, original.storyLog);
  assert.deepEqual(completed.completedStoryEvents, original.completedStoryEvents);
});
