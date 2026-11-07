import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState } = await import("../src/engine/createGameState.js");
const { actions } = await import("../src/data/actions.js");
const { areas } = await import("../src/data/areas.js");
const { upgrades } = await import("../src/data/upgrades.js");
const { performAction } = await import("../src/engine/actionSystem.js");
const { moveToArea } = await import("../src/engine/areaSystem.js");
const { processGameTick } = await import("../src/engine/tickSystem.js");
const { equipItem, unequipSlot } = await import("../src/engine/equipmentSystem.js");
const { consumeInventoryItem } = await import("../src/engine/itemSystem.js");
const { purchaseUpgrade } = await import("../src/engine/upgradeSystem.js");
const { getAvailableActions } = await import("../src/engine/selectors.js");
const { migrateSaveRecord } = await import("../src/engine/saveMigration.js");
const { saveGameToSlot, loadGameFromSlot } = await import("../src/engine/saveSystem.js");
const {
  startCombat, performCombatMove, dismissCombat, getCombatIntent,
  getDamage, getHitChance, normalizeCombat, resolveCombatTurn,
} = await import("../src/engine/combatSystem.js");

const action = (id) => actions.find((entry) => entry.id === id);
const spar = action("spar_with_garron");

function trained() {
  let state = createGameState();
  state.player.area = "stonefield_house";
  state = performAction(state, action("train_with_garron"));
  for (let i = 0; i < 5; i++) state = performAction(state, action("practice_with_garron"));
  return state;
}

function inCombat() {
  return performAction(trained(), spar, { seed: 1 });
}

function adventureState(state) {
  const { isResting: _rest, ...player } = state.player;
  return {
    player, inventory: state.inventory, equipment: state.equipment,
    resources: state.resources, progress: state.progress, storyLog: state.storyLog,
  };
}

test("turn playback orders move, impact, pause, enemy move, and enemy impact", () => {
  const before = inCombat();
  const original = structuredClone(before.combat);
  const { combat, frames } = resolveCombatTurn(before.combat, "heavy_strike");
  assert.deepEqual(frames.map(({ kind, actor }) => [kind, actor]), [
    ["use", "player"], ["hit", "player"], ["turn", "enemy"], ["use", "enemy"], ["hit", "enemy"],
  ]);
  assert.equal(frames[0].message, "You use Heavy Strike.");
  assert.equal(frames[0].enemy.hp, original.enemy.hp);
  assert.equal(frames[0].player.stamina, original.player.stamina - 3);
  assert.ok(frames[1].enemy.hp < original.enemy.hp);
  assert.equal(frames[1].player.hp, original.player.hp);
  assert.equal(frames[3].player.hp, original.player.hp);
  assert.ok(frames[4].player.hp < original.player.hp);
  assert.deepEqual(combat.log[0].messages, frames.map((frame) => frame.message));
  assert.deepEqual(before.combat, original);
  assert.deepEqual(combat, performCombatMove(before, "heavy_strike").combat);
  assert.equal(Object.hasOwn(combat, "frames"), false);
});

test("miss playback preserves target health and a finishing blow skips every enemy frame", () => {
  const before = inCombat();
  before.combat.player.accuracy = 0;
  const miss = resolveCombatTurn(before.combat, "attack");
  assert.equal(miss.frames[1].kind, "miss");
  assert.equal(miss.frames[1].enemy.hp, before.combat.enemy.hp);
  before.combat.player.accuracy = 95;
  before.combat.enemy.hp = 1;
  const win = resolveCombatTurn(before.combat, "attack");
  assert.equal(win.combat.status, "victory");
  assert.deepEqual(win.frames.map((frame) => frame.kind), ["use", "hit", "result"]);
  assert.equal(win.frames.some((frame) => frame.actor === "enemy"), false);
  assert.equal(win.frames.at(-1).player.hp, before.combat.player.hp);
});

