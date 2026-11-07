import { divineMoves, divinePhases, getDivinePhase, isDivineMoveAvailable } from "../data/divineTutorial";

// A bounded six-step encounter. It shares the normal playback interface but
// doesn't unlock spells or modify the protagonist's persistent combat rules.
export function resolveDivineTutorial(current, moveId) {
  const unchanged = { combat: current, frames: [] };
  if (moveId === "continue_tutorial") {
    if (!current.tutorial?.reading) return unchanged;
    return { combat: { ...current, tutorial: { ...current.tutorial, reading: null } }, frames: [] };
  }
  if (!isDivineMoveAvailable(current, moveId)) return unchanged;
  const move = divineMoves.find((entry) => entry.id === moveId);
  if (!move || current.player.stamina < move.cost || current.player.mp < (move.manaCost || 0)) return unchanged;
  const combat = structuredClone(current);
  const phase = getDivinePhase(combat);
  const messages = [];
  const frames = [];
  function emit(kind, actor, message, action = null) {
    messages.push(message);
    frames.push({ kind, actor, message, action, player: { ...combat.player }, enemy: { ...combat.enemy } });
  }
  function damageEnemy(amount) {
    const damage = Math.min(amount, combat.enemy.hp);
    combat.enemy.hp -= damage;
    emit("hit", "player", `${move.label} hits the Fragment of Chaos for ${damage} damage.`);
  }
  function enemyAttack(amount, ward = false) {
    emit("turn", "enemy", "The Fragment of Chaos attacks.");
    const damage = Math.min(combat.player.hp - 1, ward ? Math.ceil(amount * .25) : amount);
    combat.player.hp -= damage;
    emit("hit", "enemy", ward
      ? `Astral Ward absorbs the wave. Astraea takes ${damage} damage instead of ${amount}.`
      : `The fragment's desperate assault hits Astraea for ${damage} damage.`);
  }
  combat.player.stamina -= move.cost;
  combat.player.mp -= move.manaCost || 0;
  emit("use", "player", `Astraea uses ${move.label}.`, moveId);
  if (phase.id === "strike") damageEnemy(9);
  if (phase.id === "ward") {
    emit("restore", "player", "Thousands of tiny lights form a translucent celestial shield.");
    enemyAttack(16, true);
    combat.enemy.evasion = 75;
  }
  if (phase.id === "guidance") {
    combat.tutorial.guided = true;
    emit("restore", "player", "A tiny star reveals the fragment's movements. Astraea's next physical strike will find its mark.");
  }
  if (phase.id === "guided_strike") {
    damageEnemy(14);
    combat.tutorial.guided = false;
    combat.enemy.evasion = 0;
    enemyAttack(14);
  }
  if (phase.id === "mend") {
    const healed = Math.min(12, combat.player.maxHp - combat.player.hp);
    combat.player.hp += healed;
    emit("restore", "player", `Starlight Mend restores ${healed} health.`);
  }
  if (phase.id === "finisher") {
    damageEnemy(combat.enemy.hp);
    combat.status = "victory";
    emit("result", null, "The fragment dissolves into particles of fading darkness. Primordial Chaos still presses against the seal.");
  }
  const nextPhase = divinePhases[divinePhases.indexOf(phase) + 1];
  combat.tutorial = { ...combat.tutorial, phase: nextPhase?.id || "complete", reading: phase.id };
  combat.log = [{ round: combat.round, messages }, ...combat.log].slice(0, 50);
  combat.round += 1;
  return { combat, frames };
}

export function isValidDivineTutorial(combat) {
  if (combat?.tutorialVersion !== 2 || !combat.tutorial) return false;
  const index = combat.tutorial.phase === "complete" ? divinePhases.length
    : divinePhases.findIndex((phase) => phase.id === combat.tutorial.phase);
  if (index < 0 || combat.round !== index + 1) return false;
  if (combat.tutorial.reading !== null && combat.tutorial.reading !== divinePhases[index - 1]?.id) return false;
  if (typeof combat.tutorial.guided !== "boolean" || combat.tutorial.guided !== (combat.tutorial.phase === "guided_strike")) return false;
  if (combat.status !== (index === divinePhases.length ? "victory" : "active")) return false;
  const remaining = divinePhases.slice(index).map((phase) => divineMoves.find((move) => move.id === phase.moveId));
  const manaNeeded = remaining.reduce((sum, move) => sum + (move.manaCost || 0), 0);
  const staminaNeeded = remaining.reduce((sum, move) => sum + move.cost, 0);
  return Number.isFinite(combat.player.mp) && Number.isFinite(combat.player.maxMp)
    && combat.player.maxMp > 0 && combat.player.mp >= manaNeeded && combat.player.mp <= combat.player.maxMp
    && combat.player.stamina >= staminaNeeded;
}
