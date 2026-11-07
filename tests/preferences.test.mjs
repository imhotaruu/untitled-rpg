import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";
import {
  DEFAULT_PREFERENCES, PREFERENCES_KEY, loadPreferences, savePreferences,
  normalizePreferences,
} from "../src/utils/preferences.js";
import { getCombatFrameDuration } from "../src/utils/combatPacing.js";
const { createGameState } = await import("../src/engine/createGameState.js");
const { saveGameToSlot, loadGameFromSlot, clearAllSaveSlots } = await import("../src/engine/saveSystem.js");

function mockStorage(t) {
  const data = new Map();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  return storage;
}

test("missing, malformed, and partial preferences fall back safely", (t) => {
  const storage = mockStorage(t);
  assert.deepEqual(loadPreferences(), DEFAULT_PREFERENCES);
  for (const raw of ["broken json", "null", "[]", "42", '"fast"']) {
    storage.setItem(PREFERENCES_KEY, raw);
    assert.deepEqual(loadPreferences(), DEFAULT_PREFERENCES);
  }
  assert.deepEqual(normalizePreferences({ combatPace: "fast", motion: "invalid", extra: true }),
    { combatPace: "fast", textSpeed: "normal", motion: "full", confirmStoryActions: true });
  assert.deepEqual(normalizePreferences({ combatPace: "__proto__", motion: "reduced" }),
    { combatPace: "normal", textSpeed: "normal", motion: "reduced", confirmStoryActions: true });
  assert.equal(normalizePreferences({ confirmStoryActions: false }).confirmStoryActions, false);
  for (const value of ["false", null, 0, [], {}]) {
    assert.equal(normalizePreferences({ confirmStoryActions: value }).confirmStoryActions, true);
  }
});

test("preferences survive reload, slot changes, and deleting all game saves", (t) => {
  mockStorage(t);
  const preferences = { combatPace: "slow", textSpeed: "fast", motion: "reduced", confirmStoryActions: false };
  const state = createGameState();
  saveGameToSlot(1, state);
  assert.equal(savePreferences(preferences), true);
  assert.deepEqual(loadPreferences(), preferences);
  saveGameToSlot(2, createGameState());
  const loaded = loadGameFromSlot(1);
  assert.deepEqual(loaded.player, state.player);
  assert.equal(Object.hasOwn(loaded, "preferences"), false);
  assert.deepEqual(loadPreferences(), preferences);
  clearAllSaveSlots();
  assert.equal(loadGameFromSlot(1), null);
  assert.deepEqual(loadPreferences(), preferences);
  savePreferences(DEFAULT_PREFERENCES);
  assert.deepEqual(loadPreferences(), DEFAULT_PREFERENCES);
});

test("unavailable preference storage falls back and reports failed persistence", (t) => {
  const storage = mockStorage(t);
  storage.getItem = () => { throw new Error("Blocked storage"); };
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  assert.deepEqual(loadPreferences(), DEFAULT_PREFERENCES);
  assert.equal(savePreferences({ combatPace: "fast", motion: "full" }), false);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true, get() { throw new Error("SecurityError"); },
  });
  assert.deepEqual(loadPreferences(), DEFAULT_PREFERENCES);
  assert.equal(savePreferences(DEFAULT_PREFERENCES), false);
});

test("legacy device motion preferences migrate to Full without losing pacing", (t) => {
  const storage = mockStorage(t);
  storage.setItem(PREFERENCES_KEY, JSON.stringify({ combatPace: "slow", motion: "system" }));
  assert.deepEqual(loadPreferences(), { combatPace: "slow", textSpeed: "normal", motion: "full", confirmStoryActions: true });
  for (const motion of ["reduced", "full"]) {
    savePreferences({ combatPace: "fast", motion });
    assert.deepEqual(loadPreferences(), { combatPace: "fast", textSpeed: "normal", motion, confirmStoryActions: true });
  }
});

test("every combat message follows the requested reading times with safe fallbacks", () => {
  const expected = { use: 3000, hit: 4000, miss: 3500, block: 3500, restore: 3500, turn: 3000, wait: 3500, result: 4000 };
  for (const [kind, duration] of Object.entries(expected)) {
    assert.equal(getCombatFrameDuration(kind), duration);
    assert.equal(getCombatFrameDuration(kind, "normal"), duration);
    assert.equal(getCombatFrameDuration(kind, "slow"), duration + 2000);
    assert.equal(getCombatFrameDuration(kind, "fast"), 2000);
    assert.equal(getCombatFrameDuration(kind, "invalid"), duration);
    assert.equal(getCombatFrameDuration(kind, "__proto__"), duration);
  }
  for (const kind of ["unknown", "__proto__"]) {
    assert.equal(getCombatFrameDuration(kind), 3500);
    assert.equal(getCombatFrameDuration(kind, "slow"), 5500);
    assert.equal(getCombatFrameDuration(kind, "fast"), 2000);
  }
});

test("text speed saves independently from battle pace and old settings gain Normal", (t) => {
  mockStorage(t);
  for (const textSpeed of ["slow", "normal", "fast", "instant"]) {
    savePreferences({ combatPace: "slow", textSpeed, motion: "reduced" });
    assert.equal(loadPreferences().textSpeed, textSpeed);
    assert.equal(loadPreferences().combatPace, "slow");
    assert.equal(loadPreferences().motion, "reduced");
  }
  for (const textSpeed of [undefined, null, "invalid", "__proto__", {}, 0]) {
    assert.equal(normalizePreferences({ textSpeed }).textSpeed, "normal");
  }
});