test("guard, recovery, wait, and defeat have accurate intermediate snapshots", () => {
  const before = inCombat();
  before.combat.player.stamina = 0;
  const guard = resolveCombatTurn(before.combat, "guard");
  assert.equal(guard.frames[0].player.stamina, 0);
  assert.equal(guard.frames[1].player.stamina, 1);
  assert.equal(guard.frames.at(-1).kind, "block");
  assert.equal(guard.frames.at(-1).player.hp, before.combat.player.hp);
  const wait = resolveCombatTurn(guard.combat, "recover");
  assert.deepEqual(wait.frames.map((frame) => frame.kind), ["use", "restore", "turn", "wait"]);
  before.combat.player.hp = 1;
  const defeat = resolveCombatTurn(before.combat, "recover");
  assert.equal(defeat.combat.status, "defeat");
  assert.equal(defeat.frames.at(-2).kind, "hit");
  assert.equal(defeat.frames.at(-1).kind, "result");
  assert.equal(defeat.frames.at(-1).player.hp, 0);
});

test("unaffordable or invalid moves produce no playback and consume no randomness", () => {
  const before = inCombat().combat;
  before.player.stamina = 0;
  for (const move of ["heavy_strike", "attack", "unknown"]) {
    const result = resolveCombatTurn(before, move);
    assert.equal(result.combat, before);
    assert.deepEqual(result.frames, []);
  }
});

test("sparring unlocks with Basic Guard and is only available at home", () => {
  const fresh = createGameState();
  assert.equal(fresh.combat, null);
  assert.equal(startCombat(fresh, "garron_spar"), fresh);
  fresh.player.area = "stonefield_house";
  assert.equal(performAction(fresh, spar).combat, null);
  const ready = trained();
  assert.ok(getAvailableActions(actions, ready.player.area, ready.unlocks).some((entry) => entry.id === spar.id));
  ready.player.area = "forest_edge";
  assert.equal(performAction(ready, spar).combat, null);
  assert.equal(startCombat(ready, "garron_spar"), ready);
});

test("a spar starts with full separate vitals, snapshots equipment, and stops resting", () => {
  let before = trained();
  before = equipItem(before, "training_stick");
  before.player.hp = 2;
  before.player.stamina = 0;
  before.player.isResting = true;
  const original = structuredClone(before);
  const after = performAction(before, spar, { seed: 42 });
  assert.equal(after.combat.player.hp, before.player.maxHp);
  assert.equal(after.combat.player.stamina, before.player.maxStamina);
  assert.ok(after.combat.player.attackPower > inCombat().combat.player.attackPower);
  assert.equal(after.player.isResting, false);
  assert.deepEqual(adventureState(after), adventureState(before));
  assert.deepEqual(before, original);
  assert.equal(startCombat(after, "garron_spar"), after);
});

test("an attack spends stamina and resolves exactly one player/enemy round immutably", () => {
  const before = inCombat();
  const snapshot = structuredClone(before);
  const after = performCombatMove(before, "attack");
  assert.equal(after.combat.round, 2);
  assert.equal(after.combat.player.stamina, before.combat.player.stamina - 1);
  assert.ok(after.combat.enemy.hp < before.combat.enemy.hp);
  assert.equal(after.combat.log[0].round, 1);
  assert.ok(after.combat.log[0].messages.some((message) => message.includes("Garron uses")));
  assert.deepEqual(before, snapshot);
  assert.deepEqual(adventureState(after), adventureState(before));
});

test("invalid moves and insufficient stamina never spend a turn or reroll", () => {
  const before = inCombat();
  before.combat.player.stamina = 0;
  for (const move of ["unknown", "attack", "heavy_strike"]) {
    assert.equal(performCombatMove(before, move), before);
  }
  assert.equal(dismissCombat(before), before);
  const recovered = performCombatMove(before, "recover");
  assert.equal(recovered.combat.player.stamina, 3);
  assert.equal(recovered.combat.round, 2);
});

test("heavy strikes cost three stamina and deal more damage on the same roll", () => {
  const before = inCombat();
  const attack = performCombatMove(before, "attack");
  const heavy = performCombatMove(before, "heavy_strike");
  assert.equal(heavy.combat.player.stamina, before.combat.player.stamina - 3);
  assert.ok(heavy.combat.enemy.hp < attack.combat.enemy.hp);
});

