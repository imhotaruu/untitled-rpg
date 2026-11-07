import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";
const { createGameState, createNewJourney } = await import("../src/engine/createGameState.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { performConversationAction, finishConversation } = await import("../src/engine/conversationSystem.js");
const { resolveExplorationEncounter } = await import("../src/engine/explorationSystem.js");
const { getJournalEntries, normalizeJournal, getUnreadJournalCount, markJournalEntryRead } = await import("../src/engine/journalSystem.js");
const { migrateSaveState } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const { getAvailablePages } = await import("../src/engine/navigationSystem.js");
const { actions } = await import("../src/data/actions.js");
const action = (id) => actions.find((item) => item.id === id);
const open = (state, id) => performConversationAction(state, action(id));
const finish = (state) => finishConversation(state, state.conversation?.token);
const entry = (state, id) => getJournalEntries(state).find((item) => item.id === id);
const forest = () => { const state = createGameState(); state.player.area = "forest_edge"; return state; };
const home = () => { const state = createGameState(); state.player.area = "stonefield_house"; return state; };

test("fresh journeys and failed actions have no notes or Codex unlock", () => {
  for (const state of [createGameState(), createNewJourney()]) {
    assert.deepEqual(getJournalEntries(state), []);
    assert.ok(!getAvailablePages(state).some((page) => page.id === "codex"));
  }
  const state = forest(); state.player.stamina = 0;
  assert.deepEqual(performAction(state, action("explore_forest_edge")).journal.entries, []);
});

test("first harvest records the actual place, day, and action once without mutating the input", () => {
  const before = forest(); before.player.day = "Day 3 · Evening";
  const snapshot = structuredClone(before);
  const state = performAction(before, action("explore_forest_edge"));
  assert.deepEqual(before, snapshot);
  const herbs = entry(state, "resource:herbs");
  assert.equal(herbs.location, "Forest Edge");
  assert.equal(herbs.day, "Day 3 · Evening");
  assert.equal(herbs.sourceId, "explore_forest_edge");
  assert.ok(getAvailablePages(state).some((page) => page.id === "codex"));
  state.player.day = "Day 4 · Morning";
  state.resources.herbs.amount = 0;
  state.storyLog = []; state.actionLog = [];
  const again = performAction(state, action("explore_forest_edge"));
  assert.deepEqual(again.journal, state.journal);
  assert.equal(again.journal.entries.length, 1);
  assert.equal(entry(migrateSaveState(again), "resource:herbs").day, "Day 3 · Evening");
});

test("rare-cache resources record the choice location, while leaving records no acquisition", () => {
  const before = forest(); before.exploration.sequence = 1;
  const pending = performAction(before, action("explore_forest_edge"), { encounterRoll: 0 });
  assert.equal(pending.exploration.pending.id, "old_trail_cache");
  const left = resolveExplorationEncounter(pending, pending.exploration.pending.token, "leave");
  assert.equal(entry(left, "resource:cloth"), undefined);
  const taken = resolveExplorationEncounter(pending, pending.exploration.pending.token, "take");
  assert.equal(entry(taken, "resource:cloth").location, "Forest Edge");
  assert.equal(entry(taken, "resource:cloth").source, "An old trail cache");
  assert.equal(entry(taken, "resource:gold").sourceType, "encounter");
  assert.equal(entry(pending, "resource:cloth"), undefined);
  assert.equal(resolveExplorationEncounter(taken, pending.exploration.pending.token, "take"), taken);
});

test("NPC hints wait for dialogue completion, remain once-only, and do not reveal later lessons", () => {
  const training = open(home(), "train_with_garron");
  assert.equal(training.journal.entries.length, 0);
  const trained = finish(training);
  assert.equal(entry(trained, "note:garron_footing").person, "Garron");
  trained.player.area = "village_square";
  const pending = open(trained, "meet_rowan");
  assert.equal(entry(pending, "note:rowan_wood"), undefined);
  assert.equal(entry(migrateSaveState(pending), "note:rowan_wood"), undefined);
  const state = finish(pending);
  const hint = entry(state, "note:rowan_wood");
  assert.equal(hint.location, "Village Square");
  assert.match(hint.text, /forest trail/);
  assert.equal(state.unlocks.areas.forest_trail, undefined, "a spoken hint is not a map unlock");
  assert.equal(entry(state, "note:rowan_grip"), undefined);
  assert.equal(entry(state, "resource:wood"), undefined, "a mentioned material is not a personal discovery");
  assert.equal(finishConversation(state, pending.conversation.token), state);
});

test("Rowan's supplied cloth is distinct from gathered materials and his recipe note waits for completion", () => {
  let state = finish(open(home(), "train_with_garron"));
  state.player.area = "village_square";
  state = finish(open(state, "meet_rowan"));
  state.resources.wood.amount = 6;
  state = finish(open(state, "bring_rowan_wood"));
  const pending = open(state, "begin_rowan_crafting");
  assert.equal(entry(pending, "resource:cloth").sourceId, "begin_rowan_crafting");
  assert.equal(entry(pending, "resource:cloth").location, "Village Square");
  assert.equal(entry(pending, "note:rowan_grip"), undefined);
  const done = finish(pending);
  assert.ok(entry(done, "note:rowan_grip"));
  assert.deepEqual(done.resources, pending.resources, "recording notes grants no extra reward");
});

test("earlier saves recover known information without inventing first locations or dates", () => {
  let old = finish(open(home(), "train_with_garron"));
  delete old.journal;
  old.resources.herbs = { ...old.resources.herbs, amount: 0, discovered: true };
  const state = migrateSaveState(old);
  assert.equal(entry(state, "resource:herbs").location, null);
  assert.equal(entry(state, "resource:herbs").day, null);
  assert.equal(entry(state, "resource:herbs").sourceType, "memory");
  assert.ok(entry(state, "note:garron_footing"));
  assert.equal(entry(state, "resource:gold"), undefined, "default visible Gold is not an acquisition");
  assert.equal(entry(state, "note:rowan_wood"), undefined);
  assert.deepEqual(migrateSaveState(state).journal, state.journal);
  state.player.area = "forest_edge";
  assert.equal(entry(performAction(state, action("explore_forest_edge")), "resource:herbs").location, null,
    "a new harvest does not impersonate the lost first discovery");
});

test("legacy pending dialogue does not recover the hint before it is finished", () => {
  const old = open(home(), "train_with_garron"); delete old.journal;
  const loaded = migrateSaveState(old);
  assert.equal(entry(loaded, "note:garron_footing"), undefined);
  assert.ok(entry(finish(loaded), "note:garron_footing"));
});

test("journal normalization discards unknown IDs, duplicates, and invalid provenance", () => {
  const state = forest();
  const journal = normalizeJournal({ entries: [null, { id: "secret" }, { id: 2 },
    { id: "resource:herbs", sourceType: "action", sourceId: "gather_wood", areaId: "healers_hut", day: "invented" },
    { id: "resource:herbs", sourceType: "memory" },
  ] }, state);
  assert.equal(journal.entries.length, 1);
  assert.equal(journal.entries[0].areaId, null);
  assert.equal(journal.entries[0].day, null);
  assert.deepEqual(normalizeJournal(journal, createNewJourney()), { entries: [] });
});

test("slot saves preserve journal provenance and pending hints independently", () => {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  try {
    const gathered = performAction(forest(), action("explore_forest_edge"));
    const pending = open(home(), "train_with_garron");
    saveGameToSlot(1, gathered); saveGameToSlot(2, pending);
    assert.equal(JSON.parse(storage.get("new-untitled-game-save-slot-1")).version, 17);
    assert.deepEqual(loadGameFromSlot(1).journal, gathered.journal);
    const loaded = loadGameFromSlot(2);
    assert.equal(loaded.journal.entries.length, 0);
    assert.ok(entry(finish(loaded), "note:garron_footing"));
    assert.deepEqual(loadGameFromSlot(1).journal, gathered.journal);
  } finally { delete globalThis.localStorage; }
});

test("new entries notify navigation; reading only clears the viewed note without mutating gameplay", () => {
  let state = performAction(forest(), action("explore_forest_edge"));
  state.player.area = "stonefield_house";
  state = finish(open(state, "train_with_garron"));
  const snapshot = structuredClone(state);
  assert.equal(getUnreadJournalCount(state), 2);
  assert.equal(getAvailablePages(state).find((page) => page.id === "codex").unreadCount, 2);
  const read = markJournalEntryRead(state, "resource:herbs");
  assert.equal(getUnreadJournalCount(read), 1);
  assert.equal(entry(read, "resource:herbs").read, true);
  assert.equal(entry(read, "note:garron_footing").read, false);
  assert.deepEqual(state, snapshot);
  assert.deepEqual({ ...read, journal: state.journal }, state);
  assert.equal(markJournalEntryRead(read, "resource:herbs"), read);
  assert.equal(markJournalEntryRead(read, "note:unknown"), read);
  const done = markJournalEntryRead(read, "note:garron_footing");
  assert.equal(getAvailablePages(done).find((page) => page.id === "codex").unreadCount, 0);
});

test("repeat discoveries stay read while newly acquired notes restore the notification", () => {
  let state = performAction(forest(), action("explore_forest_edge"));
  state = markJournalEntryRead(state, "resource:herbs");
  state = performAction(state, action("explore_forest_edge"));
  assert.equal(getUnreadJournalCount(state), 0);
  state.player.area = "stonefield_house";
  state = finish(open(state, "train_with_garron"));
  assert.equal(getUnreadJournalCount(state), 1);
});

test("saved read markers survive loading, while earlier notes without markers start unread", () => {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  try {
    const acquired = performAction(forest(), action("explore_forest_edge"));
    const read = markJournalEntryRead(acquired, "resource:herbs");
    saveGameToSlot(1, read); saveGameToSlot(2, acquired);
    assert.equal(getUnreadJournalCount(loadGameFromSlot(1)), 0);
    assert.equal(getUnreadJournalCount(loadGameFromSlot(2)), 1);
    delete acquired.journal.entries[0].read;
    assert.equal(getUnreadJournalCount(migrateSaveState(acquired)), 1);
    acquired.journal.entries[0].read = "true";
    assert.equal(getUnreadJournalCount(migrateSaveState(acquired)), 1);
    delete acquired.journal;
    const recovered = migrateSaveState(acquired);
    assert.equal(getUnreadJournalCount(recovered), 1);
    assert.equal(getUnreadJournalCount(migrateSaveState(markJournalEntryRead(recovered, "resource:herbs"))), 0);
  } finally { delete globalThis.localStorage; }
});
