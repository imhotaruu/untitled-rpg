import assert from "node:assert/strict";
import test from "node:test";
import "./registerSourceImports.mjs";

const { createGameState } = await import("../src/engine/createGameState.js");
const { startCombat, getHitChance } = await import("../src/engine/combatSystem.js");
const { createPrologueCombat } = await import("../src/engine/prologueSystem.js");
const { resolveDivineTutorial } = await import("../src/engine/divineTutorial.js");
const { getBattleInfoEntries } = await import("../src/engine/battleInfoSystem.js");

function spar() {
  const state = createGameState();
  state.player.area = "stonefield_house";
  state.unlocks.systems.basic_guard = true;
  return startCombat(state, "garron_spar").combat;
}

test("info uses separate combat snapshots, real resources and directional hit chances without mutations", () => {
  const combat = spar();
  combat.player.hp = 3;
  combat.enemy.hp = 12;
  const before = structuredClone(combat);
  const [enemy, player] = getBattleInfoEntries(combat);
  assert.equal(enemy.name, "Garron");
  assert.equal(enemy.role, "Enemy");
  assert.equal(player.role, "Party Member · Leader");
  assert.equal(enemy.vitals.find((vital) => vital.type === "health").value, 12);
  assert.deepEqual(enemy.vitals.map((vital) => vital.type), ["health"]);
  assert.equal(player.vitals.find((vital) => vital.type === "health").value, 3);
  assert.deepEqual(player.vitals.map((vital) => vital.type), ["health", "stamina"]);
  assert.equal(player.hitChance.value, `${getHitChance(combat.player, combat.enemy)}%`);
  assert.equal(enemy.hitChance.value, `${getHitChance(combat.enemy, combat.player)}%`);
  assert.equal(enemy.hitChance.target, combat.player.name);
  assert.equal(enemy.intent.label, "Measured strike");
  assert.equal(player.intent, null);
  assert.deepEqual(combat, before);
});

test("tutorial info tracks actual buffs, mana and guaranteed strikes through every phase", () => {
  let combat = createPrologueCombat();
  const moves = ["attack", "astral_ward", "guiding_star", "attack", "starlight_mend", "celestial_severance"];
  for (const [index, move] of moves.entries()) {
    const [enemy, player] = getBattleInfoEntries(combat);
    assert.equal(player.vitals.find((vital) => vital.type === "mana").value, combat.player.mp);
    assert.equal(player.hitChance.value, "Guaranteed (tutorial)");
    assert.equal(enemy.hitChance.value, "Guaranteed (tutorial)");
    assert.deepEqual(enemy.effects.map((effect) => effect.label), index === 2 || index === 3 ? ["Evasive"] : []);
    assert.deepEqual(player.effects.map((effect) => effect.label), index === 3 ? ["Guiding Star"] : []);
    combat = resolveDivineTutorial(combat, move).combat;
    combat = resolveDivineTutorial(combat, "continue_tutorial").combat;
  }
  const [enemy, player] = getBattleInfoEntries(combat);
  assert.equal(enemy.intent, null);
  assert.deepEqual(enemy.effects, []);
  assert.deepEqual(player.effects, []);
  assert.equal(enemy.vitals[0].value, 0);
});

test("completed practice bouts retain inspectable stats without an upcoming enemy move", () => {
  for (const status of ["victory", "defeat", "retreat"]) {
    const combat = { ...spar(), status };
    const [enemy, player] = getBattleInfoEntries(combat);
    assert.equal(enemy.intent, null);
    assert.ok(enemy.stats.some((stat) => stat.label === "Defense"));
    assert.ok(player.stats.some((stat) => stat.label === "Guard Power"));
  }
});

test("multiple supplied party members keep their own names and stats without guessing an enemy target", () => {
  const combat = spar();
  const members = [
    { ...combat.player, id: "player", name: "Lumi", hp: 4 },
    { ...combat.player, id: "companion", name: "Companion", hp: 7, mp: 2, maxMp: 5 },
  ];
  const entries = getBattleInfoEntries(combat, members);
  assert.deepEqual(entries.map((entry) => entry.key), ["enemy", "party:player", "party:companion"]);
  assert.equal(entries[1].vitals[0].value, 4);
  assert.equal(entries[2].vitals[0].value, 7);
  assert.equal(entries[2].vitals.find((vital) => vital.type === "mana").value, 2);
  assert.equal(entries[0].hitChance, null);
  assert.equal(entries[2].hitChance.target, combat.enemy.name);
  assert.equal(entries[2].role, "Party Member");
});

test("profile leader labels follow explicit membership roles rather than selection order", () => {
  const combat = spar();
  const members = [
    { ...combat.player, id: "companion", name: "Companion", isLeader: true },
    { ...combat.player, id: "player", name: "Lumi", isLeader: false },
  ];
  const entries = getBattleInfoEntries(combat, members);
  assert.equal(entries.find((entry) => entry.key === "party:companion").role, "Party Member · Leader");
  assert.equal(entries.find((entry) => entry.key === "party:player").role, "Party Member");
});