test("guard reduces incoming damage only for that turn and recovery is capped", () => {
  const before = inCombat();
  const guarded = performCombatMove(before, "guard");
  const exposed = performCombatMove(before, "recover");
  assert.equal(guarded.combat.player.hp, before.combat.player.hp);
  assert.ok(exposed.combat.player.hp < guarded.combat.player.hp);
  assert.equal(guarded.combat.player.stamina, before.combat.player.maxStamina);
  assert.equal(getCombatIntent(guarded.combat).kind, "wait");
  const windup = performCombatMove(guarded, "recover");
  assert.equal(windup.combat.player.hp, guarded.combat.player.hp);
  assert.equal(getCombatIntent(windup.combat).label, "Heavy strike");
  const heavy = performCombatMove(windup, "recover");
  assert.ok(heavy.combat.player.hp < windup.combat.player.hp);
  assert.equal(getCombatIntent(heavy.combat).kind, "wait");
  const pause = performCombatMove(heavy, "guard");
  assert.equal(getCombatIntent(pause.combat).label, "Measured strike");
});

test("damage, armor, guard, critical damage, and hit chance have defined limits", () => {
  const attacker = { attackPower: 10, accuracy: 80 };
  const target = { defense: 3, guardPower: 4, evasion: 10 };
  assert.equal(getDamage(attacker, target), 7);
  assert.equal(getDamage(attacker, target, 1, true), 3);
  assert.equal(getDamage(attacker, target, 1, false, true), 12);
  assert.equal(getDamage(attacker, { ...target, defense: 100 }), 1);
  assert.equal(getDamage(attacker, { ...target, defense: 100 }, 1, true), 0);
  assert.equal(getHitChance(attacker, target), 70);
  assert.equal(getHitChance({ accuracy: 0 }, { evasion: 100 }), 5);
  assert.equal(getHitChance({ accuracy: 200 }, { evasion: 0 }), 95);
});

test("equipped training armor changes actual incoming damage", () => {
  const unarmored = performCombatMove(inCombat(), "recover");
  let prepared = performAction(trained(), action("collect_training_armor"));
  for (const { itemId } of action("collect_training_armor").itemRewards) prepared = equipItem(prepared, itemId);
  const armored = performCombatMove(performAction(prepared, spar, { seed: 1 }), "recover");
  assert.ok(armored.combat.player.hp > unarmored.combat.player.hp);
});

test("misses and critical hits are resolved and reported", () => {
  const before = inCombat();
  before.combat.player.accuracy = 0;
  const missed = performCombatMove(before, "attack");
  assert.equal(missed.combat.enemy.hp, before.combat.enemy.hp);
  assert.ok(missed.combat.log[0].messages.some((message) => message.includes("misses")));
  before.combat.player.accuracy = 95;
  before.combat.player.criticalChance = 100;
  const critical = performCombatMove(before, "attack");
  assert.ok(critical.combat.log[0].messages.some((message) => message.includes("critical")));
});

test("victory stops the enemy response and cannot be processed twice", () => {
  const before = inCombat();
  before.combat.enemy.hp = 1;
  const after = performCombatMove(before, "attack");
  assert.equal(after.combat.status, "victory");
  assert.equal(after.combat.enemy.hp, 0);
  assert.equal(after.combat.player.hp, before.combat.player.hp);
  assert.equal(after.combat.log[0].messages.some((message) => message.includes("Garron uses")), false);
  for (const move of ["attack", "guard", "retreat"]) assert.equal(performCombatMove(after, move), after);
  assert.deepEqual(adventureState(after), adventureState(before));
  const dismissed = dismissCombat(after);
  assert.equal(dismissed.combat, null);
  assert.equal(dismissCombat(dismissed), dismissed);
  assert.equal(performAction(dismissed, spar).combat.status, "active");
});

test("defeat and ending a spar preserve adventure vitals and do not grant rewards", () => {
  const before = inCombat();
  before.combat.player.hp = 1;
  const defeat = performCombatMove(before, "recover");
  assert.equal(defeat.combat.status, "defeat");
  assert.equal(defeat.combat.player.hp, 0);
  assert.deepEqual(adventureState(defeat), adventureState(before));
  const ended = performCombatMove(before, "retreat");
  assert.equal(ended.combat.status, "retreat");
  assert.equal(ended.combat.player.hp, 1);
  assert.equal(ended.combat.seed, before.combat.seed);
  assert.deepEqual(adventureState(ended), adventureState(before));
});

