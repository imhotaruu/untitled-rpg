import { getCombatMoves, encounters } from "../data/encounters";
import { getDerivedCombatStats } from "./derivedStats";
import { getDivinePhase } from "../data/divineTutorial";
import { resolveDivineTutorial, isValidDivineTutorial } from "./divineTutorial";

const results = {
  victory: "You win the spar. Garron lowers his weapon with a nod.",
  defeat: "Garron wins the spar and gives you room to recover your footing.",
  retreat: "You lower your weapon. Garron brings the spar to a close.",
};

export function getCombatIntent(combat) {
  if (combat.encounterId === "chaos_fragment") {
    const phase = getDivinePhase(combat);
    return { label: phase?.label || "The fragment is defeated", description: phase?.intent || "Return to the seal.", kind: "wait" };
  }
  const intents = encounters[combat.encounterId].intents;
  return intents[(combat.round - 1) % intents.length];
}

// A saved seed makes turns reproducible and keeps React state updates pure.
function roll(combat) {
  combat.seed = (Math.imul(combat.seed, 1664525) + 1013904223) >>> 0;
  return combat.seed / 4294967296;
}

export function getHitChance(attacker, defender) {
  return Math.max(5, Math.min(95, attacker.accuracy - defender.evasion));
}

export function getDamage(attacker, defender, multiplier = 1, guarding = false, critical = false) {
  const power = Math.floor(attacker.attackPower * multiplier * (critical ? 1.5 : 1));
  const defense = defender.defense + (guarding ? defender.guardPower : 0);
  return Math.max(guarding ? 0 : 1, power - defense);
}

export function startCombat(state, encounterId, seed = 1) {
  if (state.narrative?.phase === "prologue") return state;
  const encounter = encounters[encounterId];
  if (state.combat || state.conversation || state.exploration?.pending || !encounter || state.player.area !== encounter.area
    || !state.unlocks?.systems?.[encounter.requiredSystem]) return state;

  const stats = getDerivedCombatStats(state.player, state);
  const combat = {
    version: 1,
    encounterId,
    status: "active",
    round: 1,
    seed: seed >>> 0,
    player: {
      ...stats, name: state.player.name,
      hp: state.player.maxHp, maxHp: state.player.maxHp,
      stamina: state.player.maxStamina, maxStamina: state.player.maxStamina,
    },
    enemy: { ...encounter.opponent, hp: encounter.opponent.maxHp },
    log: [{ round: 0, messages: ["Garron raises his practice weapon. You have the first move."] }],
  };
  return {
    ...state,
    player: { ...state.player, isResting: false },
    combat,
    actionLog: ["Started a spar with Garron.", ...state.actionLog].slice(0, 50),
  };
}

function strike(combat, actor, multiplier, guarding, emit) {
  const target = actor === "player" ? "enemy" : "player";
  const attacker = combat[actor];
  const defender = combat[target];
  if (roll(combat) * 100 >= getHitChance(attacker, defender)) {
    emit("miss", actor, `${attacker.name}'s strike misses ${defender.name}.`);
    return;
  }
  const critical = roll(combat) * 100 < attacker.criticalChance;
  const damage = getDamage(attacker, defender, multiplier, guarding, critical);
  const actualDamage = Math.min(defender.hp, damage);
  defender.hp -= actualDamage;
  emit(damage === 0 ? "block" : "hit", actor, damage === 0
    ? `${defender.name} guards the strike completely.`
    : `${attacker.name} hits ${defender.name} for ${actualDamage} damage${critical ? " (critical)" : ""}${guarding ? " through the guard" : ""}.`);
}

