import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";
const { getPartyVitalLosses } = await import("../src/utils/partyVitalFeedback.js");
const { createGameState } = await import("../src/engine/createGameState.js");
const { createPrologueCombat } = await import("../src/engine/prologueSystem.js");
const { startCombat, resolveCombatTurn } = await import("../src/engine/combatSystem.js");
const vitals = { hp: 10, maxHp: 10, stamina: 8, maxStamina: 8, mp: 5, maxMp: 5 };

test("party feedback follows the real impact frame, not the enemy's announcement", () => {
  const state = createGameState(); state.unlocks.systems.basic_guard = true;
  const combat = startCombat(state, "garron_spar", 1).combat;
  assert.ok(combat);
  const { frames } = resolveCombatTurn(combat, "heavy_strike");
  let previous = combat.player;
  let sawDamage = false;
  for (const frame of frames) {
    const losses = getPartyVitalLosses(previous, frame.player);
    if (frame.kind === "use" && frame.actor === "player") assert.deepEqual(losses.map((loss) => loss.type), ["stamina"]);
    if (frame.actor === "enemy" && ["turn", "use"].includes(frame.kind)) assert.deepEqual(losses, []);
    if (frame.actor === "enemy" && frame.player.hp < previous.hp) {
      assert.deepEqual(losses.map((loss) => loss.type), ["health"]);
      assert.ok(losses[0].from > losses[0].to);
      sawDamage = true;
    }
    previous = frame.player;
  }
  assert.equal(sawDamage, true);
});

test("tutorial mana spending produces feedback independently of health damage", () => {
  let combat = resolveCombatTurn(createPrologueCombat(), "attack").combat;
  combat = resolveCombatTurn(combat, "continue_tutorial").combat;
  const { frames } = resolveCombatTurn(combat, "astral_ward");
  assert.ok(frames.length);
  let previous = combat.player;
  let sawMana = false;
  for (const frame of frames) {
    const losses = getPartyVitalLosses(previous, frame.player);
    if (frame.player.mp < previous.mp) {
      assert.ok(losses.some((loss) => loss.type === "mana"));
      sawMana = true;
    }
    previous = frame.player;
  }
  assert.equal(sawMana, true);
});

test("simultaneous drains include every affected meter, including zero HP", () => {
  const before = structuredClone(vitals);
  const losses = getPartyVitalLosses(before, { ...vitals, hp: 0, stamina: 4, mp: 1 });
  assert.deepEqual(losses, [
    { type: "health", from: 100, to: 0 },
    { type: "stamina", from: 100, to: 50 },
    { type: "mana", from: 100, to: 20 },
  ]);
  assert.deepEqual(before, vitals);
});

test("mounts, unchanged values, healing, misses, and absent mana do not trigger false losses", () => {
  assert.deepEqual(getPartyVitalLosses(null, vitals), []);
  assert.deepEqual(getPartyVitalLosses(vitals, vitals), []);
  assert.deepEqual(getPartyVitalLosses({ ...vitals, hp: 5 }, vitals), []);
  assert.deepEqual(getPartyVitalLosses({ hp: 10, maxHp: 10 }, { hp: 10, maxHp: 10 }), []);
  assert.deepEqual(getPartyVitalLosses({ hp: 10, maxHp: Infinity }, { hp: 1, maxHp: 10 }), []);
});
