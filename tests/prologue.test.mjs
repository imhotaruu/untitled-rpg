import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState, createNewJourney } = await import("../src/engine/createGameState.js");
const { advancePrologue, performPrologueMove, skipPrologue, normalizeNarrative, completeBirthScene, updateBirthIdentity } = await import("../src/engine/prologueSystem.js");
const { migrateSaveState } = await import("../src/engine/saveMigration.js");
const { processGameTick } = await import("../src/engine/tickSystem.js");
const { resolveCombatTurn } = await import("../src/engine/combatSystem.js");
const { saveGameToSlot, loadGameFromSlot, getSaveSlotSummaries } = await import("../src/engine/saveSystem.js");
const { prologueScenes } = await import("../src/data/prologue.js");
const { tutorialPassages } = await import("../src/data/prologueScript.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { actions } = await import("../src/data/actions.js");

const moves = ["attack", "astral_ward", "guiding_star", "attack", "starlight_mend", "celestial_severance"];
const identity = { name: "Lumi", gender: "Female" };
function atBattle() {
  let state = createNewJourney();
  for (let count = 0; state.narrative.sceneId !== "battle" && count < 50; count++) state = advancePrologue(state, state.narrative.sceneId);
  assert.equal(state.narrative.sceneId, "battle");
  return advancePrologue(state, "battle");
}
function through(step) {
  let state = atBattle();
  for (const move of moves.slice(0, step)) {
    state = performPrologueMove(state, move);
    state = performPrologueMove(state, "continue_tutorial");
  }
  return state;
}
function chapterFrom(state) {
  state = completeBirthScene(state, identity);
  return advancePrologue(state, "chapter");
}

test("new journeys contain the revised lore without author-only spoilers", () => {
  const state = createNewJourney();
  assert.equal(state.narrative.sceneId, prologueScenes[0].id);
  assert.deepEqual(state.storyLog, []);
  assert.equal(advancePrologue(state, "wrong_scene"), state);
  const prose = JSON.stringify([prologueScenes, tutorialPassages]);
  assert.match(prose, /Within creation, life held countless possibilities/);
  assert.doesNotMatch(prose, /Neither could truly exist without the other|Seraphis|amnesiac|chosen one/);
  for (const word of ["Goddess of Stars", "Starwake", "Morveth", "Aurelion", "Elaris", "Divine Authorities", "thread of starlight"]) assert.ok(prose.includes(word), word);
  assert.equal(new Set(prologueScenes.map((scene) => scene.id)).size, prologueScenes.length);
});

test("Astraea's vitals and combat actions are isolated from the protagonist", () => {
  const state = atBattle();
  assert.equal(state.narrative.combat.player.name, "Astraea");
  assert.equal(state.narrative.combat.player.maxMp, 30);
  assert.equal(state.player.name, "Player");
  assert.equal(state.combat, null);
  assert.equal(advancePrologue(state, "battle"), state);
  const moved = performPrologueMove(state, "attack");
  for (const key of ["player", "resources", "inventory", "equipment", "progress", "unlocks", "storyLog"]) assert.deepEqual(moved[key], state[key]);
  assert.equal(moved.narrative.combat.player.stamina, 7);
});

test("only the current lesson executes and dialogue must be acknowledged once", () => {
  const state = atBattle();
  for (const move of ["guiding_star", "celestial_severance", "retreat", "guard", "continue_tutorial", "invalid"]) assert.equal(performPrologueMove(state, move), state);
  const reading = performPrologueMove(state, "attack");
  assert.equal(reading.narrative.combat.tutorial.reading, "strike");
  assert.equal(performPrologueMove(reading, "attack"), reading);
  assert.equal(performPrologueMove(reading, "astral_ward"), reading);
  const ready = performPrologueMove(reading, "continue_tutorial");
  assert.equal(ready.narrative.combat.tutorial.reading, null);
  assert.equal(performPrologueMove(ready, "continue_tutorial"), ready);
});

test("Astral Ward spends mana and reduces actual incoming damage", () => {
  const state = through(1);
  const { combat, frames } = resolveCombatTurn(state.narrative.combat, "astral_ward");
  assert.equal(combat.player.mp, 26);
  assert.equal(combat.player.hp, 32);
  assert.equal(frames[0].kind, "use");
  assert.ok(frames.find((frame) => /4 damage instead of 16/.test(frame.message)));
  assert.equal(state.narrative.combat.player.hp, 36);
});

test("Guiding Star persists through dialogue and is consumed by the next strike", () => {
  const guided = through(3);
  assert.equal(guided.narrative.combat.tutorial.guided, true);
  assert.equal(guided.narrative.combat.enemy.evasion, 75);
  const hit = performPrologueMove(guided, "attack");
  assert.equal(hit.narrative.combat.tutorial.guided, false);
  assert.equal(hit.narrative.combat.enemy.hp, guided.narrative.combat.enemy.hp - 14);
  assert.equal(hit.narrative.combat.player.hp, 18);
});

test("Starlight Mend heals and caps at maximum health", () => {
  const state = through(4);
  const healed = performPrologueMove(state, "starlight_mend");
  assert.equal(healed.narrative.combat.player.hp, 30);
  assert.equal(healed.narrative.combat.player.mp, 18);
  state.narrative.combat.player.hp = 35;
  assert.equal(performPrologueMove(state, "starlight_mend").narrative.combat.player.hp, 36);
});

test("finisher defeats the fragment and reaches the seal only after its dialogue", () => {
  const victory = performPrologueMove(through(5), "celestial_severance");
  assert.equal(victory.narrative.combat.status, "victory");
  assert.equal(victory.narrative.combat.enemy.hp, 0);
  assert.equal(victory.narrative.combat.player.mp, 10);
  assert.equal(advancePrologue(victory, "battle"), victory);
  const seal = advancePrologue(performPrologueMove(victory, "continue_tutorial"), "battle");
  assert.equal(seal.narrative.sceneId, "v2_scene_5_1");
  assert.equal(seal.narrative.combat, null);
  assert.equal(seal.resources.gold.amount, 0);
});

test("all scenes and lessons reach birth, then normal village training", () => {
  let state = createNewJourney();
  for (let step = 0; state.narrative.sceneId !== "birth" && step < 100; step++) {
    if (state.narrative.combat) {
      if (state.narrative.combat.tutorial.reading) state = performPrologueMove(state, "continue_tutorial");
      else if (state.narrative.combat.status === "active") state = performPrologueMove(state, moves[state.narrative.combat.round - 1]);
      else state = advancePrologue(state, "battle");
    } else state = advancePrologue(state, state.narrative.sceneId);
  }
  assert.equal(state.narrative.sceneId, "birth");
  state = chapterFrom(state);
  assert.equal(state.narrative.phase, "chapter");
  assert.equal(state.player.name, identity.name);
  assert.equal(state.player.area, "stonefield_house");
  assert.equal(state.player.maxMp, createGameState().player.maxMp);
  assert.equal(state.unlocks.systems.magic, undefined);
  assert.equal(state.completedStoryEvents.filter((id) => id === "chapter_one_opening").length, 1);
  const trained = performAction(state, actions.find((action) => action.id === "train_with_garron"));
  assert.equal(trained.unlocks.completedActions.train_with_garron, true);
  assert.equal(advancePrologue(state, "chapter"), state);
});

test("skip from every narration and combat phase goes to birth with no rewards", () => {
  const base = createNewJourney();
  for (const scene of prologueScenes.filter((scene) => scene.scene)) {
    const skipped = skipPrologue({ ...base, narrative: { ...base.narrative, sceneId: scene.id } });
    assert.equal(skipped.narrative.sceneId, "birth");
  }
  for (let phase = 0; phase <= 6; phase++) {
    const skipped = skipPrologue(through(phase));
    assert.equal(skipped.narrative.sceneId, "birth");
    assert.equal(skipped.narrative.combat, null);
    assert.deepEqual(skipped.player, base.player);
    assert.deepEqual(skipped.inventory, base.inventory);
    assert.equal(advancePrologue(skipped, "birth"), skipped);
  }
});

test("birth validates identity, preserves gameplay stats and cannot repeat", () => {
  const birth = skipPrologue(createNewJourney());
  for (const invalid of [{ name: "   ", gender: "Female" }, { name: "x".repeat(33), gender: "Female" }, { name: "Lumi", gender: "bad" }, null]) assert.equal(completeBirthScene(birth, invalid), birth);
  const drafted = updateBirthIdentity(birth, { name: "  Lumi  Moon  ", gender: "Non-binary" });
  assert.equal(drafted.player.name, "Player");
  const created = completeBirthScene(drafted, drafted.narrative.characterDraft);
  assert.equal(created.player.name, "Lumi Moon");
  assert.equal(created.player.gender, "Non-binary");
  assert.equal(created.player.maxHp, birth.player.maxHp);
  assert.equal(created.narrative.sceneId, "chapter");
  assert.equal(completeBirthScene(created, identity), created);
  assert.equal(updateBirthIdentity(created, identity), created);
});

test("legacy adventures retain location, inventory, quest progress and story", () => {
  const state = createGameState();
  delete state.narrative;
  state.player.area = "forest_trail";
  state.resources.wood.amount = 17;
  state.unlocks.completedActions.begin_rowan_crafting = true;
  state.crafting.crafted.handmade_training_sword = 1;
  const loaded = migrateSaveState(state);
  assert.equal(loaded.narrative.phase, "chapter");
  assert.equal(loaded.player.area, state.player.area);
  assert.deepEqual(loaded.inventory, state.inventory);
  assert.deepEqual(loaded.crafting, state.crafting);
  assert.deepEqual(loaded.storyLog, state.storyLog);
  assert.equal(loaded.resources.wood.amount, 17);
});

test("V1 cursors migrate; corrupt or old battles restart at their introduction", () => {
  assert.equal(normalizeNarrative({ phase: "prologue", sceneId: "seal" }).sceneId, "v2_scene_5_1");
  assert.equal(normalizeNarrative({ phase: "prologue", sceneId: "years" }).sceneId, "chapter");
  assert.equal(normalizeNarrative({ phase: "prologue", sceneId: "missing" }).sceneId, prologueScenes[0].id);
  for (const corrupt of [
    (combat) => { combat.player.hp = -1; },
    (combat) => { delete combat.tutorialVersion; },
    (combat) => { combat.tutorial.phase = "unknown"; },
    (combat) => { combat.player.mp = 0; },
    (combat) => { combat.tutorial.reading = "missing"; },
    (combat) => { combat.player.mp = NaN; },
  ]) {
    const state = atBattle(); corrupt(state.narrative.combat);
    const loaded = migrateSaveState(state);
    assert.equal(loaded.narrative.sceneId, "battle");
    assert.equal(loaded.narrative.combat, null);
    assert.ok(advancePrologue(loaded, "battle").narrative.combat);
  }
});

test("prologue pauses recovery and cannot mutate an adventure through its commands", () => {
  const state = atBattle();
  state.player.isResting = true; state.player.stamina = 0;
  assert.equal(processGameTick(state, 100), state);
  const adventure = createGameState();
  assert.equal(performPrologueMove(adventure, "attack"), adventure);
  assert.equal(skipPrologue(adventure), adventure);
  assert.equal(completeBirthScene(adventure, identity), adventure);
});

test("save slots resume every lesson, dialogue, birth draft and chapter without replaying effects", () => {
  const storage = new Map(); const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  try {
    const snapshots = [createNewJourney()]; let battle = atBattle(); snapshots.push(battle);
    for (const move of moves) {
      battle = performPrologueMove(battle, move); snapshots.push(battle);
      battle = performPrologueMove(battle, "continue_tutorial"); snapshots.push(battle);
    }
    const birth = updateBirthIdentity(skipPrologue(battle), identity);
    snapshots.push(birth, completeBirthScene(birth, identity), chapterFrom(birth));
    for (const state of snapshots) {
      saveGameToSlot(1, state);
      const loaded = loadGameFromSlot(1);
      assert.deepEqual(loaded.narrative, state.narrative);
      assert.deepEqual(loaded.player, state.player);
      assert.deepEqual(loaded.storyLog, state.storyLog);
      const [summary, empty] = getSaveSlotSummaries();
      const isPrologue = state.narrative.phase === "prologue";
      assert.equal(summary.storyStage, isPrologue ? "Prologue" : "Chapter 1 · Act 1");
      assert.equal(summary.playerName, isPrologue ? "Astraea" : identity.name);
      assert.equal(summary.level, isPrologue ? "???" : state.player.level);
      assert.equal(summary.areaLabel, isPrologue ? "The Veil" : null);
      assert.equal(summary.day, isPrologue ? "Day ???" : state.player.day);
      assert.equal(summary.areaId, state.player.area);
      assert.equal(empty.hasSave, false);
      assert.equal(empty.playerName, null);
      assert.equal(empty.areaLabel, null);
      assert.equal(empty.day, null);
      // Reading the display metadata must not rewrite the saved protagonist.
      assert.deepEqual(loadGameFromSlot(1).player, state.player);
    }
  } finally { globalThis.localStorage = previous; }
});
