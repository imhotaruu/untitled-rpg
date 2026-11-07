function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function addLog(logList, message) {
  return [message, ...logList].slice(0, 50);
}

function recoverStat(player, stat, maxStat, regenStat, deltaSeconds) {
  if (typeof player[stat] !== "number") return;
  if (typeof player[maxStat] !== "number") return;

  const regenRate = player[regenStat] ?? 0;

  player[stat] = Math.min(
    player[maxStat],
    player[stat] + regenRate * deltaSeconds
  );
}

function isRecoveryComplete(player) {
  return player.stamina >= player.maxStamina - 0.001;
}

export function processGameTick(currentState, deltaSeconds) {
  if (currentState.narrative?.phase === "prologue") return currentState;
  if (currentState.combat || currentState.conversation || currentState.exploration?.pending) return currentState;
  if (!currentState.player.isResting) {
    return currentState;
  }

  const nextState = clone(currentState);
  const player = nextState.player;

  recoverStat(player, "stamina", "maxStamina", "staminaRegen", deltaSeconds);

  if (isRecoveryComplete(player)) {
    player.stamina = player.maxStamina;
    player.isResting = false;

    nextState.actionLog = addLog(
      nextState.actionLog,
      "Your stamina is fully restored."
    );
  }

  return nextState;
}