test("travel, items, upgrades, actions, and recovery ticks cannot bypass combat", () => {
  for (const state of [inCombat(), performCombatMove(inCombat(), "retreat")]) {
    assert.equal(moveToArea(state, areas[0]), state);
    assert.equal(performAction(state, action("rest_home")), state);
    assert.equal(equipItem(state, "training_stick"), state);
    assert.equal(unequipSlot(state, "accessory1"), state);
    assert.equal(consumeInventoryItem(state, "simple_poultice"), state);
    assert.equal(purchaseUpgrade(state, upgrades[0]), state);
    assert.equal(processGameTick(state, 3600), state);
  }
});

test("older saves unlock eligible sparring once without beginning an encounter", () => {
  const old = trained();
  delete old.combat;
  delete old.unlocks.actions.spar_with_garron;
  old.unlocks.completedRules = old.unlocks.completedRules.filter((id) => id !== "unlock_garron_spar");
  const migrated = migrateSaveRecord({ version: 8, state: old });
  assert.equal(migrated.combat, null);
  assert.equal(migrated.unlocks.actions.spar_with_garron, true);
  assert.deepEqual(migrateSaveRecord({ version: 9, state: migrated }), migrated);
  assert.equal(migrateSaveRecord({ version: 8, state: createGameState() }).unlocks.actions.spar_with_garron, undefined);
});

test("save/load resumes exact vitals, intent, history, and the next rolls", (t) => {
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
  const before = performCombatMove(inCombat(), "attack");
  saveGameToSlot(1, before);
  const loaded = loadGameFromSlot(1);
  assert.deepEqual(loaded.combat, before.combat);
  assert.deepEqual(performCombatMove(loaded, "heavy_strike"), performCombatMove(before, "heavy_strike"));
  const ended = performCombatMove(before, "retreat");
  saveGameToSlot(2, ended);
  assert.deepEqual(loadGameFromSlot(2).combat, ended.combat);
});

test("invalid saved combat is discarded without altering adventure vitals", () => {
  const valid = inCombat();
  const corruptions = [
    (c) => { c.encounterId = "missing"; },
    (c) => { c.encounterId = "__proto__"; },
    (c) => { c.player = null; },
    (c) => { c.enemy.hp = -1; },
    (c) => { c.player.hp = 0; },
    (c) => { c.player.stamina = 999; },
    (c) => { c.seed = -1; },
    (c) => { c.round = 0; },
    (c) => { c.log = [{}]; },
    (c) => { c.status = "victory"; },
  ];
  for (const corrupt of corruptions) {
    const state = structuredClone(valid);
    corrupt(state.combat);
    const loaded = migrateSaveRecord({ version: 9, state });
    assert.equal(loaded.combat, null);
    assert.deepEqual(adventureState(loaded), adventureState(valid));
  }
  assert.equal(normalizeCombat(valid.combat, "forest_edge"), null);
});

test("a long spar bounds history and can still be ended", () => {
  let state = inCombat();
  state.combat.player.defense = 100;
  state.combat.player.maxHp = 1000;
  state.combat.player.hp = 1000;
  for (let turn = 0; turn < 100; turn++) state = performCombatMove(state, "guard");
  assert.equal(state.combat.round, 101);
  assert.equal(state.combat.log.length, 50);
  assert.equal(state.combat.log[0].round, 100);
  assert.equal(performCombatMove(state, "retreat").combat.status, "retreat");
});

test("an earned loadout can finish a complete spar using attacks, guard, and recovery", () => {
  let prepared = performAction(trained(), action("collect_training_armor"));
  prepared = equipItem(prepared, "training_stick");
  for (const { itemId } of action("collect_training_armor").itemRewards) prepared = equipItem(prepared, itemId);
  let state = performAction(prepared, spar, { seed: 28 });
  const movesUsed = new Set();
  for (let turn = 0; turn < 100 && state.combat.status === "active"; turn++) {
    const intent = getCombatIntent(state.combat);
    const move = intent.label === "Heavy strike" ? "guard"
      : state.combat.player.stamina < 3 ? "recover" : "heavy_strike";
    movesUsed.add(move);
    state = performCombatMove(state, move);
  }
  assert.equal(state.combat.status, "victory");
  assert.ok(movesUsed.has("guard") && movesUsed.has("recover") && movesUsed.has("heavy_strike"));
  assert.deepEqual(adventureState(state), adventureState(prepared));
  assert.equal(dismissCombat(state).combat, null);
});