// Frames are presentation snapshots; resolving them never advances the turn twice.
export function resolveCombatTurn(currentCombat, moveId) {
  if (currentCombat?.encounterId === "chaos_fragment") return resolveDivineTutorial(currentCombat, moveId);
  const unchanged = { combat: currentCombat, frames: [] };
  if (currentCombat?.status !== "active") return unchanged;
  const move = getCombatMoves(currentCombat).find((entry) => entry.id === moveId);
  if (moveId !== "retreat" && (!move || currentCombat.player.stamina < move.cost)) return unchanged;

  const combat = structuredClone(currentCombat);
  const messages = [];
  const frames = [];
  function emit(kind, actor, message, action = null) {
    messages.push(message);
    frames.push({ kind, actor, message, action,
      player: { ...combat.player }, enemy: { ...combat.enemy } });
  }
  function finish(status) {
    combat.status = status;
    emit("result", null, encounters[combat.encounterId].outcomes?.[status] || results[status]);
    return { combat, frames };
  }
  const entry = { round: combat.round, messages };
  combat.log = [entry, ...combat.log].slice(0, 50);
  if (moveId === "retreat") return finish("retreat");

  combat.player.stamina -= move.cost;
  emit("use", "player", `You use ${move.label}.`, moveId);
  if (move.restore) {
    const restored = Math.min(move.restore, combat.player.maxStamina - combat.player.stamina);
    combat.player.stamina += restored;
    emit("restore", "player", `Recovered ${restored} ${encounters[combat.encounterId].tutorial ? "stamina" : "sparring stamina"}${moveId === "guard" ? "; guard raised for this turn" : ""}.`);
  }
  if (move.multiplier) strike(combat, "player", move.multiplier, false, emit);
  if (combat.enemy.hp === 0) return finish("victory");

  const intent = getCombatIntent(combat);
  emit("turn", "enemy", `${combat.enemy.name}'s turn.`);
  if (intent.kind === "attack") {
    emit("use", "enemy", `${combat.enemy.name} uses ${intent.label.toLowerCase()}.`, "enemy_attack");
    strike(combat, "enemy", intent.multiplier, moveId === "guard", emit);
  } else {
    emit("wait", "enemy", intent.description);
  }
  if (combat.player.hp === 0) return finish("defeat");
  combat.round += 1;
  return { combat, frames };
}

export function performCombatMove(state, moveId) {
  const { combat } = resolveCombatTurn(state.combat, moveId);
  if (combat === state.combat) return state;
  return {
    ...state, combat,
    actionLog: combat.status === "active" ? state.actionLog
      : [results[combat.status], ...state.actionLog].slice(0, 50),
  };
}

export function dismissCombat(state) {
  if (!state.combat || state.combat.status === "active") return state;
  return { ...state, combat: null };
}

// Reject incomplete/corrupt encounters rather than strand the player on load.
export function normalizeCombat(combat, area) {
  if (!combat || combat.version !== 1 || !Object.hasOwn(encounters, combat.encounterId)) return null;
  if (encounters[combat.encounterId].area !== area
    || !["active", "victory", "defeat", "retreat"].includes(combat.status)
    || !Number.isSafeInteger(combat.round) || combat.round < 1
    || !Number.isInteger(combat.seed) || combat.seed < 0 || combat.seed > 4294967295) return null;
  for (const fighter of [combat.player, combat.enemy]) {
    if (!fighter || typeof fighter.name !== "string") return null;
    for (const stat of ["hp", "maxHp", "attackPower", "defense", "guardPower", "accuracy", "evasion", "criticalChance"]) {
      if (!Number.isFinite(fighter[stat]) || fighter[stat] < 0) return null;
    }
    if (fighter.maxHp <= 0 || fighter.hp > fighter.maxHp) return null;
  }
  const { player, enemy, status } = combat;
  if (!Number.isFinite(player.stamina) || !Number.isFinite(player.maxStamina)
    || player.stamina < 0 || player.maxStamina <= 0 || player.stamina > player.maxStamina) return null;
  if ((status === "active" && (player.hp === 0 || enemy.hp === 0))
    || (status === "victory" && (enemy.hp !== 0 || player.hp === 0))
    || (status === "defeat" && (player.hp !== 0 || enemy.hp === 0))) return null;
  if (!Array.isArray(combat.log) || !combat.log.every((entry) => entry
    && Number.isSafeInteger(entry.round) && entry.round >= 0
    && Array.isArray(entry.messages) && entry.messages.every((message) => typeof message === "string"))) return null;
  if (combat.encounterId === "chaos_fragment" && !isValidDivineTutorial(combat)) return null;
  return { ...combat, log: combat.log.slice(0, 50) };
}
